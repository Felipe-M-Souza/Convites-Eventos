import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.PORT || 3000)
const HOST = '0.0.0.0'
const BUCKET = process.env.GUEST_UPLOADS_BUCKET || 'invite-guest-uploads'
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const VIDEO_WORKER_SECRET = process.env.VIDEO_WORKER_SECRET || ''
const VIDEO_OUTPUT_MAX_WIDTH = Number(process.env.VIDEO_OUTPUT_MAX_WIDTH || 1280)
const VIDEO_OUTPUT_CRF = Number(process.env.VIDEO_OUTPUT_CRF || 28)
const VIDEO_OUTPUT_PRESET = process.env.VIDEO_OUTPUT_PRESET || 'veryfast'
const VIDEO_AUDIO_BITRATE = process.env.VIDEO_AUDIO_BITRATE || '128k'
const CLEANUP_INTERVAL_MINUTES = Number(process.env.CLEANUP_INTERVAL_MINUTES || 60)
const CLEANUP_BATCH_SIZE = Number(process.env.CLEANUP_BATCH_SIZE || 100)

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VIDEO_WORKER_SECRET) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VIDEO_WORKER_SECRET',
  )
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const inFlightUploads = new Set()

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

function log(message, meta) {
  if (meta) {
    console.log(`[video-worker] ${message}`, meta)
    return
  }
  console.log(`[video-worker] ${message}`)
}

function safeErrorMessage(error) {
  if (error instanceof Error && error.message) return error.message
  return 'PROCESSING_FAILED'
}

function buildProcessedPath(inviteSlug, uploadId) {
  return `${inviteSlug}/processed/${uploadId}.mp4`
}

function getAuthToken(request) {
  const authHeader = request.headers.authorization?.trim()
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim()
  }

  const secretHeader = request.headers['x-video-worker-secret']
  return Array.isArray(secretHeader) ? secretHeader[0]?.trim() : secretHeader?.trim()
}

function isAuthorized(request) {
  const provided = getAuthToken(request)
  if (!provided) return false

  const expectedBuffer = Buffer.from(VIDEO_WORKER_SECRET)
  const providedBuffer = Buffer.from(provided)
  if (expectedBuffer.length !== providedBuffer.length) return false

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 1024 * 1024) {
        reject(new Error('PAYLOAD_TOO_LARGE'))
        request.destroy()
      }
    })

    request.on('end', () => {
      if (!body) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('INVALID_JSON'))
      }
    })

    request.on('error', reject)
  })
}

async function fetchUpload(uploadId) {
  const { data, error } = await supabase
    .from('guest_uploads')
    .select(
      'id, invite_slug, file_type, mime_type, storage_path, processed_storage_path, processing_status, processing_error',
    )
    .eq('id', uploadId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('UPLOAD_NOT_FOUND')
  return data
}

async function updateUpload(uploadId, patch) {
  const { error } = await supabase.from('guest_uploads').update(patch).eq('id', uploadId)
  if (error) throw new Error(error.message)
}

async function markUploadFailed(uploadId, error) {
  const message = safeErrorMessage(error)
  try {
    await updateUpload(uploadId, {
      processing_status: 'failed',
      processing_error: message,
    })
  } catch (updateError) {
    log('failed to update upload error state', {
      uploadId,
      error: safeErrorMessage(updateError),
      originalError: message,
    })
  }
}

async function cleanupExpiredUploads() {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('guest_uploads')
    .select('id, storage_path, processed_storage_path, expires_at, deleted_at')
    .is('deleted_at', null)
    .lte('expires_at', nowIso)
    .limit(CLEANUP_BATCH_SIZE)

  if (error) throw new Error(error.message)
  const rows = data ?? []
  if (!rows.length) return { removed: 0 }

  for (const row of rows) {
    const paths = [row.storage_path, row.processed_storage_path].filter(Boolean)
    if (paths.length) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths)
      if (removeError) throw new Error(removeError.message)
    }
    await updateUpload(row.id, { deleted_at: new Date().toISOString() })
  }

  log('expired uploads cleaned up', { count: rows.length })
  return { removed: rows.length }
}

function runFfmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const scaleFilter = `scale='min(${VIDEO_OUTPUT_MAX_WIDTH},iw)':-2`
    const args = [
      '-y',
      '-i',
      inputPath,
      '-vf',
      scaleFilter,
      '-c:v',
      'libx264',
      '-preset',
      VIDEO_OUTPUT_PRESET,
      '-crf',
      String(VIDEO_OUTPUT_CRF),
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-c:a',
      'aac',
      '-b:a',
      VIDEO_AUDIO_BITRATE,
      '-ac',
      '2',
      outputPath,
    ]

    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      reject(new Error(`FFMPEG_START_FAILED: ${safeErrorMessage(error)}`))
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      const details = stderr.trim().split('\n').slice(-12).join('\n')
      reject(new Error(`FFMPEG_FAILED: ${details || `exit code ${code}`}`))
    })
  })
}

async function processUpload(uploadId) {
  const upload = await fetchUpload(uploadId)

  if (upload.file_type !== 'video') {
    log('skipping non-video upload', { uploadId })
    return { skipped: 'not-video' }
  }

  if (upload.processing_status === 'ready' && upload.processed_storage_path) {
    log('skipping already processed upload', { uploadId })
    return { skipped: 'already-ready' }
  }

  if (upload.processing_status === 'processing') {
    log('skipping upload already in progress', { uploadId })
    return { skipped: 'already-processing' }
  }

  await updateUpload(uploadId, {
    processing_status: 'processing',
    processing_error: null,
  })

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `guest-video-${uploadId}-`))
  const sourceName = path.basename(upload.storage_path || `${uploadId}.bin`)
  const inputPath = path.join(tempDir, `source-${sourceName}`)
  const outputPath = path.join(tempDir, `processed-${uploadId}.mp4`)

  try {
    log('downloading original video', { uploadId, storagePath: upload.storage_path })

    const { data: originalFile, error: downloadError } = await supabase.storage.from(BUCKET).download(upload.storage_path)
    if (downloadError) throw new Error(downloadError.message)

    const originalBuffer = Buffer.from(await originalFile.arrayBuffer())
    await fs.writeFile(inputPath, originalBuffer)

    log('running ffmpeg', { uploadId })
    await runFfmpeg(inputPath, outputPath)

    const processedBuffer = await fs.readFile(outputPath)
    const processedPath = upload.processed_storage_path || buildProcessedPath(upload.invite_slug, upload.id)

    log('uploading processed video', { uploadId, processedPath, processedBytes: processedBuffer.byteLength })
    const { error: storageError } = await supabase.storage.from(BUCKET).upload(processedPath, processedBuffer, {
      contentType: 'video/mp4',
      upsert: true,
    })
    if (storageError) throw new Error(storageError.message)

    await updateUpload(uploadId, {
      processed_storage_path: processedPath,
      processed_file_size_bytes: processedBuffer.byteLength,
      processing_status: 'ready',
      processing_error: null,
    })

    log('upload processed successfully', {
      uploadId,
      processedPath,
      processedBytes: processedBuffer.byteLength,
    })

    return { processedPath, processedBytes: processedBuffer.byteLength }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

function dispatchProcessing(uploadId) {
  if (inFlightUploads.has(uploadId)) {
    log('duplicate job ignored', { uploadId })
    return
  }

  inFlightUploads.add(uploadId)
  void processUpload(uploadId)
    .catch(async (error) => {
      log('processing failed', { uploadId, error: safeErrorMessage(error) })
      await markUploadFailed(uploadId, error)
    })
    .finally(() => {
      inFlightUploads.delete(uploadId)
    })
}

function scheduleCleanupLoop() {
  const everyMs = Math.max(5, CLEANUP_INTERVAL_MINUTES) * 60 * 1000
  void cleanupExpiredUploads().catch((error) => {
    log('initial cleanup failed', { error: safeErrorMessage(error) })
  })

  setInterval(() => {
    void cleanupExpiredUploads().catch((error) => {
      log('scheduled cleanup failed', { error: safeErrorMessage(error) })
    })
  }, everyMs)
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    json(response, 200, { ok: true })
    return
  }

  if (request.method === 'POST' && request.url === '/cleanup') {
    if (!isAuthorized(request)) {
      json(response, 401, { error: 'UNAUTHORIZED' })
      return
    }

    try {
      const result = await cleanupExpiredUploads()
      json(response, 200, result)
    } catch (error) {
      json(response, 500, { error: safeErrorMessage(error) })
    }
    return
  }

  if (request.method !== 'POST' || request.url !== '/process') {
    json(response, 404, { error: 'NOT_FOUND' })
    return
  }

  if (!isAuthorized(request)) {
    json(response, 401, { error: 'UNAUTHORIZED' })
    return
  }

  try {
    const body = await readJsonBody(request)
    const uploadId = typeof body?.uploadId === 'string' ? body.uploadId.trim() : ''

    if (!uploadId) {
      json(response, 400, { error: 'INVALID_UPLOAD_ID' })
      return
    }

    dispatchProcessing(uploadId)
    json(response, 202, { accepted: true, uploadId })
  } catch (error) {
    const message = safeErrorMessage(error)
    const status = message === 'INVALID_JSON' ? 400 : message === 'PAYLOAD_TOO_LARGE' ? 413 : 500
    json(response, status, { error: message })
  }
})

server.listen(PORT, HOST, () => {
  log(`listening on http://${HOST}:${PORT}`)
  scheduleCleanupLoop()
})

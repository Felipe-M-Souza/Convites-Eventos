// Supabase Edge Function: process-guest-video
// Esta função apenas despacha o job para o worker externo no Railway.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RAILWAY_VIDEO_WORKER_URL = Deno.env.get('RAILWAY_VIDEO_WORKER_URL') ?? ''
const RAILWAY_VIDEO_WORKER_SECRET = Deno.env.get('RAILWAY_VIDEO_WORKER_SECRET') ?? ''
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  })
}

async function dispatchUpload(uploadId: string) {
  if (!RAILWAY_VIDEO_WORKER_URL || !RAILWAY_VIDEO_WORKER_SECRET) {
    throw new Error('VIDEO_WORKER_NOT_CONFIGURED')
  }

  const response = await fetch(RAILWAY_VIDEO_WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RAILWAY_VIDEO_WORKER_SECRET}`,
    },
    body: JSON.stringify({ uploadId }),
  })

  if (response.ok) {
    return
  }

  const details = await response.text().catch(() => '')
  throw new Error(`WORKER_DISPATCH_FAILED: ${response.status}${details ? ` ${details}` : ''}`)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (request.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 })
  }

  const { uploadId } = await request.json().catch(() => ({ uploadId: '' }))
  if (!uploadId || typeof uploadId !== 'string') {
    return json({ error: 'INVALID_UPLOAD_ID' }, { status: 400 })
  }

  EdgeRuntime.waitUntil(
    dispatchUpload(uploadId).catch(async (error) => {
      await supabase
        .from('guest_uploads')
        .update({
          processing_status: 'failed',
          processing_error: error instanceof Error ? error.message : 'PROCESSING_FAILED',
        })
        .eq('id', uploadId)
    }),
  )

  return json({ accepted: true, uploadId }, { status: 202 })
})

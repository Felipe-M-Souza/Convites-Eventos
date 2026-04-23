import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const captures = [
  { slug: 'demo-aniversario-infantil', fileBase: 'aniversario-infantil' },
  { slug: 'demo-festa-15-anos', fileBase: '15-anos' },
  { slug: 'demo-cha-de-bebe', fileBase: 'cha-de-bebe' },
  { slug: 'demo-cha-revelacao', fileBase: 'cha-revelacao' },
  { slug: 'demo-aniversario-adulto', fileBase: 'aniversario-adulto' },
  { slug: 'demo-homenagem', fileBase: 'homenagem' },
]

function readBaseUrl() {
  const arg = process.argv.find((value) => value.startsWith('--base-url='))
  if (arg) return arg.slice('--base-url='.length)
  return process.env.CAPTURE_BASE_URL || 'http://localhost:5173'
}

const OPENING_WAIT_AFTER_CLICK_MS = 3900
const PAGE_SCROLL_STEP_COUNT = 6

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function screenshot(page, filePath, fullPage = false) {
  await page.screenshot({
    path: filePath,
    fullPage,
  })
}

async function capturePage(page, { slug, fileBase }, outDir, baseUrl) {
  const url = new URL(`/c/${slug}`, baseUrl).toString()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.setViewportSize({ width: 1080, height: 1920 })
  await page.waitForTimeout(600)

  await screenshot(page, path.join(outDir, `${fileBase}-closed.png`))

  const openButton = page.getByRole('button', { name: /clique no selo para abrir o convite/i })
  if (await openButton.count()) {
    await openButton.click()
    await page.waitForTimeout(900)
    await screenshot(page, path.join(outDir, `${fileBase}-open.png`))
    await page.waitForTimeout(OPENING_WAIT_AFTER_CLICK_MS)
  } else {
    await screenshot(page, path.join(outDir, `${fileBase}-open.png`))
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(400)
  await screenshot(page, path.join(outDir, `${fileBase}-page-top.png`))

  const maxScroll = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - window.innerHeight))
  for (let index = 0; index < PAGE_SCROLL_STEP_COUNT; index += 1) {
    const ratio = PAGE_SCROLL_STEP_COUNT === 1 ? 0 : index / (PAGE_SCROLL_STEP_COUNT - 1)
    const top = Math.round(maxScroll * ratio)
    await page.evaluate((nextTop) => window.scrollTo({ top: nextTop, behavior: 'instant' }), top)
    await page.waitForTimeout(550)
    await screenshot(page, path.join(outDir, `${fileBase}-page-step-${String(index + 1).padStart(2, '0')}.png`))
  }

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
  await page.waitForTimeout(900)
  await screenshot(page, path.join(outDir, `${fileBase}-page-bottom.png`))

  console.log(
    `capturado: ${slug} -> ${fileBase}-[closed|open|page-top|page-step-01..${String(PAGE_SCROLL_STEP_COUNT).padStart(2, '0')}|page-bottom].png`,
  )
}

async function main() {
  const baseUrl = readBaseUrl()
  const outDir = path.resolve('public', 'remotion-captures')
  await ensureDir(outDir)

  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  })

  try {
    for (const item of captures) {
      await capturePage(page, item, outDir, baseUrl)
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

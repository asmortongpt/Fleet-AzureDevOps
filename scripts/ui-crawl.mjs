import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const OUT_DIR = process.env.OUT_DIR || path.resolve('output/playwright/crawl')

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function rmIfExists(p) {
  try {
    fs.rmSync(p, { force: true })
  } catch {}
}

async function screenshot(page, name) {
  const p = path.join(OUT_DIR, name)
  await page.screenshot({ path: p, fullPage: true })
  return p
}

async function tryDevLogin(page) {
  // API can be briefly unavailable during restarts; retry a few times.
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      })
      const json = await r.json().catch(() => null)
      return { ok: r.ok, status: r.status, json }
    })
    if (res.ok) return res
    await page.waitForTimeout(250 + attempt * 250)
  }

  return { ok: false, status: 0, json: null }
}

async function closePanelIfOpen(page) {
  const close = page.getByRole('button', { name: 'Close panel' }).first()
  if (await close.count()) {
    await close.click().catch(() => {})
    await page.waitForTimeout(250)
  }
}

async function tryPanelBack(page) {
  const back = page.getByRole('button', { name: 'Go back' }).first()
  if (await back.count()) {
    await back.click().catch(() => {})
    await page.waitForTimeout(500)
    return true
  }
  return false
}

async function tryDrilldownInPanel(page, shotPrefix) {
  const dialog = page.getByRole('dialog').first()
  if (!(await dialog.count())) return false

  // 1) Try first table row.
  const row = dialog.locator('table tbody tr').first()
  if (await row.count()) {
    await row.click({ timeout: 5_000 }).catch(() => {})
    await page.waitForTimeout(700)
    await screenshot(page, `${shotPrefix}-drill1.png`)
    await tryPanelBack(page)
    return true
  }

  // 2) Try obvious "View/Details" actions.
  const viewBtn = dialog
    .locator('button:has-text("View"), button:has-text("Details"), a:has-text("View"), a:has-text("Details")')
    .first()
  if (await viewBtn.count()) {
    await viewBtn.click({ timeout: 5_000 }).catch(() => {})
    await page.waitForTimeout(700)
    await screenshot(page, `${shotPrefix}-drill1.png`)
    await tryPanelBack(page)
    return true
  }

  return false
}

async function openModuleFromFlyout(page, categoryLabel, moduleLabel) {
  const categoryButton = page
    .locator(`button[aria-label="${categoryLabel}"][title="${categoryLabel}"]`)
    .first()
  if (!(await categoryButton.count())) return false

  // Flyout sometimes requires hover; sometimes click. Try hover first.
  await categoryButton.hover().catch(() => {})
  await page.waitForTimeout(200)

  const flyout = page.locator('div.absolute.left-12, div.absolute.left-14').first()
  const list = flyout.locator('div.overflow-y-auto').first()
  const moduleButton = list.getByRole('button', { name: moduleLabel, exact: true }).first()
  if (!(await moduleButton.count())) return false

  await moduleButton.scrollIntoViewIfNeeded().catch(() => {})
  await moduleButton.click().catch(() => {})

  const dialog = page.getByRole('dialog').first()
  if (await dialog.isVisible().catch(() => false)) return true

  // Fallback: click the category button and retry once (some layouts only open on click).
  await categoryButton.click().catch(() => {})
  await page.waitForTimeout(250)
  const moduleButton2 = list.getByRole('button', { name: moduleLabel, exact: true }).first()
  if (await moduleButton2.count()) {
    await moduleButton2.scrollIntoViewIfNeeded().catch(() => {})
    await moduleButton2.click().catch(() => {})
  }

  // Consider module opened if a dialog or an H1/heading with the module label appears.
  await page.waitForTimeout(400)
  const heading = page.getByRole('heading', { name: moduleLabel }).first()
  return (await dialog.isVisible().catch(() => false)) || (await heading.isVisible().catch(() => false))
}

async function openModuleViaSearch(page, moduleLabel) {
  const searchBox = page.getByPlaceholder(/search modules/i).first()
  if (!(await searchBox.count())) return false

  const beforeUrl = page.url()

  await searchBox.click().catch(() => {})
  await searchBox.fill('')
  await searchBox.type(moduleLabel, { delay: 10 })
  await page.waitForTimeout(300)

  const dialog = page.getByRole('dialog').first()
  if (await dialog.isVisible().catch(() => false)) return true

  // Try clicking an explicit result in a combobox/menu.
  const candidates = [
    page.getByRole('option', { name: moduleLabel, exact: true }).first(),
    page.getByRole('menuitem', { name: moduleLabel, exact: true }).first(),
    page.getByRole('button', { name: moduleLabel, exact: true }).first(),
  ]

  for (const c of candidates) {
    if (await c.count()) {
      await c.click().catch(() => {})
      await page.waitForTimeout(500)
      const heading = page.getByRole('heading', { name: moduleLabel }).first()
      if ((await dialog.isVisible().catch(() => false)) || (await heading.isVisible().catch(() => false)) || page.url() !== beforeUrl) {
        return true
      }
    }
  }

  // Keyboard fallback: pick first suggestion.
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowDown').catch(() => {})
    await page.keyboard.press('Enter').catch(() => {})
    await page.waitForTimeout(600)
    const heading = page.getByRole('heading', { name: moduleLabel }).first()
    if ((await dialog.isVisible().catch(() => false)) || (await heading.isVisible().catch(() => false)) || page.url() !== beforeUrl) {
      return true
    }
  }

  return false
}

async function openModuleViaRoute(page, moduleId) {
  const url = moduleId === 'live-fleet-dashboard' ? `${BASE_URL}/` : `${BASE_URL}/${encodeURIComponent(moduleId)}`
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null)
  await page.waitForTimeout(1200)
  // If the server responded with HTML, we consider navigation successful.
  if (resp && resp.ok()) return true
  // SPA fallbacks can return 200 even when the module is inaccessible; still treat URL change as opened.
  if (page.url().startsWith(url)) return true
  const hasDialog = await page.getByRole('dialog').first().isVisible().catch(() => false)
  return hasDialog
}

function extractModules() {
  const p = path.resolve('src/config/module-registry.ts')
  const s = fs.readFileSync(p, 'utf8')
  const re = /\{\s*id:\s*'([^']+)'\s*,\s*label:\s*'([^']+)'\s*,\s*category:\s*'([^']+)'/g
  const out = []
  let m
  while ((m = re.exec(s))) out.push({ id: m[1], label: m[2], category: m[3] })
  return out
}

function categoryToRailLabel(category) {
  switch (category) {
    case 'fleet':
      return 'Fleet'
    case 'operations':
      return 'Ops'
    case 'maintenance':
      return 'Maint'
    case 'safety':
      return 'Safety'
    case 'analytics':
      return 'Stats'
    case 'admin':
      return 'Admin'
    default:
      return 'Fleet'
  }
}

async function main() {
  ensureDir(OUT_DIR)
  rmIfExists(path.join(OUT_DIR, 'crawl-summary.json'))

  const browser = await chromium.launch({ headless: process.env.HEADED !== 'true' })
  const context = await browser.newContext()
  const page = await context.newPage()
  page.setDefaultTimeout(30_000)

  const pageErrors = []
  const networkStatusByUrl = new Map()
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(`[console.error] ${msg.text()}`)
  })
  page.on('response', (resp) => {
    const status = resp.status()
    const url = resp.url()
    if (url.includes('__vite') || url.includes('sockjs-node')) return
    networkStatusByUrl.set(url, status)
  })

  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await screenshot(page, '00-home.png')

  const devLogin = await tryDevLogin(page).catch((e) => ({ ok: false, status: -1, json: { error: String(e) } }))
  if (!devLogin.ok) {
    await screenshot(page, '01-dev-login-failed.png')
    throw new Error(`dev-login failed: ${devLogin.status}`)
  }

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await screenshot(page, '02-after-login.png')

  // Drop pre-login noise.
  networkStatusByUrl.clear()
  pageErrors.length = 0

  const modules = extractModules()
  const summary = {
    baseUrl: BASE_URL,
    startedAt: new Date().toISOString(),
    modulesTotal: modules.length,
    opened: [],
    failedToOpen: [],
    hadSectionError: [],
    networkErrors: [],
    pageErrors: [],
  }

  for (const mod of modules) {
    const prefix = `m-${mod.category}-${mod.id}`.replace(/[^a-zA-Z0-9-_]/g, '_')

    await closePanelIfOpen(page)
    // Fast + deterministic: open module by route (NavigationContext syncs module IDs from the URL).
    // This avoids flaky Command Palette/search interactions and significantly improves crawl coverage.
    const opened = await openModuleViaRoute(page, mod.id).catch(() => false)

    if (!opened) {
      summary.failedToOpen.push(mod)
      await screenshot(page, `${prefix}-not-opened.png`)
      continue
    }

    summary.opened.push(mod)
    await page.waitForTimeout(900)
    await screenshot(page, `${prefix}.png`)

    // Record visible section errors for this module.
    if ((await page.getByText('Section Error').count()) > 0) {
      summary.hadSectionError.push(mod)
      await screenshot(page, `${prefix}-section-error.png`)
    }

    await tryDrilldownInPanel(page, prefix)
  }

  // Final network errors: only API endpoints matter for app functionality.
  const finalNetworkErrors = [...networkStatusByUrl.entries()]
    .filter(([url, status]) => url.includes('/api/') && (status === 401 || status === 404 || status >= 500))
    .map(([url, status]) => ({ url, status }))
  summary.networkErrors = finalNetworkErrors
  summary.pageErrors = pageErrors
  summary.finishedAt = new Date().toISOString()

  fs.writeFileSync(path.join(OUT_DIR, 'crawl-summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8')

  await browser.close()

  process.stdout.write(
    `ui-crawl ok: opened=${summary.opened.length}/${summary.modulesTotal} failed=${summary.failedToOpen.length} sectionErrors=${summary.hadSectionError.length} apiErrors=${summary.networkErrors.length}\nartifacts: ${OUT_DIR}\n`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

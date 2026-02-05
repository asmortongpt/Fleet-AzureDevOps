import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const OUT_DIR = process.env.OUT_DIR || path.resolve('output/playwright')

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

async function screenshot(page, name) {
  const p = path.join(OUT_DIR, name)
  await page.screenshot({ path: p, fullPage: true })
  return p
}

async function tryDevLogin(page) {
  // Uses browser fetch so cookies are set via Vite proxy (/api -> backend)
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
  return res
}

async function apiGet(page, url) {
  const res = await page.evaluate(async (u) => {
    const r = await fetch(u, { credentials: 'include' })
    const text = await r.text()
    return { ok: r.ok, status: r.status, text }
  }, url)
  return res
}

async function clickSidebar(page, label, shot) {
  const el = page.getByText(label, { exact: true }).first()
  if (await el.count()) {
    await el.click({ timeout: 5_000 })
    await page.waitForTimeout(1200)
    await screenshot(page, shot)
    return true
  }
  return false
}

async function main() {
  ensureDir(OUT_DIR)

  const browser = await chromium.launch({
    headless: process.env.HEADED !== 'true',
  })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.setDefaultTimeout(30_000)

  async function goto(pathname, shot) {
    const url = `${BASE_URL}${pathname}`
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
    await screenshot(page, shot)
  }

  await goto('', '01-home.png')

  // If we're on the login screen, do dev-login to establish an auth cookie.
  const loginButton = page.getByRole('button', { name: /sign in with microsoft/i })
  if (await loginButton.count()) {
    const devLogin = await tryDevLogin(page)
    if (!devLogin.ok) {
      // Capture state for debugging instead of failing silently.
      await screenshot(page, '02-dev-login-failed.png')
      throw new Error(`dev-login failed: ${devLogin.status}`)
    }

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
  }

  await screenshot(page, '03-after-login.png')

  // KPI sanity: no "undefined%" should appear.
  const undefinedCount = await page.locator('text=/undefined%/i').count()
  if (undefinedCount > 0) {
    await screenshot(page, '04-kpi-undefined.png')
    throw new Error('KPI strip contains "undefined%"')
  }

  // API sanity: these must be connected and return JSON.
  for (const url of [
    '/api/dashboard/stats',
    '/api/incidents?limit=1&status=open',
    '/api/heavy-equipment',
  ]) {
    const r = await apiGet(page, url)
    if (!r.ok) {
      await screenshot(page, `api-fail-${encodeURIComponent(url)}.png`)
      throw new Error(`API GET failed (${r.status}): ${url}`)
    }
    try {
      JSON.parse(r.text)
    } catch {
      await screenshot(page, `api-nonjson-${encodeURIComponent(url)}.png`)
      throw new Error(`API GET non-JSON: ${url}`)
    }
  }

  // Map sanity: try to wait for any map canvas/tiles to appear.
  await page.waitForTimeout(1500)
  await screenshot(page, '05-map.png')

  // Try the global module search (from the UI screenshot: "Search modules, vehi...")
  const searchBox = page.getByPlaceholder(/search modules/i)
  if (await searchBox.count()) {
    await searchBox.click()
    await searchBox.fill('equipment')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1500)
    await screenshot(page, '06-search-equipment.png')
  }

  // Sidebar navigation sanity: capture key modules if present.
  await clickSidebar(page, 'Fleet', '07-nav-fleet.png')
  await clickSidebar(page, 'Ops', '08-nav-ops.png')
  await clickSidebar(page, 'Maint', '09-nav-maint.png')
  await clickSidebar(page, 'Safety', '10-nav-safety.png')
  await clickSidebar(page, 'Stats', '11-nav-stats.png')
  await clickSidebar(page, 'Admin', '12-nav-admin.png')

  // Direct route sanity (many hubs support direct routing).
  const routes = [
    ['/fleet', '13-route-fleet.png'],
    ['/drivers', '14-route-drivers.png'],
    ['/maintenance', '15-route-maintenance.png'],
    ['/incidents', '16-route-incidents.png'],
    ['/inventory', '17-route-inventory.png'],
    ['/compliance', '18-route-compliance.png'],
  ]
  for (const [p, shot] of routes) {
    await goto(p, shot)
  }

  await browser.close()

  // Emit a stable summary for CI/console.
  process.stdout.write(`ui-smoke ok: ${BASE_URL}\nartifacts: ${OUT_DIR}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

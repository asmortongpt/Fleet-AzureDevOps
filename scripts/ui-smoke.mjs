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

async function closePanelIfOpen(page) {
  const close = page.getByRole('button', { name: 'Close panel' }).first()
  if (await close.count()) {
    await close.click().catch(() => {})
    await page.waitForTimeout(300)
  }
}

async function tryPanelBack(page) {
  const back = page.getByRole('button', { name: 'Go back' }).first()
  if (await back.count()) {
    await back.click().catch(() => {})
    await page.waitForTimeout(600)
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
    await page.waitForTimeout(900)
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
    await page.waitForTimeout(900)
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

  await categoryButton.hover()
  await page.waitForTimeout(250)

  // Flyout is a scrollable list that appears next to the rail.
  const flyout = page.locator('div.absolute.left-12, div.absolute.left-14').first()
  const list = flyout.locator('div.overflow-y-auto').first()
  const moduleButton = list.getByRole('button', { name: moduleLabel, exact: true }).first()
  if (!(await moduleButton.count())) return false

  await moduleButton.scrollIntoViewIfNeeded().catch(() => {})
  await moduleButton.click().catch(() => {})

  // Wait for right-side panel dialog to appear.
  const dialog = page.getByRole('dialog').first()
  await dialog.waitFor({ state: 'visible', timeout: 20_000 })
  return true
}

async function openModuleViaSearch(page, moduleLabel) {
  const searchBox = page.getByPlaceholder(/search modules/i).first()
  if (!(await searchBox.count())) return false

  await searchBox.click().catch(() => {})
  await searchBox.fill('')
  await searchBox.type(moduleLabel, { delay: 10 })
  await page.waitForTimeout(250)
  await page.keyboard.press('Enter').catch(() => {})

  const dialog = page.getByRole('dialog').first()
  await dialog.waitFor({ state: 'visible', timeout: 20_000 })
  return true
}

async function main() {
  ensureDir(OUT_DIR)

  const browser = await chromium.launch({
    headless: process.env.HEADED !== 'true',
  })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.setDefaultTimeout(30_000)

  const pageErrors = []
  const networkErrors = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(`[console.error] ${msg.text()}`)
  })
  page.on('response', (resp) => {
    const status = resp.status()
    if (status < 400) return
    const url = resp.url()
    // Ignore dev tooling noise.
    if (url.includes('__vite') || url.includes('sockjs-node')) return
    if (status === 401 || status === 404 || status >= 500) {
      networkErrors.push(`[${status}] ${url}`)
    }
  })

  async function dumpErrors(label) {
    if (!pageErrors.length) return
    const p = path.join(OUT_DIR, `page-errors-${label}.log`)
    fs.writeFileSync(p, pageErrors.join('\n') + '\n', 'utf8')
  }

  async function dumpNetwork(label) {
    if (!networkErrors.length) return
    const p = path.join(OUT_DIR, `network-errors-${label}.log`)
    fs.writeFileSync(p, [...new Set(networkErrors)].join('\n') + '\n', 'utf8')
  }

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
    '/api/service-bays',
  ]) {
    const r = await apiGet(page, url)
    if (!r.ok) {
      await screenshot(page, `api-fail-${encodeURIComponent(url)}.png`)
      throw new Error(`API GET failed (${r.status}): ${url} body=${r.text.slice(0, 200)}`)
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

  // Open key modules via flyout menu and attempt a drilldown click.
  const modulePlan = [
    ['Fleet', 'Fleet Operations Hub', '07-fleet-hub'],
    ['Fleet', 'Equipment Dashboard', '08-equipment-dashboard'],
    ['Ops', 'Route Management', '09-route-management'],
    ['Maint', 'Garage Service', '10-garage-service'],
    ['Safety', 'Incident Management', '11-incident-management'],
    ['Stats', 'Endpoint Monitor', '12-endpoint-monitor'],
    ['Admin', 'Administration Hub', '13-admin-hub'],
  ]

  for (const [cat, label, prefix] of modulePlan) {
    await closePanelIfOpen(page)
    let opened = await openModuleFromFlyout(page, cat, label)
    if (!opened) opened = await openModuleViaSearch(page, label).catch(() => false)
    if (!opened) {
      await screenshot(page, `${prefix}-not-opened.png`)
      await dumpErrors(prefix)
      await dumpNetwork(prefix)
      continue
    }
    await page.waitForTimeout(1200)
    await screenshot(page, `${prefix}.png`)
    await tryDrilldownInPanel(page, prefix)
    await dumpErrors(prefix)
    await dumpNetwork(prefix)
  }

  // Fail fast if the UI error boundary is visible.
  if ((await page.getByText('Section Error').count()) > 0) {
    await screenshot(page, 'error-section.png')
    await dumpErrors('section')
    throw new Error('UI error boundary visible (Section Error)')
  }

  // KPI chips should open panels; capture one.
  const kpiVehicles = page.locator('button').filter({ hasText: 'Vehicles' }).first()
  if (await kpiVehicles.count()) {
    await closePanelIfOpen(page)
    await kpiVehicles.click().catch(() => {})
    await page.waitForTimeout(1200)
    await screenshot(page, '14-kpi-vehicles-panel.png')
    await closePanelIfOpen(page)
  }

  await browser.close()

  if (pageErrors.length) {
    const p = path.join(OUT_DIR, 'page-errors.log')
    fs.writeFileSync(p, pageErrors.join('\n') + '\n', 'utf8')
  }
  if (networkErrors.length) {
    const p = path.join(OUT_DIR, 'network-errors.log')
    fs.writeFileSync(p, [...new Set(networkErrors)].join('\n') + '\n', 'utf8')
  }

  // Emit a stable summary for CI/console.
  process.stdout.write(`ui-smoke ok: ${BASE_URL}\nartifacts: ${OUT_DIR}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

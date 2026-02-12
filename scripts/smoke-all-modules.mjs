import fs from 'node:fs';
import path from 'node:path';
import playwright from 'playwright';

const OUTPUT_DIR = path.resolve('output/playwright');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const candidates = [
  process.env.BASE_URL,
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://localhost:5174',
].filter(Boolean);

async function resolveBaseUrl(page) {
  for (const url of candidates) {
    try {
      await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' });
      return url;
    } catch {
      // try next
    }
  }
  return null;
}

async function clickIfVisible(page, locator, timeout = 1500) {
  try {
    if (await locator.first().isVisible({ timeout })) {
      await locator.first().click();
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

async function loginWithEmail(page, baseUrl) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });

  // If the login page offers an email/password path, take it.
  await clickIfVisible(page, page.getByRole('button', { name: /email and password/i }));
  await clickIfVisible(page, page.getByRole('button', { name: /use email/i }));

  await page.getByLabel(/email/i).fill(process.env.DEMO_EMAIL || 'admin@fleet.local');
  await page.getByLabel(/password/i).fill(process.env.DEMO_PASSWORD || 'Fleet@2026');

  const loginTimeoutMs = Number(process.env.PW_LOGIN_TIMEOUT_MS || 30000);
  const afterLoginTimeoutMs = Number(process.env.PW_AFTER_LOGIN_TIMEOUT_MS || 30000);

  // `networkidle` can hang with websockets/SSE; instead, wait for the actual login response.
  const loginResponsePromise = page.waitForResponse(
    (resp) => {
      if (resp.request().method() !== 'POST') return false;
      const url = resp.url();
      return url.includes('/auth/login');
    },
    { timeout: loginTimeoutMs }
  );

  await page.getByRole('button', { name: /sign in/i }).click();

  const loginResp = await loginResponsePromise.catch(() => null);
  if (!loginResp || loginResp.status() >= 400) {
    await page
      .screenshot({ path: path.join(OUTPUT_DIR, `smoke-login-failed.png`), fullPage: true })
      .catch(() => {});
    throw new Error(`Login failed or timed out (status=${loginResp?.status?.() ?? 'no-response'})`);
  }

  // Navigate to the shell and wait for an authenticated-only request to succeed.
  const kpisResponsePromise = page.waitForResponse(
    (resp) => {
      if (resp.request().method() !== 'GET') return false;
      return resp.url().includes('/api/ui/kpis');
    },
    { timeout: afterLoginTimeoutMs }
  );

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('nav-cat-fleet').waitFor({ timeout: afterLoginTimeoutMs });

  // Wait for KPI strip to show at least one numeric value.
  try {
    const kpisResp = await kpisResponsePromise.catch(() => null);
    if (!kpisResp || kpisResp.status() >= 400) {
      throw new Error(`KPI fetch failed (status=${kpisResp?.status?.() ?? 'no-response'})`);
    }

    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="kpi-chip-fleet"]');
      if (!el) return false;
      const txt = el.textContent || '';
      return txt.includes('Vehicles') && !txt.includes('—') && /\d/.test(txt);
    }, { timeout: afterLoginTimeoutMs });
  } catch (e) {
    await page.screenshot({ path: path.join(OUTPUT_DIR, `smoke-after-login-timeout.png`), fullPage: true }).catch(() => {});
    throw e;
  }
}

async function openFlyout(page, categoryId) {
  await page.getByTestId(`nav-cat-${categoryId}`).click();
  await page.getByTestId('flyout-menu').waitFor({ timeout: 10000 });
}

async function ensureShell(page, baseUrl) {
  // If a module crashes badly (e.g., 3D renderer issues), the app shell may unmount.
  // Recover by reloading the root route; cookie session should persist.
  try {
    await page.getByTestId('nav-cat-fleet').waitFor({ timeout: 1500 });
    return;
  } catch {
    // continue
  }

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    return Boolean(document.querySelector('[data-testid="nav-cat-fleet"]'));
  }, { timeout: 30000 });
}

async function closePanelIfOpen(page) {
  const dialog = page.getByRole('dialog');
  try {
    if (await dialog.isVisible({ timeout: 500 })) {
      await page.getByRole('button', { name: 'Close panel' }).click();
      await dialog.waitFor({ state: 'hidden', timeout: 15000 });
      await page.waitForTimeout(300);
    }
  } catch {
    // ignore
  }
}

(async () => {
  const headless = (process.env.PW_HEADLESS || 'true').toLowerCase() !== 'false';
  const slowMo = process.env.PW_SLOWMO_MS ? Number(process.env.PW_SLOWMO_MS) : undefined;
  const browser = await playwright.chromium.launch({ headless, slowMo });
  const context = await browser.newContext();
  const page = await context.newPage();

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(OUTPUT_DIR, `smoke-all-modules-${stamp}.json`);

  const report = {
    startedAt: new Date().toISOString(),
    baseUrl: null,
    ok: [],
    failed: [],
    warnings: [],
    httpErrors: [],
  };

  let current = null;

  page.on('console', (msg) => {
    if (!current) return;
    if (msg.type() === 'error') {
      report.warnings.push({
        moduleId: current.moduleId,
        moduleLabel: current.moduleLabel,
        kind: 'console.error',
        text: msg.text(),
      });
    }
  });

  page.on('response', async (resp) => {
    if (!current) return;
    const status = resp.status();
    if (status < 400) return;
    const req = resp.request();
    const url = resp.url();

    // Filter noisy dev-server hot updates and sourcemaps.
    if (url.includes('/@vite') || url.endsWith('.map')) return;

    report.httpErrors.push({
      moduleId: current.moduleId,
      moduleLabel: current.moduleLabel,
      status,
      method: req.method(),
      url,
    });
  });

  page.on('pageerror', (err) => {
    if (!current) return;
    report.warnings.push({
      moduleId: current.moduleId,
      moduleLabel: current.moduleLabel,
      kind: 'pageerror',
      text: err?.message || String(err),
    });
  });

  page.on('response', (resp) => {
    if (!current) return;
    const url = resp.url();
    if (!url.includes('/api/')) return;
    const status = resp.status();
    if (status < 400) return;
    report.warnings.push({
      moduleId: current.moduleId,
      moduleLabel: current.moduleLabel,
      kind: 'api-error',
      status,
      url,
    });
  });

  try {
    const baseUrl = await resolveBaseUrl(page);
    if (!baseUrl) {
      throw new Error('Unable to reach frontend on known ports (5173/5174).');
    }
    report.baseUrl = baseUrl;

    await loginWithEmail(page, baseUrl);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `smoke-all-modules-after-login-${stamp}.png`), fullPage: true });

    const categories = ['fleet', 'operations', 'maintenance', 'safety', 'analytics', 'admin'];

    for (const categoryId of categories) {
      await ensureShell(page, baseUrl);
      await openFlyout(page, categoryId);

      const moduleButtons = await page.locator('[data-testid^="flyout-module-"]').evaluateAll((nodes) => {
        return nodes.map((n) => ({
          testId: n.getAttribute('data-testid') || '',
          label: (n.textContent || '').trim(),
        }));
      });

      const moduleIds = moduleButtons
        .map((b) => b.testId.replace(/^flyout-module-/, ''))
        .filter(Boolean);

      // Close flyout (toggle click on same category)
      await page.getByTestId(`nav-cat-${categoryId}`).click();

      for (const moduleId of moduleIds) {
        const moduleLabel = moduleButtons.find((b) => b.testId === `flyout-module-${moduleId}`)?.label || moduleId;
        current = { categoryId, moduleId, moduleLabel };

        await ensureShell(page, baseUrl);
        await closePanelIfOpen(page);
        await openFlyout(page, categoryId);

        const btn = page.getByTestId(`flyout-module-${moduleId}`);
        await btn.click();

        try {
          const dialog = page.getByRole('dialog');
          await dialog.waitFor({ state: 'visible', timeout: 30000 });
          await page.waitForTimeout(1200);

          await page.screenshot({
            path: path.join(OUTPUT_DIR, `module-${categoryId}-${moduleId}-${stamp}.png`),
            fullPage: true,
          });

          report.ok.push({ categoryId, moduleId, moduleLabel });
        } catch (e) {
          report.failed.push({
            categoryId,
            moduleId,
            moduleLabel,
            error: e?.message || String(e),
          });
        } finally {
          await closePanelIfOpen(page);
          current = null;
        }
      }
    }
  } catch (error) {
    report.failed.push({ categoryId: 'global', moduleId: 'bootstrap', moduleLabel: 'bootstrap', error: error?.message || String(error) });
    process.exitCode = 1;
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    await browser.close();
    // eslint-disable-next-line no-console
    console.log(`Wrote report: ${reportPath}`);
    // eslint-disable-next-line no-console
    console.log(`OK modules: ${report.ok.length}, failed: ${report.failed.length}, warnings: ${report.warnings.length}`);
  }
})();

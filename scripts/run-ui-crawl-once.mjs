import { spawn } from 'node:child_process'
import net from 'node:net'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getFreePort(preferred) {
  const tryListen = (port) =>
    new Promise((resolve, reject) => {
      const s = net.createServer()
      s.unref()
      s.on('error', reject)
      s.listen(port, '127.0.0.1', () => {
        const addr = s.address()
        s.close(() => resolve(addr.port))
      })
    })

  if (preferred) {
    try {
      return await tryListen(preferred)
    } catch (e) {
      // Fall back to ephemeral port.
    }
  }
  return await tryListen(0)
}

async function waitForHttp(url, timeoutMs) {
  const start = Date.now()
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) return true
      // Some endpoints (e.g. /api/health) may be auth-gated; consider any HTTP response as "up".
      if (res.status >= 200 && res.status < 600) return true
    } catch {}
    if (Date.now() - start > timeoutMs) return false
    await sleep(250)
  }
}

function spawnLogged(name, command, args, env = {}) {
  const child = spawn(command, args, {
    stdio: 'pipe',
    env: { ...process.env, ...env },
  })

  child.stdout.on('data', (d) => process.stdout.write(`[${name}] ${d}`))
  child.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`))
  child.on('exit', (code) => process.stderr.write(`[${name}] exited ${code}\n`))
  return child
}

function spawnLoggedCwd(name, command, args, cwd, env = {}) {
  const child = spawn(command, args, {
    stdio: 'pipe',
    cwd,
    env: { ...process.env, ...env },
  })
  child.stdout.on('data', (d) => process.stdout.write(`[${name}] ${d}`))
  child.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`))
  child.on('exit', (code) => process.stderr.write(`[${name}] exited ${code}\n`))
  return child
}

const children = []
const killAll = () => {
  for (const c of children) {
    try {
      c.kill('SIGTERM')
    } catch {}
  }
}
process.on('exit', killAll)
process.on('SIGINT', () => process.exit(130))
process.on('SIGTERM', () => process.exit(143))

async function main() {
  const apiPort = await getFreePort(Number(process.env.API_PORT || 3001))
  const uiPort = await getFreePort(Number(process.env.UI_PORT || 5173))
  const API_URL = `http://127.0.0.1:${apiPort}`
  const UI_URL = `http://127.0.0.1:${uiPort}`

  const bootstrapDb = String(process.env.BOOTSTRAP_DB || '').toLowerCase() === 'true'
  const seedDb = String(process.env.SEED_DB || '').toLowerCase() === 'true'

  // Ensure DB schema is applied for a working demo (idempotent).
  {
    const migrateEnv = bootstrapDb
      ? {
          MIGRATIONS_BOOTSTRAP: 'true',
        }
      : {
          // Fast path for UI crawl runs: apply only the minimum known-critical migration(s).
          // Set BOOTSTRAP_DB=true to apply the full migration backlog.
          MIGRATIONS_ALLOWLIST: '20260205_costs_unified_view.sql',
        }

    const migrate = spawnLoggedCwd('migrate', 'npm', ['run', 'migrate'], 'api', migrateEnv)
    children.push(migrate)
    const migrateCode = await new Promise((resolve) => migrate.on('exit', (c) => resolve(c ?? 1)))
    if (migrateCode !== 0) {
      console.error('Migrations failed; refusing to start services.')
      process.exit(migrateCode)
    }
  }

  if (seedDb) {
    const seed = spawnLoggedCwd('seed', 'npm', ['run', 'seed'], 'api')
    children.push(seed)
    const seedCode = await new Promise((resolve) => seed.on('exit', (c) => resolve(c ?? 1)))
    if (seedCode !== 0) {
      console.error('Seed failed; refusing to start services.')
      process.exit(seedCode)
    }
  }

  // Start API (loads env from api/.env via DOTENV_CONFIG_PATH).
  children.push(
    spawnLoggedCwd('api', 'npm', ['run', 'dev:nowatch'], 'api', {
      DOTENV_CONFIG_PATH: 'api/.env',
      PORT: String(apiPort),
    })
  )

  // Start UI
  children.push(
    spawnLogged('ui', 'npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(uiPort), '--strictPort'], {
      API_URL,
    })
  )

  const apiOk = await waitForHttp(`${API_URL}/health`, 90_000)
  const uiOk = await waitForHttp(`${UI_URL}/`, 90_000)

  if (!apiOk) {
    console.error('API did not become ready in time.')
    process.exit(1)
  }
  if (!uiOk) {
    console.error('UI did not become ready in time.')
    process.exit(1)
  }

  // Static audit of UI → API references (writes to output/audit/).
  {
    const audit = spawnLogged('audit', 'node', ['scripts/audit-ui-api.mjs'])
    children.push(audit)
    const auditCode = await new Promise((resolve) => audit.on('exit', (c) => resolve(c ?? 1)))
    if (auditCode !== 0) process.exit(auditCode)
  }

  // Runtime API smoke (derived from UI references; fails the run on any 5xx).
  {
    const smoke = spawnLogged('api-smoke', 'node', ['scripts/api-smoke-from-ui.mjs'], {
      API_URL,
    })
    children.push(smoke)
    const smokeCode = await new Promise((resolve) => smoke.on('exit', (c) => resolve(c ?? 1)))
    if (smokeCode !== 0) process.exit(smokeCode)
  }

  // Run the crawl.
  const crawl = spawnLogged('crawl', 'node', ['scripts/ui-crawl.mjs'], {
    BASE_URL: UI_URL,
    API_URL,
  })
  children.push(crawl)
  const exitCode = await new Promise((resolve) => crawl.on('exit', (c) => resolve(c ?? 1)))

  process.exit(exitCode)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

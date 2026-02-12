import fs from 'node:fs'
import path from 'node:path'

const API_URL = process.env.API_URL || 'http://localhost:3001'
const AUDIT_JSON = process.env.AUDIT_JSON || path.resolve('output/audit/ui-api-audit.json')
const OUT_DIR = process.env.OUT_DIR || path.resolve('output/audit')

fs.mkdirSync(OUT_DIR, { recursive: true })

function normalize(p) {
  const q = String(p).split('#')[0]
  return q
}

function uniq(arr) {
  return Array.from(new Set(arr))
}

async function http(method, url, { headers = {}, body, cookie } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      ...headers,
      ...(cookie ? { cookie } : {}),
    },
    body,
    redirect: 'manual',
  })
  const text = await res.text().catch(() => '')
  return { status: res.status, headers: res.headers, text }
}

function extractCookie(setCookieHeader) {
  // Keep only "name=value" portion(s)
  if (!setCookieHeader) return ''
  const parts = String(setCookieHeader)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  // naive but workable: split on ';' and take first segment for each cookie
  const cookies = []
  for (const p of parts) {
    const first = p.split(';')[0]?.trim()
    if (first && first.includes('=')) cookies.push(first)
  }
  return cookies.join('; ')
}

async function devLogin() {
  const url = `${API_URL}/api/auth/dev-login`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    redirect: 'manual',
  })
  // Undici/Node exposes `getSetCookie()` which correctly handles commas in Expires.
  const setCookies = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean)
  const cookie = setCookies.map((c) => String(c).split(';')[0]?.trim()).filter(Boolean).join('; ')
  const json = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, cookie, json }
}

function isSmokableUrl(u) {
  const url = normalize(u)
  if (!url.startsWith('/api/')) return false
  // Skip obvious non-idempotent or dynamic templated URLs.
  if (url.includes('${') || url.includes('{') || url.includes('}') || url.includes(':')) return false
  // Skip file upload endpoints (GET might be invalid but harmless).
  if (/\/upload\b/i.test(url)) return false
  // Skip obvious action endpoints that are almost certainly POST/PUT.
  if (/(^|\/)(checkout|checkin|generate|optimize|sync|calculate|approve|dispatch|send)(\/|$)/i.test(url)) return false
  return true
}

function looksMisconfigured(text) {
  const t = String(text || '').toLowerCase()
  return (
    t.includes('not configured') ||
    t.includes('missing') && t.includes('config') ||
    t.includes('disabled') && t.includes('integration')
  )
}

function addRangeQuery(url, days) {
  const u = new URL(`http://local${url}`)
  const end = new Date()
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  if (!u.searchParams.get('startDate')) u.searchParams.set('startDate', start.toISOString())
  if (!u.searchParams.get('endDate')) u.searchParams.set('endDate', end.toISOString())
  return u.pathname + (u.searchParams.toString() ? `?${u.searchParams.toString()}` : '')
}

function normalizeForSmoke(url) {
  const days = Number(process.env.SMOKE_DAYS || '90')
  const u = normalize(url)

  if (u.startsWith('/api/cost-analysis/')) {
    if (/(summary|by-category|by-vehicle|anomalies|export)\b/i.test(u)) return addRangeQuery(u, days)
  }

  if (u.startsWith('/api/calendar/events')) return addRangeQuery(u, days)

  return u
}

async function main() {
  if (!fs.existsSync(AUDIT_JSON)) {
    console.error(`Audit file not found: ${AUDIT_JSON}`)
    process.exit(2)
  }

  const audit = JSON.parse(fs.readFileSync(AUDIT_JSON, 'utf8'))
  const urls = uniq(
    (audit?.coverage || [])
      .flatMap((c) => c.sampleUrls || [])
      .concat([])
  )

  // The report stores only sampleUrls per base; to smoke everything, read ui unique urls directly:
  const uniqueUrls = uniq((audit?.coverage || []).flatMap((c) => c.sampleUrls || []))
  // Prefer the raw ui urls list if present (older reports may not have it).
  const rawUrls = uniq(
    (audit?.rawUiUrls || []).length ? audit.rawUiUrls : uniqueUrls
  )

  const candidates = uniq(rawUrls.filter(isSmokableUrl).map(normalizeForSmoke)).sort()

  const login = await devLogin()
  if (!login.ok || !login.cookie) {
    console.error(`Dev login failed: ${login.status}`)
    process.exit(3)
  }

  const results = []
  const startedAt = new Date().toISOString()

  for (const u of candidates) {
    const full = `${API_URL}${u}`
    const r = await http('GET', full, { cookie: login.cookie })
    const misconfigured = looksMisconfigured(r.text)
    results.push({
      url: u,
      status: r.status,
      misconfigured,
      // Keep tiny sample to avoid leaking data into logs/artifacts.
      sample: r.text.slice(0, 200),
    })
  }

  const byStatus = results.reduce((acc, r) => {
    const k = String(r.status)
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

  const failures5xx = results.filter((r) => r.status >= 500)
  const authFailures = results.filter((r) => r.status === 401 || r.status === 403)

  const summary = {
    startedAt,
    apiUrl: API_URL,
    candidates: candidates.length,
    byStatus,
    failures5xx: failures5xx.length,
    authFailures: authFailures.length,
    misconfigured: results.filter((r) => r.misconfigured).length,
  }

  const outJson = path.join(OUT_DIR, 'api-smoke-from-ui.json')
  fs.writeFileSync(outJson, JSON.stringify({ summary, results }, null, 2))

  const outMd = path.join(OUT_DIR, 'api-smoke-from-ui.md')
  const lines = []
  lines.push(`# API Smoke (Derived From UI References)`)
  lines.push(`Generated: ${startedAt}`)
  lines.push(`API: ${API_URL}`)
  lines.push(``)
  lines.push(`## Summary`)
  lines.push(`- Candidates: ${summary.candidates}`)
  lines.push(`- 5xx failures: ${summary.failures5xx}`)
  lines.push(`- Auth failures (401/403): ${summary.authFailures}`)
  lines.push(`- Misconfigured responses (heuristic): ${summary.misconfigured}`)
  lines.push(`- Status counts: ${Object.entries(summary.byStatus).map(([k, v]) => `${k}=${v}`).join(', ')}`)
  lines.push(``)
  if (failures5xx.length) {
    lines.push(`## 5xx Failures`)
    for (const f of failures5xx.slice(0, 50)) lines.push(`- \`${f.url}\` -> ${f.status}`)
    if (failures5xx.length > 50) lines.push(`- …and ${failures5xx.length - 50} more`)
    lines.push(``)
  }
  fs.writeFileSync(outMd, lines.join('\n'))

  console.log(`Wrote ${outJson}`)
  console.log(`Wrote ${outMd}`)

  if (failures5xx.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

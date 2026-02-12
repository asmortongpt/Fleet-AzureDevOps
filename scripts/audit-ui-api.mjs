import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const SRC_DIRS = ['src']
const API_SERVER_FILE = path.join(repoRoot, 'api', 'src', 'server.ts')

const OUT_DIR = path.join(repoRoot, 'output', 'audit')
fs.mkdirSync(OUT_DIR, { recursive: true })

function isCodeFile(p) {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(p) && !/\.bak(\.|$)/.test(p)
}

function walk(dir) {
  const out = []
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.git') continue
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function readLines(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return raw.split(/\r?\n/)
}

function extractUiEndpoints() {
  const findings = []

  const patterns = [
    { kind: 'fetch', re: /\bfetch\s*\(\s*([`'"])(\/api\/[^`'"]+)\1/g },
    { kind: 'axios', re: /\baxios\.(get|post|put|patch|delete)\s*\(\s*([`'"])(\/api\/[^`'"]+)\2/g },
    { kind: 'axios', re: /\baxios\s*\(\s*\{\s*[^}]*\burl\s*:\s*([`'"])(\/api\/[^`'"]+)\1/g },
    { kind: 'ws', re: /\bnew\s+WebSocket\s*\(\s*([`'"])(wss?:\/\/[^`'"]+|\/ws\/[^`'"]+|\/api\/[^`'"]+)\1/g },
  ]

  for (const relDir of SRC_DIRS) {
    const base = path.join(repoRoot, relDir)
    const files = walk(base).filter(isCodeFile)
    for (const file of files) {
      const lines = readLines(file)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        for (const p of patterns) {
          p.re.lastIndex = 0
          let m
          // eslint-disable-next-line no-cond-assign
          while ((m = p.re.exec(line)) !== null) {
            const url = m[p.kind === 'axios' && m.length >= 4 ? 3 : 2] ?? m[2]
            if (!url) continue
            findings.push({
              kind: p.kind,
              url,
              file: path.relative(repoRoot, file),
              line: i + 1,
              text: line.trim().slice(0, 240),
            })
          }
        }
      }
    }
  }

  // Also catch plain string occurrences (lower confidence)
  const lowConfidence = []
  const strRe = /([`'"])(\/api\/[A-Za-z0-9/_-]+)(\?[^`'"]*)?\1/g
  for (const relDir of SRC_DIRS) {
    const base = path.join(repoRoot, relDir)
    const files = walk(base).filter(isCodeFile)
    for (const file of files) {
      const lines = readLines(file)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        strRe.lastIndex = 0
        let m
        // eslint-disable-next-line no-cond-assign
        while ((m = strRe.exec(line)) !== null) {
          const url = m[2]
          // avoid duplicates of higher confidence matches
          if (findings.some((f) => f.file === path.relative(repoRoot, file) && f.line === i + 1 && f.url === url)) continue
          lowConfidence.push({
            kind: 'string',
            url,
            file: path.relative(repoRoot, file),
            line: i + 1,
            text: line.trim().slice(0, 240),
          })
        }
      }
    }
  }

  return { findings, lowConfidence }
}

function extractApiMounts() {
  const mounts = []
  if (!fs.existsSync(API_SERVER_FILE)) return mounts
  const lines = readLines(API_SERVER_FILE)
  const useRe = /\bapp\.use\s*\(\s*['"`]([^'"`]+)['"`]\s*,/g
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    useRe.lastIndex = 0
    let m
    // eslint-disable-next-line no-cond-assign
    while ((m = useRe.exec(line)) !== null) {
      mounts.push({
        path: m[1],
        file: path.relative(repoRoot, API_SERVER_FILE),
        line: i + 1,
        text: line.trim().slice(0, 240),
      })
    }
  }
  return mounts
}

function normalizeApiPath(p) {
  const q = p.split('?')[0]
  return q.replace(/\/+$/, '')
}

function toBaseRoute(p) {
  const clean = normalizeApiPath(p)
  const parts = clean.split('/').filter(Boolean)
  if (parts.length < 2) return clean
  // /api/<segment>/...
  if (parts[0] === 'api') return `/${parts[0]}/${parts[1]}`
  // /ws/<segment>/...
  if (parts[0] === 'ws') return `/${parts[0]}/${parts[1]}`
  return `/${parts[0]}`
}

function buildReport() {
  const { findings, lowConfidence } = extractUiEndpoints()
  const mounts = extractApiMounts()
  const mountPaths = new Set(mounts.map((m) => normalizeApiPath(m.path)))

  const allUi = [...findings, ...lowConfidence]
  const uniqueUiUrls = Array.from(new Set(allUi.map((f) => f.url))).sort()

  const byBase = new Map()
  for (const url of uniqueUiUrls) {
    const base = toBaseRoute(url)
    const arr = byBase.get(base) ?? []
    arr.push(url)
    byBase.set(base, arr)
  }

  const coverage = []
  for (const [base, urls] of Array.from(byBase.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const backendHasBase =
      mountPaths.has(base) ||
      // allow /api aliases like /api/admin/jobs where base = /api/admin
      Array.from(mountPaths).some((m) => m === base || m.startsWith(`${base}/`) || base.startsWith(`${m}/`))
    coverage.push({
      base,
      backendHasBase,
      sampleUrls: urls.slice(0, 8),
      count: urls.length,
    })
  }

  const missingBases = coverage.filter((c) => !c.backendHasBase && c.base.startsWith('/api/'))

  const report = {
    generatedAt: new Date().toISOString(),
    ui: {
      endpointsHighConfidence: findings.length,
      endpointsLowConfidence: lowConfidence.length,
      uniqueUrls: uniqueUiUrls.length,
    },
    rawUiUrls: uniqueUiUrls,
    api: {
      mounts: mounts.length,
      mountPaths: Array.from(mountPaths).sort(),
    },
    coverage,
    missingBases,
    notes: [
      'This is a static audit (regex-based), not a runtime contract test.',
      'If a base route is missing here, it may still exist via nested routers; verify by hitting the actual endpoint.',
    ],
  }

  const jsonPath = path.join(OUT_DIR, 'ui-api-audit.json')
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))

  const mdLines = []
  mdLines.push(`# UI → API Endpoint Audit`)
  mdLines.push(`Generated: ${report.generatedAt}`)
  mdLines.push(``)
  mdLines.push(`## Summary`)
  mdLines.push(`- UI endpoints (high confidence): ${report.ui.endpointsHighConfidence}`)
  mdLines.push(`- UI endpoints (low confidence): ${report.ui.endpointsLowConfidence}`)
  mdLines.push(`- Unique UI URLs: ${report.ui.uniqueUrls}`)
  mdLines.push(`- API mount points found in server.ts: ${report.api.mounts}`)
  mdLines.push(``)

  mdLines.push(`## Missing Base Routes (UI references with no obvious backend mount)`)
  if (missingBases.length === 0) {
    mdLines.push(`- None detected`)
  } else {
    for (const m of missingBases.slice(0, 50)) {
      mdLines.push(`- \`${m.base}\` (examples: ${m.sampleUrls.map((u) => `\`${u}\``).join(', ')})`)
    }
    if (missingBases.length > 50) mdLines.push(`- …and ${missingBases.length - 50} more`)
  }
  mdLines.push(``)

  mdLines.push(`## Coverage By Base Route`)
  for (const c of coverage) {
    const status = c.backendHasBase ? 'OK' : 'MISSING?'
    mdLines.push(`- \`${c.base}\`: ${status} (${c.count} urls)`)
  }
  mdLines.push(``)

  mdLines.push(`## Notes`)
  for (const n of report.notes) mdLines.push(`- ${n}`)

  const mdPath = path.join(OUT_DIR, 'ui-api-audit.md')
  fs.writeFileSync(mdPath, mdLines.join('\n'))

  return { jsonPath, mdPath, report }
}

const { jsonPath, mdPath, report } = buildReport()
console.log(`Wrote ${jsonPath}`)
console.log(`Wrote ${mdPath}`)
console.log(`Missing bases: ${report.missingBases.length}`)

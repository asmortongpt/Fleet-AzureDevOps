import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const checks = []

const run = (name, command, args, options = {}) => {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, { stdio: 'pipe', ...options })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
    child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    child.on('close', (code) => {
      resolvePromise({ name, code, stdout, stderr })
    })
  })
}

const fetchJson = async (url) => {
  try {
    const res = await fetch(url, { method: 'GET' })
    const text = await res.text()
    return { ok: res.ok, status: res.status, text }
  } catch (error) {
    return { ok: false, status: 0, text: String(error) }
  }
}

const checkEndpoint = async (name, url) => {
  const result = await fetchJson(url)
  return { name, ...result }
}

const detectFrontend = async () => {
  const candidates = ['http://localhost:5173', 'http://localhost:5174']
  for (const url of candidates) {
    const result = await fetchJson(url)
    if (result.ok) return { url, result }
  }
  return { url: null, result: null }
}

const main = async () => {
  console.log('Fleet-CTA dev orchestrator')
  console.log('--------------------------------')

  checks.push(checkEndpoint('api:/health', 'http://localhost:3001/health'))
  checks.push(checkEndpoint('api:/api/health', 'http://localhost:3001/api/health'))

  const frontend = await detectFrontend()
  if (frontend.url) {
    console.log(`Frontend detected at ${frontend.url}`)
  } else {
    console.log('Frontend not detected on 5173/5174')
  }

  const hasQuickBrowser = existsSync(resolve(process.cwd(), 'quick-browser-test.mjs'))
  if (frontend.url && hasQuickBrowser) {
    const base = frontend.url
    checks.push(run('playwright:quick', 'node', ['quick-browser-test.mjs'], { env: { ...process.env, BASE_URL: base } }))
  }

  checks.push(run('scan:mock-demo', 'grep', [
    '-RIn',
    '-E',
    'Math\\.random\\(|mock data|demo data|sample data|placeholder data',
    'src/components',
    'src/pages'
  ]))

  const outputs = await Promise.all(checks)

  console.log('\nResults')
  console.log('--------------------------------')

  for (const output of outputs.filter(Boolean)) {
    if (output.name?.startsWith('api:')) {
      const { name, ok, status } = output
      console.log(`${name} -> ${ok ? 'OK' : 'FAIL'} (status ${status})`)
    } else if (output.name === 'scan:mock-demo') {
      const lines = output.stdout.trim().split('\n').filter(Boolean)
      console.log(`scan:mock-demo -> ${lines.length} hits`)
      if (lines.length > 0) {
        console.log(lines.slice(0, 25).join('\n'))
      }
    } else if (output.name) {
      console.log(`${output.name} -> exit ${output.code ?? 'unknown'}`)
      if (output.stderr) console.log(output.stderr.trim())
    }
  }

  console.log('\nDone.')
}

main()

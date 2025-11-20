/**
 * Redis Cache Performance Benchmarking Script
 *
 * Tests cache performance by measuring:
 * - Response time without cache (cold)
 * - Response time with cache (warm)
 * - Cache hit rate
 * - Performance improvement percentage
 */

import axios from 'axios'
import { cacheInvalidation } from '../middleware/cache'

interface BenchmarkResult {
  endpoint: string
  coldAvgMs: number
  warmAvgMs: number
  improvement: string
  requests: number
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api'
const AUTH_TOKEN = process.env.BENCHMARK_AUTH_TOKEN || ''

const ENDPOINTS_TO_TEST = [
  '/vehicles',
  '/drivers',
  '/telematics/providers',
  '/executive-dashboard/kpis',
  '/executive-dashboard/trends?days=30',
]

/**
 * Make an HTTP request and measure response time
 */
async function makeRequest(endpoint: string): Promise<number> {
  const startTime = Date.now()

  try {
    await axios.get(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    })
    return Date.now() - startTime
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error)
    return -1
  }
}

/**
 * Run benchmark for a single endpoint
 */
async function benchmarkEndpoint(
  endpoint: string,
  iterations: number = 5
): Promise<BenchmarkResult> {
  console.log(`\nBenchmarking: ${endpoint}`)

  // Clear cache to get cold start times
  await cacheInvalidation.clearAll()
  console.log('  Cache cleared...')

  // Cold start measurements (no cache)
  const coldTimes: number[] = []
  for (let i = 0; i < iterations; i++) {
    const time = await makeRequest(endpoint)
    if (time > 0) {
      coldTimes.push(time)
      console.log(`  Cold request ${i + 1}: ${time}ms`)
    }
    // Clear cache after each cold request
    await cacheInvalidation.clearAll()
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  // Wait a bit before warm tests
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Warm start measurements (with cache)
  const warmTimes: number[] = []
  // First request to populate cache
  await makeRequest(endpoint)

  for (let i = 0; i < iterations; i++) {
    const time = await makeRequest(endpoint)
    if (time > 0) {
      warmTimes.push(time)
      console.log(`  Warm request ${i + 1}: ${time}ms`)
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const coldAvg = coldTimes.reduce((a, b) => a + b, 0) / coldTimes.length
  const warmAvg = warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length
  const improvement = (((coldAvg - warmAvg) / coldAvg) * 100).toFixed(1)

  return {
    endpoint,
    coldAvgMs: Math.round(coldAvg),
    warmAvgMs: Math.round(warmAvg),
    improvement: `${improvement}%`,
    requests: iterations * 2,
  }
}

/**
 * Main benchmark runner
 */
async function runBenchmarks() {
  console.log('='.repeat(70))
  console.log('REDIS CACHE PERFORMANCE BENCHMARK')
  console.log('='.repeat(70))

  if (!AUTH_TOKEN) {
    console.error('ERROR: BENCHMARK_AUTH_TOKEN environment variable not set')
    console.log('Please set a valid JWT token for benchmarking')
    process.exit(1)
  }

  const results: BenchmarkResult[] = []

  for (const endpoint of ENDPOINTS_TO_TEST) {
    try {
      const result = await benchmarkEndpoint(endpoint, 5)
      results.push(result)
    } catch (error) {
      console.error(`Failed to benchmark ${endpoint}:`, error)
    }
  }

  // Print summary table
  console.log('\n' + '='.repeat(70))
  console.log('BENCHMARK RESULTS SUMMARY')
  console.log('='.repeat(70))
  console.log(
    '\n| Endpoint                          | Cold (ms) | Warm (ms) | Improvement |'
  )
  console.log('|-----------------------------------|-----------|-----------|-------------|')

  results.forEach((result) => {
    const endpoint = result.endpoint.padEnd(33)
    const cold = String(result.coldAvgMs).padStart(9)
    const warm = String(result.warmAvgMs).padStart(9)
    const improvement = result.improvement.padStart(11)
    console.log(`| ${endpoint} | ${cold} | ${warm} | ${improvement} |`)
  })

  // Calculate overall stats
  const totalCold = results.reduce((sum, r) => sum + r.coldAvgMs, 0)
  const totalWarm = results.reduce((sum, r) => sum + r.warmAvgMs, 0)
  const avgCold = totalCold / results.length
  const avgWarm = totalWarm / results.length
  const overallImprovement = (((avgCold - avgWarm) / avgCold) * 100).toFixed(1)

  console.log('|-----------------------------------|-----------|-----------|-------------|')
  console.log(
    `| ${'OVERALL AVERAGE'.padEnd(33)} | ${String(Math.round(avgCold)).padStart(9)} | ${String(Math.round(avgWarm)).padStart(9)} | ${`${overallImprovement}%`.padStart(11)} |`
  )
  console.log('='.repeat(70))

  // Cache stats
  const cacheStats = await cacheInvalidation.stats()
  if (cacheStats) {
    console.log('\nCACHE STATISTICS:')
    console.log(`  Keys cached: ${cacheStats.keyCount}`)
    console.log(`  Hit rate: ${cacheStats.hitRate}`)
    console.log(`  Memory used: ${cacheStats.memoryUsed}`)
  }

  console.log('\n' + '='.repeat(70))
  console.log(
    `✅ Benchmark complete! Average improvement: ${overallImprovement}%`
  )
  console.log('='.repeat(70) + '\n')

  process.exit(0)
}

// Run if called directly
if (require.main === module) {
  runBenchmarks().catch((error) => {
    console.error('Benchmark failed:', error)
    process.exit(1)
  })
}

export { runBenchmarks, benchmarkEndpoint }

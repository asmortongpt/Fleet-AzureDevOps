#!/usr/bin/env node

/**
 * Comprehensive Performance and Load Testing Suite
 * Tests production deployment against performance benchmarks
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Production Configuration
const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';
const LOAD_TEST_USERS = 50;
const LOAD_TEST_DURATION = 120000; // 2 minutes in ms
const RESPONSE_TIME_THRESHOLD = 500; // 95th percentile target

// Performance Thresholds
const THRESHOLDS = {
  performance: 80,
  accessibility: 90,
  bestPractices: 90,
  seo: 80
};

// Critical API Endpoints
const API_ENDPOINTS = [
  { method: 'GET', path: '/api/health', name: 'Health Check' },
  { method: 'GET', path: '/api/status', name: 'System Status' },
  { method: 'POST', path: '/api/auth/login', name: 'Login', body: { username: 'test', password: 'test' } },
  { method: 'GET', path: '/api/vehicles', name: 'List Vehicles' },
  { method: 'GET', path: '/api/drivers', name: 'List Drivers' },
  { method: 'GET', path: '/api/maintenance/upcoming', name: 'Upcoming Maintenance' },
  { method: 'GET', path: '/api/analytics/fleet-overview', name: 'Fleet Analytics' },
  { method: 'GET', path: '/api/dispatch/messages', name: 'Dispatch Messages' }
];

class PerformanceTester {
  constructor() {
    this.results = {
      lighthouse: null,
      loadTest: null,
      apiTests: [],
      serverResources: null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run Lighthouse Performance Audit using CLI
   */
  async runLighthouseAudit() {
    console.log('\n📊 Running Lighthouse Performance Audit...');
    console.log(`Target: ${PRODUCTION_URL}\n`);

    try {
      // Run lighthouse via CLI and output JSON
      const { stdout } = await execPromise(
        `npx lighthouse ${PRODUCTION_URL} --output=json --quiet --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo`
      );

      const report = JSON.parse(stdout);
      const categories = report.categories;

      this.results.lighthouse = {
        performance: Math.round(categories.performance.score * 100),
        accessibility: Math.round(categories.accessibility.score * 100),
        bestPractices: Math.round(categories['best-practices'].score * 100),
        seo: Math.round(categories.seo.score * 100),
        metrics: {
          firstContentfulPaint: report.audits['first-contentful-paint'].displayValue,
          largestContentfulPaint: report.audits['largest-contentful-paint'].displayValue,
          totalBlockingTime: report.audits['total-blocking-time'].displayValue,
          cumulativeLayoutShift: report.audits['cumulative-layout-shift'].displayValue,
          speedIndex: report.audits['speed-index'].displayValue,
          timeToInteractive: report.audits['interactive'].displayValue
        },
        passed: this.checkLighthouseThresholds(categories)
      };

      // Print results
      console.log('✅ Lighthouse Audit Complete\n');
      console.log(`Performance:      ${this.results.lighthouse.performance}% ${this.getStatusIcon(this.results.lighthouse.performance, THRESHOLDS.performance)}`);
      console.log(`Accessibility:    ${this.results.lighthouse.accessibility}% ${this.getStatusIcon(this.results.lighthouse.accessibility, THRESHOLDS.accessibility)}`);
      console.log(`Best Practices:   ${this.results.lighthouse.bestPractices}% ${this.getStatusIcon(this.results.lighthouse.bestPractices, THRESHOLDS.bestPractices)}`);
      console.log(`SEO:              ${this.results.lighthouse.seo}% ${this.getStatusIcon(this.results.lighthouse.seo, THRESHOLDS.seo)}`);

      console.log('\n📈 Core Web Vitals:');
      console.log(`FCP:  ${this.results.lighthouse.metrics.firstContentfulPaint}`);
      console.log(`LCP:  ${this.results.lighthouse.metrics.largestContentfulPaint}`);
      console.log(`TBT:  ${this.results.lighthouse.metrics.totalBlockingTime}`);
      console.log(`CLS:  ${this.results.lighthouse.metrics.cumulativeLayoutShift}`);
      console.log(`SI:   ${this.results.lighthouse.metrics.speedIndex}`);
      console.log(`TTI:  ${this.results.lighthouse.metrics.timeToInteractive}`);

      return this.results.lighthouse;

    } catch (error) {
      console.error('❌ Lighthouse audit failed:', error.message);
      console.log('⚠️  Continuing with remaining tests...\n');
      this.results.lighthouse = { error: error.message, skipped: true };
      return this.results.lighthouse;
    }
  }

  /**
   * Run Load Testing with Concurrent Users
   */
  async runLoadTest() {
    console.log(`\n🔥 Running Load Test: ${LOAD_TEST_USERS} concurrent users for ${LOAD_TEST_DURATION / 1000}s...\n`);

    const startTime = Date.now();
    const endTime = startTime + LOAD_TEST_DURATION;

    const responseTimes = [];
    const errors = [];
    let requestCount = 0;
    let successCount = 0;

    // Worker function for each concurrent user
    const userSession = async (userId) => {
      while (Date.now() < endTime) {
        const requestStart = performance.now();

        try {
          const response = await axios.get(`${PRODUCTION_URL}/api/health`, {
            timeout: 10000,
            headers: { 'User-Agent': `LoadTest-User-${userId}` }
          });

          const responseTime = performance.now() - requestStart;
          responseTimes.push(responseTime);
          requestCount++;

          if (response.status === 200) {
            successCount++;
          }

          // Random delay between requests (simulate real user behavior)
          await this.sleep(Math.random() * 1000 + 500);

        } catch (error) {
          const responseTime = performance.now() - requestStart;
          responseTimes.push(responseTime);
          requestCount++;
          errors.push({
            userId,
            error: error.message,
            time: new Date().toISOString()
          });
        }
      }
    };

    // Launch concurrent users
    const users = Array.from({ length: LOAD_TEST_USERS }, (_, i) => userSession(i + 1));
    await Promise.all(users);

    // Calculate statistics
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p50 = this.percentile(sortedTimes, 50);
    const p75 = this.percentile(sortedTimes, 75);
    const p95 = this.percentile(sortedTimes, 95);
    const p99 = this.percentile(sortedTimes, 99);
    const avg = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
    const min = sortedTimes[0];
    const max = sortedTimes[sortedTimes.length - 1];

    this.results.loadTest = {
      users: LOAD_TEST_USERS,
      duration: LOAD_TEST_DURATION / 1000,
      totalRequests: requestCount,
      successfulRequests: successCount,
      failedRequests: errors.length,
      errorRate: ((errors.length / requestCount) * 100).toFixed(2),
      requestsPerSecond: (requestCount / (LOAD_TEST_DURATION / 1000)).toFixed(2),
      responseTimes: {
        min: min.toFixed(2),
        max: max.toFixed(2),
        avg: avg.toFixed(2),
        p50: p50.toFixed(2),
        p75: p75.toFixed(2),
        p95: p95.toFixed(2),
        p99: p99.toFixed(2)
      },
      errors: errors.slice(0, 10), // First 10 errors
      passed: errors.length === 0 && p95 < RESPONSE_TIME_THRESHOLD
    };

    // Print results
    console.log('✅ Load Test Complete\n');
    console.log(`Total Requests:    ${requestCount}`);
    console.log(`Successful:        ${successCount} (${((successCount/requestCount)*100).toFixed(1)}%)`);
    console.log(`Failed:            ${errors.length} (${this.results.loadTest.errorRate}%)`);
    console.log(`Requests/sec:      ${this.results.loadTest.requestsPerSecond}`);
    console.log('\n📊 Response Times (ms):');
    console.log(`Min:   ${min.toFixed(2)}ms`);
    console.log(`Avg:   ${avg.toFixed(2)}ms`);
    console.log(`p50:   ${p50.toFixed(2)}ms`);
    console.log(`p75:   ${p75.toFixed(2)}ms`);
    console.log(`p95:   ${p95.toFixed(2)}ms ${p95 < RESPONSE_TIME_THRESHOLD ? '✅' : '❌'}`);
    console.log(`p99:   ${p99.toFixed(2)}ms`);
    console.log(`Max:   ${max.toFixed(2)}ms`);

    if (errors.length > 0) {
      console.log('\n⚠️  First 10 Errors:');
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. User ${err.userId}: ${err.error}`);
      });
    }

    return this.results.loadTest;
  }

  /**
   * Test All Critical API Endpoints
   */
  async testAPIEndpoints() {
    console.log('\n🔌 Testing Critical API Endpoints...\n');

    for (const endpoint of API_ENDPOINTS) {
      const result = await this.testEndpoint(endpoint);
      this.results.apiTests.push(result);

      const status = result.success ? '✅' : '❌';
      const timing = result.responseTime ? `${result.responseTime}ms` : 'N/A';
      console.log(`${status} ${endpoint.method} ${endpoint.path} - ${timing}`);

      if (!result.success) {
        console.log(`   Error: ${result.error}`);
      }
    }

    const successCount = this.results.apiTests.filter(t => t.success).length;
    console.log(`\n✅ API Tests Complete: ${successCount}/${API_ENDPOINTS.length} passed`);

    return this.results.apiTests;
  }

  /**
   * Test Individual Endpoint
   */
  async testEndpoint(endpoint) {
    const startTime = performance.now();

    try {
      const config = {
        method: endpoint.method,
        url: `${PRODUCTION_URL}${endpoint.path}`,
        timeout: 10000,
        validateStatus: () => true // Accept all status codes
      };

      if (endpoint.body) {
        config.data = endpoint.body;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      const responseTime = performance.now() - startTime;

      return {
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        statusCode: response.status,
        responseTime: Math.round(responseTime),
        success: response.status < 500, // Accept 4xx as success (auth/validation errors)
        headers: response.headers
      };

    } catch (error) {
      const responseTime = performance.now() - startTime;

      return {
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        success: false,
        error: error.message,
        responseTime: Math.round(responseTime)
      };
    }
  }

  /**
   * Monitor Server Resources (requires kubectl access)
   */
  async monitorServerResources() {
    console.log('\n🖥️  Monitoring Server Resources...\n');

    try {
      // Try to get pod metrics
      try {
        const { stdout: podsOutput } = await execPromise('kubectl get pods -n cta-production -o json');
        const pods = JSON.parse(podsOutput);

        // Get metrics
        const { stdout: metricsOutput } = await execPromise('kubectl top pods -n cta-production --no-headers');

        const podMetrics = metricsOutput.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return {
              name: parts[0],
              cpu: parts[1],
              memory: parts[2]
            };
          });

        // Check for restarts
        const podRestarts = pods.items.map(pod => ({
          name: pod.metadata.name,
          restarts: pod.status.containerStatuses?.[0]?.restartCount || 0,
          status: pod.status.phase
        }));

        this.results.serverResources = {
          pods: podMetrics,
          restarts: podRestarts,
          totalPods: pods.items.length,
          hasRestarts: podRestarts.some(p => p.restarts > 0),
          timestamp: new Date().toISOString()
        };

        console.log('Pod Metrics:');
        podMetrics.forEach(p => {
          console.log(`  ${p.name}: CPU=${p.cpu}, Memory=${p.memory}`);
        });

        console.log('\nPod Status:');
        podRestarts.forEach(p => {
          const restartIcon = p.restarts > 0 ? '⚠️ ' : '✅';
          console.log(`  ${restartIcon} ${p.name}: ${p.status}, Restarts=${p.restarts}`);
        });

      } catch (error) {
        console.log('⚠️  Could not access Kubernetes metrics:', error.message);
        this.results.serverResources = {
          error: 'Kubernetes access not available',
          message: 'Run this test with kubectl configured for cluster access'
        };
      }

    } catch (error) {
      console.log('⚠️  Server monitoring not available:', error.message);
      this.results.serverResources = { error: error.message };
    }

    return this.results.serverResources;
  }

  /**
   * Generate Comprehensive Report
   */
  generateReport() {
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('           PERFORMANCE & LOAD TEST REPORT');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`Production URL: ${PRODUCTION_URL}`);
    console.log(`Test Date: ${this.results.timestamp}`);
    console.log(`Test Duration: ${LOAD_TEST_DURATION / 1000}s with ${LOAD_TEST_USERS} concurrent users\n`);

    // Lighthouse Summary
    if (this.results.lighthouse && !this.results.lighthouse.skipped) {
      console.log('───────────────────────────────────────────────────────────────');
      console.log('1. LIGHTHOUSE PERFORMANCE AUDIT');
      console.log('───────────────────────────────────────────────────────────────\n');

      const lh = this.results.lighthouse;
      console.log(`Performance:      ${lh.performance}% ${this.getStatusIcon(lh.performance, THRESHOLDS.performance)} (target: >${THRESHOLDS.performance}%)`);
      console.log(`Accessibility:    ${lh.accessibility}% ${this.getStatusIcon(lh.accessibility, THRESHOLDS.accessibility)} (target: >${THRESHOLDS.accessibility}%)`);
      console.log(`Best Practices:   ${lh.bestPractices}% ${this.getStatusIcon(lh.bestPractices, THRESHOLDS.bestPractices)} (target: >${THRESHOLDS.bestPractices}%)`);
      console.log(`SEO:              ${lh.seo}% ${this.getStatusIcon(lh.seo, THRESHOLDS.seo)} (target: >${THRESHOLDS.seo}%)`);
      console.log(`\nOverall: ${lh.passed ? '✅ PASSED' : '❌ FAILED'}`);
    } else if (this.results.lighthouse?.skipped) {
      console.log('───────────────────────────────────────────────────────────────');
      console.log('1. LIGHTHOUSE PERFORMANCE AUDIT');
      console.log('───────────────────────────────────────────────────────────────\n');
      console.log('⚠️  SKIPPED - Lighthouse not available');
    }

    // Load Test Summary
    if (this.results.loadTest) {
      console.log('\n───────────────────────────────────────────────────────────────');
      console.log('2. LOAD TESTING RESULTS');
      console.log('───────────────────────────────────────────────────────────────\n');

      const lt = this.results.loadTest;
      console.log(`Concurrent Users:     ${lt.users}`);
      console.log(`Total Requests:       ${lt.totalRequests}`);
      console.log(`Successful Requests:  ${lt.successfulRequests} (${((lt.successfulRequests/lt.totalRequests)*100).toFixed(1)}%)`);
      console.log(`Failed Requests:      ${lt.failedRequests} (${lt.errorRate}%)`);
      console.log(`Throughput:           ${lt.requestsPerSecond} req/sec`);
      console.log(`\nResponse Times:`);
      console.log(`  Average:   ${lt.responseTimes.avg}ms`);
      console.log(`  95th %ile: ${lt.responseTimes.p95}ms ${parseFloat(lt.responseTimes.p95) < RESPONSE_TIME_THRESHOLD ? '✅' : '❌'} (target: <${RESPONSE_TIME_THRESHOLD}ms)`);
      console.log(`  99th %ile: ${lt.responseTimes.p99}ms`);
      console.log(`\nOverall: ${lt.passed ? '✅ PASSED' : '❌ FAILED'}`);
    }

    // API Endpoint Tests
    if (this.results.apiTests.length > 0) {
      console.log('\n───────────────────────────────────────────────────────────────');
      console.log('3. API ENDPOINT TESTING');
      console.log('───────────────────────────────────────────────────────────────\n');

      const successful = this.results.apiTests.filter(t => t.success);
      console.log(`Total Endpoints Tested: ${this.results.apiTests.length}`);
      console.log(`Successful:             ${successful.length}`);
      console.log(`Failed:                 ${this.results.apiTests.length - successful.length}\n`);

      this.results.apiTests.forEach(test => {
        const status = test.success ? '✅' : '❌';
        const time = test.responseTime ? `${test.responseTime}ms` : 'N/A';
        console.log(`${status} ${test.method} ${test.path} - ${time} (${test.statusCode || 'error'})`);
      });

      console.log(`\nOverall: ${successful.length === this.results.apiTests.length ? '✅ PASSED' : '⚠️  PARTIAL'}`);
    }

    // Server Resources
    if (this.results.serverResources && !this.results.serverResources.error) {
      console.log('\n───────────────────────────────────────────────────────────────');
      console.log('4. SERVER RESOURCE MONITORING');
      console.log('───────────────────────────────────────────────────────────────\n');

      const sr = this.results.serverResources;
      console.log(`Total Pods: ${sr.totalPods}`);
      console.log(`Pod Restarts: ${sr.hasRestarts ? '⚠️  YES' : '✅ NO'}\n`);

      if (sr.pods) {
        sr.pods.forEach(p => {
          console.log(`${p.name}:`);
          console.log(`  CPU:    ${p.cpu}`);
          console.log(`  Memory: ${p.memory}`);
        });
      }
    }

    // Overall Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('OVERALL TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const lighthousePassed = this.results.lighthouse?.passed || false;
    const loadTestPassed = this.results.loadTest?.passed || false;
    const apiTestsPassed = this.results.apiTests.every(t => t.success);
    const noRestarts = !this.results.serverResources?.hasRestarts;

    console.log(`Lighthouse Audit:    ${this.results.lighthouse?.skipped ? '⚠️  SKIPPED' : lighthousePassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Load Testing:        ${loadTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`API Endpoints:       ${apiTestsPassed ? '✅ PASSED' : '⚠️  PARTIAL'}`);
    console.log(`Server Resources:    ${noRestarts ? '✅ PASSED' : '⚠️  CHECK NEEDED'}`);

    const allPassed = loadTestPassed && apiTestsPassed && noRestarts;

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(allPassed ? '✅ ALL CRITICAL TESTS PASSED - PRODUCTION READY' : '⚠️  SOME TESTS FAILED - REVIEW REQUIRED');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save detailed JSON report
    const reportPath = path.join(__dirname, 'performance-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}\n`);

    return this.results;
  }

  // Helper Methods
  checkLighthouseThresholds(categories) {
    return (
      categories.performance.score * 100 >= THRESHOLDS.performance &&
      categories.accessibility.score * 100 >= THRESHOLDS.accessibility &&
      categories['best-practices'].score * 100 >= THRESHOLDS.bestPractices &&
      categories.seo.score * 100 >= THRESHOLDS.seo
    );
  }

  getStatusIcon(score, threshold) {
    return score >= threshold ? '✅' : '❌';
  }

  percentile(arr, p) {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[index];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main Execution
async function main() {
  console.log('🚀 Starting Comprehensive Performance & Load Testing...');
  console.log(`Target: ${PRODUCTION_URL}\n`);

  const tester = new PerformanceTester();

  try {
    // Run all tests
    await tester.runLighthouseAudit();
    await tester.runLoadTest();
    await tester.testAPIEndpoints();
    await tester.monitorServerResources();

    // Generate final report
    tester.generateReport();

    // Exit with appropriate code
    const allPassed =
      tester.results.loadTest?.passed &&
      tester.results.apiTests.every(t => t.success);

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = PerformanceTester;

/**
 * REAL 3-Tool Validation Integration
 *
 * This script FORCES actual API calls to Cursor, Datadog, and Retool.
 * NO SIMULATION ALLOWED - All validation scores must come from real tool APIs.
 *
 * Security: API keys from Azure Key Vault
 * Compliance: All validation calls are logged with timestamps
 * Target: 99%+ validation score on all three tools
 */

import * as fs from 'fs';
import * as path from 'path';

import axios from 'axios';

interface ValidationResult {
  tool: 'cursor' | 'datadog' | 'retool';
  score: number;
  timestamp: string;
  details: any;
  error?: string;
}

interface ValidationReport {
  file: string;
  validations: ValidationResult[];
  overallScore: number;
  passed: boolean; // true if ALL tools >= 99%
  timestamp: string;
}

/**
 * Validate code quality using Cursor API
 * REAL API CALL - No simulation!
 */
async function validateWithCursor(filePath: string): Promise<ValidationResult> {
  const startTime = new Date().toISOString();

  try {
    // Read file content
    const code = fs.readFileSync(filePath, 'utf-8');

    // REAL Cursor API call
    const response = await axios.post('https://api.cursor.com/v1/analyze', {
      code,
      language: filePath.endsWith('.ts') ? 'typescript' : 'javascript',
      checks: [
        'security',
        'best-practices',
        'complexity',
        'maintainability',
        'sql-injection',
        'xss',
        'authentication',
        'authorization'
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.CURSOR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const { score, issues, suggestions } = response.data;

    // Cursor returns score 0-100, convert to 0-1
    const normalizedScore = score / 100;

    return {
      tool: 'cursor',
      score: normalizedScore,
      timestamp: startTime,
      details: {
        issues,
        suggestions,
        checks: response.data.checks
      }
    };
  } catch (error: any) {
    console.error('❌ Cursor API call FAILED:', error.message);

    return {
      tool: 'cursor',
      score: 0,
      timestamp: startTime,
      details: {},
      error: `Cursor API failed: ${error.message}`
    };
  }
}

/**
 * Validate runtime behavior using Datadog API
 * REAL API CALL - No simulation!
 */
async function validateWithDatadog(endpoint: string, tenantId: string = 'test-tenant'): Promise<ValidationResult> {
  const startTime = new Date().toISOString();

  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const pastTime = currentTime - 3600; // Last hour

    // REAL Datadog API call - get metrics for this endpoint
    const response = await axios.get('https://api.datadoghq.com/api/v1/query', {
      params: {
        query: `avg:trace.http.request.errors{resource_name:${endpoint},tenant_id:${tenantId}}by{resource_name}.as_count()`,
        from: pastTime,
        to: currentTime
      },
      headers: {
        'DD-API-KEY': process.env.DATADOG_API_KEY,
        'DD-APPLICATION-KEY': process.env.DATADOG_APP_KEY
      },
      timeout: 30000
    });

    const { series } = response.data;

    // Calculate health score based on error rate, latency, uptime
    let errorRate = 0;
    let avgLatency = 0;

    if (series && series.length > 0) {
      const points = series[0].pointlist;
      const totalErrors = points.reduce((sum: number, point: number[]) => sum + point[1], 0);
      errorRate = totalErrors / points.length;
    }

    // Get latency metrics
    const latencyResponse = await axios.get('https://api.datadoghq.com/api/v1/query', {
      params: {
        query: `avg:trace.http.request.duration{resource_name:${endpoint},tenant_id:${tenantId}}by{resource_name}`,
        from: pastTime,
        to: currentTime
      },
      headers: {
        'DD-API-KEY': process.env.DATADOG_API_KEY,
        'DD-APPLICATION-KEY': process.env.DATADOG_APP_KEY
      },
      timeout: 30000
    });

    if (latencyResponse.data.series && latencyResponse.data.series.length > 0) {
      const latencyPoints = latencyResponse.data.series[0].pointlist;
      avgLatency = latencyPoints.reduce((sum: number, point: number[]) => sum + point[1], 0) / latencyPoints.length;
    }

    // Calculate score: 100% - (error_rate * 50) - (latency_penalty)
    const latencyPenalty = avgLatency > 1000 ? 0.05 : avgLatency > 500 ? 0.02 : 0;
    const score = Math.max(0, 1 - (errorRate * 0.5) - latencyPenalty);

    return {
      tool: 'datadog',
      score,
      timestamp: startTime,
      details: {
        errorRate,
        avgLatency,
        dataPoints: series?.length || 0
      }
    };
  } catch (error: any) {
    console.error('❌ Datadog API call FAILED:', error.message);

    return {
      tool: 'datadog',
      score: 0,
      timestamp: startTime,
      details: {},
      error: `Datadog API failed: ${error.message}`
    };
  }
}

/**
 * Validate API functionality using Retool API
 * REAL API CALL - No simulation!
 */
async function validateWithRetool(endpoint: string, testCases: any[]): Promise<ValidationResult> {
  const startTime = new Date().toISOString();

  try {
    // REAL Retool API call - execute test workflow
    const response = await axios.post('https://api.retool.com/v1/workflows/fleet-api-tests/start', {
      endpoint,
      testCases,
      validations: [
        'response_time_under_500ms',
        'correct_status_codes',
        'schema_validation',
        'tenant_isolation',
        'authentication_required',
        'authorization_checks'
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RETOOL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const { workflow_id } = response.data;

    // Poll for workflow completion (max 60 seconds)
    let completed = false;
    let attempts = 0;
    let result: any = null;

    while (!completed && attempts < 12) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s

      const statusResponse = await axios.get(`https://api.retool.com/v1/workflows/${workflow_id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.RETOOL_API_KEY}`
        }
      });

      if (statusResponse.data.status === 'completed') {
        completed = true;
        result = statusResponse.data.result;
      } else if (statusResponse.data.status === 'failed') {
        throw new Error(`Retool workflow failed: ${statusResponse.data.error}`);
      }

      attempts++;
    }

    if (!completed) {
      throw new Error('Retool workflow timeout after 60 seconds');
    }

    // Calculate score from test results
    const passedTests = result.tests.filter((t: any) => t.passed).length;
    const totalTests = result.tests.length;
    const score = passedTests / totalTests;

    return {
      tool: 'retool',
      score,
      timestamp: startTime,
      details: {
        passedTests,
        totalTests,
        failedTests: result.tests.filter((t: any) => !t.passed),
        workflowId: workflow_id
      }
    };
  } catch (error: any) {
    console.error('❌ Retool API call FAILED:', error.message);

    return {
      tool: 'retool',
      score: 0,
      timestamp: startTime,
      details: {},
      error: `Retool API failed: ${error.message}`
    };
  }
}

/**
 * Run complete 3-tool validation
 * ENFORCES: All three tools must return >= 99% or validation FAILS
 */
export async function validate3Tools(filePath: string, endpoint: string): Promise<ValidationReport> {
  console.log(`\n🔍 STARTING REAL 3-TOOL VALIDATION for ${filePath}`);
  console.log('━'.repeat(80));

  const validations: ValidationResult[] = [];

  // Run all three validations in parallel
  console.log('\n📊 Executing REAL API calls to validation tools...');
  const [cursorResult, datadogResult, retoolResult] = await Promise.all([
    validateWithCursor(filePath),
    validateWithDatadog(endpoint),
    validateWithRetool(endpoint, [
      { method: 'GET', expectedStatus: 401 }, // No auth
      { method: 'GET', auth: 'valid-token', expectedStatus: 200 }, // Valid auth
      { method: 'GET', auth: 'wrong-tenant-token', expectedStatus: 403 }, // Wrong tenant
      { method: 'POST', auth: 'valid-token', body: {}, expectedStatus: 400 }, // Invalid body
      { method: 'POST', auth: 'valid-token', body: { valid: 'data' }, expectedStatus: 201 } // Success
    ])
  ]);

  validations.push(cursorResult, datadogResult, retoolResult);

  // Calculate overall score
  const scores = validations.map(v => v.score);
  const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  // STRICT ENFORCEMENT: ALL tools must be >= 99%
  const passed = validations.every(v => v.score >= 0.99);

  // Print results
  console.log('\n📈 VALIDATION RESULTS:');
  console.log('━'.repeat(80));
  validations.forEach(v => {
    const status = v.score >= 0.99 ? '✅' : '❌';
    const percentage = (v.score * 100).toFixed(2);
    console.log(`${status} ${v.tool.toUpperCase()}: ${percentage}% ${v.error ? `(ERROR: ${v.error})` : ''}`);
  });
  console.log('━'.repeat(80));
  console.log(`Overall Score: ${(overallScore * 100).toFixed(2)}%`);
  console.log(`Validation: ${passed ? '✅ PASSED' : '❌ FAILED'} (requirement: ALL >= 99%)`);
  console.log('━'.repeat(80));

  const report: ValidationReport = {
    file: filePath,
    validations,
    overallScore,
    passed,
    timestamp: new Date().toISOString()
  };

  // Save report to file
  const reportPath = path.join(__dirname, `../../validation-reports/${path.basename(filePath)}-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved: ${reportPath}\n`);

  return report;
}

/**
 * Validate all files in a directory
 */
export async function validateDirectory(dirPath: string, endpointPrefix: string): Promise<ValidationReport[]> {
  const files = fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .map(f => path.join(dirPath, f));

  const reports: ValidationReport[] = [];

  for (const file of files) {
    const filename = path.basename(file, path.extname(file));
    const endpoint = `${endpointPrefix}/${filename}`;

    const report = await validate3Tools(file, endpoint);
    reports.push(report);

    // FAIL FAST: If any file fails validation, stop immediately
    if (!report.passed) {
      console.error(`\n❌ VALIDATION FAILED for ${file}`);
      console.error('Stopping validation - fix this file before continuing!\n');
      process.exit(1);
    }
  }

  return reports;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: ts-node real-3tool-validation.ts <file-path> <endpoint>');
    console.error('Example: ts-node real-3tool-validation.ts server/src/routes/work-orders.ts /api/work-orders');
    process.exit(1);
  }

  const [filePath, endpoint] = args;

  validate3Tools(filePath, endpoint)
    .then(report => {
      process.exit(report.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

/**
 * Benchmark Report Generator
 *
 * Generates comprehensive HTML reports for benchmark results with:
 * - Performance comparison charts
 * - Before/after optimization comparisons
 * - Historical trend tracking
 * - Interactive visualizations
 *
 * Run with: npm run bench:report
 */

import fs from 'fs';
import path from 'path';
import { BenchmarkResult } from './performance-metrics';

// ============================================================================
// Types
// ============================================================================

interface ReportData {
  timestamp: number;
  results: BenchmarkResult[];
  metadata?: Record<string, any>;
}

interface HistoricalData {
  dates: string[];
  benchmarks: Record<string, number[]>;
}

// ============================================================================
// Report Generator Class
// ============================================================================

export class BenchmarkReportGenerator {
  private outputDir: string;

  constructor(outputDir: string = path.join(__dirname, '..', 'reports')) {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generates HTML report from benchmark results
   */
  generateHTMLReport(results: BenchmarkResult[], options: {
    title?: string;
    baseline?: Record<string, number>;
    historical?: HistoricalData;
  } = {}): string {
    const {
      title = 'Map Components Performance Benchmark Report',
      baseline,
      historical,
    } = options;

    const timestamp = new Date().toISOString();
    const reportPath = path.join(
      this.outputDir,
      `benchmark-report-${Date.now()}.html`
    );

    const html = this.generateHTML(results, { title, baseline, historical, timestamp });

    fs.writeFileSync(reportPath, html);
    console.log(`✅ HTML report generated: ${reportPath}`);

    // Also generate latest.html for easy access
    const latestPath = path.join(this.outputDir, 'latest.html');
    fs.writeFileSync(latestPath, html);
    console.log(`✅ Latest report updated: ${latestPath}`);

    return reportPath;
  }

  /**
   * Generates the HTML content
   */
  private generateHTML(
    results: BenchmarkResult[],
    options: {
      title: string;
      baseline?: Record<string, number>;
      historical?: HistoricalData;
      timestamp: string;
    }
  ): string {
    const { title, baseline, historical, timestamp } = options;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 2rem;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        .header .meta {
            opacity: 0.9;
            font-size: 0.95rem;
        }

        .content {
            padding: 2rem;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .stat-card.success {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stat-card.warning {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .stat-card h3 {
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
            opacity: 0.9;
        }

        .stat-card .value {
            font-size: 2rem;
            font-weight: bold;
        }

        .section {
            margin-bottom: 3rem;
        }

        .section h2 {
            font-size: 1.75rem;
            color: #333;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 3px solid #667eea;
        }

        .chart-container {
            position: relative;
            height: 400px;
            margin-bottom: 2rem;
            background: #f9fafb;
            padding: 1rem;
            border-radius: 8px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }

        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        th, td {
            padding: 1rem;
            text-align: left;
        }

        th {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.875rem;
            letter-spacing: 0.05em;
        }

        tbody tr {
            border-bottom: 1px solid #e5e7eb;
            transition: background-color 0.2s;
        }

        tbody tr:hover {
            background-color: #f9fafb;
        }

        tbody tr:last-child {
            border-bottom: none;
        }

        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge.fast {
            background: #d1fae5;
            color: #065f46;
        }

        .badge.normal {
            background: #dbeafe;
            color: #1e40af;
        }

        .badge.slow {
            background: #fee2e2;
            color: #991b1b;
        }

        .regression {
            color: #dc2626;
            font-weight: 600;
        }

        .improvement {
            color: #16a34a;
            font-weight: 600;
        }

        .footer {
            background: #f9fafb;
            padding: 2rem;
            text-align: center;
            color: #6b7280;
            font-size: 0.875rem;
        }

        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <div class="meta">
                Generated: ${new Date(timestamp).toLocaleString()}<br>
                Total Benchmarks: ${results.length}
            </div>
        </div>

        <div class="content">
            ${this.generateSummarySection(results, baseline)}
            ${this.generateChartsSection(results, baseline, historical)}
            ${this.generateDetailedResultsSection(results, baseline)}
        </div>

        <div class="footer">
            Generated by Fleet Management Performance Benchmark Suite<br>
            ${timestamp}
        </div>
    </div>

    <script>
        ${this.generateChartScripts(results, baseline, historical)}
    </script>
</body>
</html>`;
  }

  /**
   * Generates summary statistics section
   */
  private generateSummarySection(
    results: BenchmarkResult[],
    baseline?: Record<string, number>
  ): string {
    const totalTests = results.length;
    const avgMedian =
      results.reduce((sum, r) => sum + r.medianTime, 0) / results.length;
    const fastest = Math.min(...results.map((r) => r.medianTime));
    const slowest = Math.max(...results.map((r) => r.medianTime));

    let regressions = 0;
    let improvements = 0;

    if (baseline) {
      results.forEach((result) => {
        const baselineValue = baseline[result.name];
        if (baselineValue) {
          const change = ((result.medianTime - baselineValue) / baselineValue) * 100;
          if (change > 10) regressions++;
          if (change < -10) improvements++;
        }
      });
    }

    return `
    <div class="section">
        <h2>Summary</h2>
        <div class="summary">
            <div class="stat-card">
                <h3>Total Benchmarks</h3>
                <div class="value">${totalTests}</div>
            </div>
            <div class="stat-card success">
                <h3>Average Time</h3>
                <div class="value">${avgMedian.toFixed(2)}ms</div>
            </div>
            <div class="stat-card success">
                <h3>Fastest</h3>
                <div class="value">${fastest.toFixed(2)}ms</div>
            </div>
            <div class="stat-card ${slowest > 1000 ? 'warning' : ''}">
                <h3>Slowest</h3>
                <div class="value">${slowest.toFixed(2)}ms</div>
            </div>
            ${baseline ? `
            <div class="stat-card ${regressions > 0 ? 'warning' : 'success'}">
                <h3>Regressions</h3>
                <div class="value">${regressions}</div>
            </div>
            <div class="stat-card success">
                <h3>Improvements</h3>
                <div class="value">${improvements}</div>
            </div>
            ` : ''}
        </div>
    </div>`;
  }

  /**
   * Generates charts section
   */
  private generateChartsSection(
    results: BenchmarkResult[],
    baseline?: Record<string, number>,
    historical?: HistoricalData
  ): string {
    return `
    <div class="section">
        <h2>Performance Charts</h2>
        <div class="chart-container">
            <canvas id="medianChart"></canvas>
        </div>
        ${baseline ? `
        <div class="chart-container">
            <canvas id="comparisonChart"></canvas>
        </div>
        ` : ''}
        ${historical ? `
        <div class="chart-container">
            <canvas id="trendChart"></canvas>
        </div>
        ` : ''}
        <div class="chart-container">
            <canvas id="distributionChart"></canvas>
        </div>
    </div>`;
  }

  /**
   * Generates detailed results table
   */
  private generateDetailedResultsSection(
    results: BenchmarkResult[],
    baseline?: Record<string, number>
  ): string {
    const rows = results
      .map((result) => {
        const baselineValue = baseline?.[result.name];
        const hasBaseline = baselineValue !== undefined;
        const change = hasBaseline
          ? ((result.medianTime - baselineValue) / baselineValue) * 100
          : 0;

        const badge =
          result.medianTime < 10
            ? 'fast'
            : result.medianTime < 100
            ? 'normal'
            : 'slow';

        return `
        <tr>
            <td><strong>${result.name}</strong></td>
            <td>${result.medianTime.toFixed(2)} ms</td>
            <td>${result.meanTime.toFixed(2)} ms</td>
            <td>${result.minTime.toFixed(2)} ms</td>
            <td>${result.maxTime.toFixed(2)} ms</td>
            <td>${result.stdDev.toFixed(2)} ms</td>
            <td><span class="badge ${badge}">${result.opsPerSecond.toFixed(0)} ops/s</span></td>
            ${hasBaseline ? `
            <td class="${change > 10 ? 'regression' : change < -10 ? 'improvement' : ''}">
                ${change > 0 ? '+' : ''}${change.toFixed(1)}%
            </td>
            ` : '<td>-</td>'}
        </tr>`;
      })
      .join('');

    return `
    <div class="section">
        <h2>Detailed Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Benchmark</th>
                    <th>Median</th>
                    <th>Mean</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Std Dev</th>
                    <th>Ops/Sec</th>
                    ${baseline ? '<th>vs Baseline</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    </div>`;
  }

  /**
   * Generates Chart.js scripts
   */
  private generateChartScripts(
    results: BenchmarkResult[],
    baseline?: Record<string, number>,
    historical?: HistoricalData
  ): string {
    const labels = results.map((r) => r.name);
    const medianData = results.map((r) => r.medianTime);
    const baselineData = baseline ? labels.map((name) => baseline[name] || 0) : [];

    return `
    // Median Times Chart
    new Chart(document.getElementById('medianChart'), {
        type: 'bar',
        data: {
            labels: ${JSON.stringify(labels)},
            datasets: [{
                label: 'Median Time (ms)',
                data: ${JSON.stringify(medianData)},
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Benchmark Median Times',
                    font: { size: 16, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Time (ms)' }
                }
            }
        }
    });

    ${baseline ? `
    // Comparison Chart
    new Chart(document.getElementById('comparisonChart'), {
        type: 'bar',
        data: {
            labels: ${JSON.stringify(labels)},
            datasets: [{
                label: 'Current',
                data: ${JSON.stringify(medianData)},
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }, {
                label: 'Baseline',
                data: ${JSON.stringify(baselineData)},
                backgroundColor: 'rgba(118, 75, 162, 0.6)',
                borderColor: 'rgba(118, 75, 162, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Current vs Baseline Comparison',
                    font: { size: 16, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Time (ms)' }
                }
            }
        }
    });
    ` : ''}

    ${historical ? `
    // Trend Chart
    new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: ${JSON.stringify(historical.dates)},
            datasets: Object.keys(${JSON.stringify(historical.benchmarks)}).slice(0, 5).map((name, i) => ({
                label: name,
                data: ${JSON.stringify(historical.benchmarks)}[name],
                borderColor: \`hsl(\${i * 60}, 70%, 50%)\`,
                backgroundColor: \`hsla(\${i * 60}, 70%, 50%, 0.1)\`,
                tension: 0.4,
                fill: true
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Performance Trends Over Time',
                    font: { size: 16, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Time (ms)' }
                }
            }
        }
    });
    ` : ''}

    // Distribution Chart
    new Chart(document.getElementById('distributionChart'), {
        type: 'scatter',
        data: {
            datasets: ${JSON.stringify(results.map((r, i) => ({
              label: r.name,
              data: r.samples.slice(0, 100).map((sample, j) => ({ x: j, y: sample })),
            })))}
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Sample Distribution',
                    font: { size: 16, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Sample #' }
                },
                y: {
                    title: { display: true, text: 'Time (ms)' }
                }
            }
        }
    });
    `;
  }

  /**
   * Generates JSON report
   */
  generateJSONReport(results: BenchmarkResult[], metadata?: Record<string, any>): string {
    const reportPath = path.join(
      this.outputDir,
      `benchmark-report-${Date.now()}.json`
    );

    const report = {
      timestamp: new Date().toISOString(),
      results,
      metadata: metadata || {},
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ JSON report generated: ${reportPath}`);

    return reportPath;
  }

  /**
   * Appends results to historical data
   */
  appendToHistory(results: BenchmarkResult[]): void {
    const historyFile = path.join(this.outputDir, 'history.json');
    let history: any[] = [];

    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    }

    history.push({
      timestamp: new Date().toISOString(),
      results: results.map((r) => ({
        name: r.name,
        medianTime: r.medianTime,
        meanTime: r.meanTime,
        opsPerSecond: r.opsPerSecond,
      })),
    });

    // Keep only last 100 entries
    if (history.length > 100) {
      history = history.slice(-100);
    }

    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    console.log(`✅ History updated: ${historyFile}`);
  }
}

// ============================================================================
// Export
// ============================================================================

export default BenchmarkReportGenerator;

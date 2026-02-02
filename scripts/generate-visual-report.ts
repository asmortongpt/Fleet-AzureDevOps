#!/usr/bin/env tsx

/**
 * Generate HTML Visual Testing Report
 *
 * This script generates a comprehensive HTML report from visual test results
 * showing all captured screenshots organized by viewport and page.
 */

import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  screenshot: string
  timestamp: string
  viewport: string
  page: string
  type: string
}

function generateReport() {
  console.log('🎨 Generating Visual Testing Report...\n')

  const resultsDir = path.join(process.cwd(), 'test-results', 'visual')
  const reportPath = path.join(process.cwd(), 'test-results', 'visual-test-report.html')

  // Check if results directory exists
  if (!fs.existsSync(resultsDir)) {
    console.error('❌ No test results found. Run tests first with: npm run test:visual')
    process.exit(1)
  }

  // Get all screenshots
  const screenshots = fs.readdirSync(resultsDir)
    .filter(file => file.endsWith('.png'))
    .map(file => {
      const stats = fs.statSync(path.join(resultsDir, file))
      const parts = file.replace('.png', '').split('-')

      return {
        screenshot: file,
        timestamp: stats.mtime.toISOString(),
        viewport: parts[0] || 'unknown',
        page: parts.slice(1).join('-') || 'unknown',
        type: file.includes('modal') ? 'modal' :
              file.includes('tab') ? 'tab' :
              file.includes('search') ? 'search' :
              file.includes('filter') ? 'filter' :
              file.includes('chart') ? 'chart' :
              file.includes('table') ? 'table' :
              'page'
      }
    })
    .sort((a, b) => a.screenshot.localeCompare(b.screenshot))

  console.log(`📸 Found ${screenshots.length} screenshots`)

  // Group by viewport
  const viewports = ['desktop', 'tablet', 'mobile']
  const groupedByViewport: Record<string, TestResult[]> = {}

  viewports.forEach(viewport => {
    groupedByViewport[viewport] = screenshots.filter(s => s.viewport === viewport)
  })

  // Group by page type
  const pageTypes = ['hub', 'module', 'chart', 'table', 'modal', 'nav', 'settings', 'profile']
  const groupedByType: Record<string, TestResult[]> = {}

  pageTypes.forEach(type => {
    groupedByType[type] = screenshots.filter(s => s.page.includes(type))
  })

  // Load summary if exists
  let summary: any = null
  const summaryPath = path.join(process.cwd(), 'test-results', 'visual-test-summary.json')
  if (fs.existsSync(summaryPath)) {
    summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'))
  }

  // Generate HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fleet Management System - Visual Testing Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
      color: #333;
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
      text-align: center;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: #667eea;
      display: block;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: #6c757d;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tabs {
      display: flex;
      gap: 1rem;
      padding: 1.5rem 2rem 0;
      border-bottom: 2px solid #e9ecef;
      background: white;
      overflow-x: auto;
    }

    .tab {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      color: #6c757d;
      white-space: nowrap;
      transition: all 0.3s ease;
    }

    .tab:hover {
      color: #667eea;
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
    }

    .tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }

    .content {
      padding: 2rem;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .section {
      margin-bottom: 3rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #667eea;
    }

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .screenshot-card {
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .screenshot-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .screenshot-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      cursor: pointer;
      background: #f8f9fa;
    }

    .screenshot-info {
      padding: 1rem;
    }

    .screenshot-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
      word-break: break-word;
    }

    .screenshot-meta {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-viewport {
      background: #e7f5ff;
      color: #1971c2;
    }

    .badge-type {
      background: #fff3bf;
      color: #f08c00;
    }

    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 9999;
      padding: 2rem;
      overflow: auto;
    }

    .modal.active {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-content {
      max-width: 90vw;
      max-height: 90vh;
      position: relative;
    }

    .modal-image {
      max-width: 100%;
      max-height: 90vh;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }

    .modal-close {
      position: absolute;
      top: -2.5rem;
      right: 0;
      background: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .modal-close:hover {
      background: #f8f9fa;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .filter-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #e9ecef;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .filter-btn:hover {
      border-color: #667eea;
      color: #667eea;
    }

    .filter-btn.active {
      background: #667eea;
      border-color: #667eea;
      color: white;
    }

    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }

      .header h1 {
        font-size: 1.75rem;
      }

      .gallery {
        grid-template-columns: 1fr;
      }

      .stats {
        grid-template-columns: 1fr 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 Visual Testing Report</h1>
      <p>Fleet Management System - Comprehensive Visual Regression Testing</p>
      ${summary ? `<p style="margin-top: 1rem; opacity: 0.8;">Generated: ${new Date(summary.timestamp).toLocaleString()}</p>` : ''}
    </div>

    <div class="stats">
      <div class="stat-card">
        <span class="stat-number">${screenshots.length}</span>
        <span class="stat-label">Screenshots</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${groupedByViewport.desktop.length}</span>
        <span class="stat-label">Desktop</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${groupedByViewport.tablet.length}</span>
        <span class="stat-label">Tablet</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${groupedByViewport.mobile.length}</span>
        <span class="stat-label">Mobile</span>
      </div>
      ${summary ? `
      <div class="stat-card">
        <span class="stat-number">${summary.testCoverage.hubPages}</span>
        <span class="stat-label">Hub Pages</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${summary.testCoverage.modulePages}</span>
        <span class="stat-label">Module Pages</span>
      </div>
      ` : ''}
    </div>

    <div class="tabs">
      <button class="tab active" data-tab="all">All Screenshots</button>
      <button class="tab" data-tab="desktop">Desktop</button>
      <button class="tab" data-tab="tablet">Tablet</button>
      <button class="tab" data-tab="mobile">Mobile</button>
      <button class="tab" data-tab="hubs">Hub Pages</button>
      <button class="tab" data-tab="modules">Module Pages</button>
      <button class="tab" data-tab="charts">Charts</button>
      <button class="tab" data-tab="tables">Tables</button>
    </div>

    <div class="content">
      <!-- All Screenshots Tab -->
      <div class="tab-content active" data-content="all">
        <div class="section">
          <h2 class="section-title">All Screenshots (${screenshots.length})</h2>
          <div class="gallery">
            ${screenshots.map(s => `
              <div class="screenshot-card">
                <img
                  src="visual/${s.screenshot}"
                  alt="${s.page}"
                  class="screenshot-image"
                  onclick="openModal('visual/${s.screenshot}')"
                />
                <div class="screenshot-info">
                  <div class="screenshot-name">${s.page}</div>
                  <div class="screenshot-meta">
                    <span class="badge badge-viewport">${s.viewport}</span>
                    <span class="badge badge-type">${s.type}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Desktop Tab -->
      <div class="tab-content" data-content="desktop">
        <div class="section">
          <h2 class="section-title">Desktop Screenshots (${groupedByViewport.desktop.length})</h2>
          <div class="gallery">
            ${groupedByViewport.desktop.map(s => `
              <div class="screenshot-card">
                <img
                  src="visual/${s.screenshot}"
                  alt="${s.page}"
                  class="screenshot-image"
                  onclick="openModal('visual/${s.screenshot}')"
                />
                <div class="screenshot-info">
                  <div class="screenshot-name">${s.page}</div>
                  <div class="screenshot-meta">
                    <span class="badge badge-type">${s.type}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Tablet Tab -->
      <div class="tab-content" data-content="tablet">
        <div class="section">
          <h2 class="section-title">Tablet Screenshots (${groupedByViewport.tablet.length})</h2>
          ${groupedByViewport.tablet.length > 0 ? `
          <div class="gallery">
            ${groupedByViewport.tablet.map(s => `
              <div class="screenshot-card">
                <img
                  src="visual/${s.screenshot}"
                  alt="${s.page}"
                  class="screenshot-image"
                  onclick="openModal('visual/${s.screenshot}')"
                />
                <div class="screenshot-info">
                  <div class="screenshot-name">${s.page}</div>
                  <div class="screenshot-meta">
                    <span class="badge badge-type">${s.type}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📱</div>
            <p>No tablet screenshots available</p>
          </div>
          `}
        </div>
      </div>

      <!-- Mobile Tab -->
      <div class="tab-content" data-content="mobile">
        <div class="section">
          <h2 class="section-title">Mobile Screenshots (${groupedByViewport.mobile.length})</h2>
          ${groupedByViewport.mobile.length > 0 ? `
          <div class="gallery">
            ${groupedByViewport.mobile.map(s => `
              <div class="screenshot-card">
                <img
                  src="visual/${s.screenshot}"
                  alt="${s.page}"
                  class="screenshot-image"
                  onclick="openModal('visual/${s.screenshot}')"
                />
                <div class="screenshot-info">
                  <div class="screenshot-name">${s.page}</div>
                  <div class="screenshot-meta">
                    <span class="badge badge-type">${s.type}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📱</div>
            <p>No mobile screenshots available</p>
          </div>
          `}
        </div>
      </div>

      <!-- Hub Pages Tab -->
      <div class="tab-content" data-content="hubs">
        <div class="section">
          <h2 class="section-title">Hub Pages (${groupedByType.hub?.length || 0})</h2>
          ${groupedByType.hub && groupedByType.hub.length > 0 ? `
          <div class="gallery">
            ${groupedByType.hub.map(s => `
              <div class="screenshot-card">
                <img
                  src="visual/${s.screenshot}"
                  alt="${s.page}"
                  class="screenshot-image"
                  onclick="openModal('visual/${s.screenshot}')"
                />
                <div class="screenshot-info">
                  <div class="screenshot-name">${s.page}</div>
                  <div class="screenshot-meta">
                    <span class="badge badge-viewport">${s.viewport}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : `
          <div class="empty-state">
            <div class="empty-state-icon">🏢</div>
            <p>No hub page screenshots available</p>
          </div>
          `}
        </div>
      </div>

      <!-- Module Pages Tab -->
      <div class="tab-content" data-content="modules">
        <div class="section">
          <h2 class="section-title">Module Pages (${groupedByType.module?.length || 0})</h2>
          ${groupedByType.module && groupedByType.module.length > 0 ? `
          <div class="gallery">
            ${groupedByType.module.map(s => `
              <div class="screenshot-card">
                <img
                  src="visual/${s.screenshot}"
                  alt="${s.page}"
                  class="screenshot-image"
                  onclick="openModal('visual/${s.screenshot}')"
                />
                <div class="screenshot-info">
                  <div class="screenshot-name">${s.page}</div>
                  <div class="screenshot-meta">
                    <span class="badge badge-viewport">${s.viewport}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : `
          <div class="empty-state">
            <div class="empty-state-icon">⚙️</div>
            <p>No module screenshots available</p>
          </div>
          `}
        </div>
      </div>

      <!-- Charts Tab -->
      <div class="tab-content" data-content="charts">
        <div class="section">
          <h2 class="section-title">Charts & Graphs (${groupedByType.chart?.length || 0})</h2>
          ${groupedByType.chart && groupedByType.chart.length > 0 ? `
          <div class="gallery">
            ${groupedByType.chart.map(s => `
              <div class="screenshot-card">
                <img
                  src="visual/${s.screenshot}"
                  alt="${s.page}"
                  class="screenshot-image"
                  onclick="openModal('visual/${s.screenshot}')"
                />
                <div class="screenshot-info">
                  <div class="screenshot-name">${s.page}</div>
                  <div class="screenshot-meta">
                    <span class="badge badge-viewport">${s.viewport}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <p>No chart screenshots available</p>
          </div>
          `}
        </div>
      </div>

      <!-- Tables Tab -->
      <div class="tab-content" data-content="tables">
        <div class="section">
          <h2 class="section-title">Data Tables (${groupedByType.table?.length || 0})</h2>
          ${groupedByType.table && groupedByType.table.length > 0 ? `
          <div class="gallery">
            ${groupedByType.table.map(s => `
              <div class="screenshot-card">
                <img
                  src="visual/${s.screenshot}"
                  alt="${s.page}"
                  class="screenshot-image"
                  onclick="openModal('visual/${s.screenshot}')"
                />
                <div class="screenshot-info">
                  <div class="screenshot-name">${s.page}</div>
                  <div class="screenshot-meta">
                    <span class="badge badge-viewport">${s.viewport}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <p>No table screenshots available</p>
          </div>
          `}
        </div>
      </div>
    </div>
  </div>

  <!-- Modal for full-size images -->
  <div class="modal" id="imageModal" onclick="closeModal()">
    <div class="modal-content" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeModal()">×</button>
      <img id="modalImage" class="modal-image" src="" alt="Full size screenshot">
    </div>
  </div>

  <script>
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab')

        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')

        // Update active content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'))
        document.querySelector(\`[data-content="\${tabName}"]\`).classList.add('active')
      })
    })

    // Modal functions
    function openModal(imageSrc) {
      document.getElementById('modalImage').src = imageSrc
      document.getElementById('imageModal').classList.add('active')
    }

    function closeModal() {
      document.getElementById('imageModal').classList.remove('active')
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    })
  </script>
</body>
</html>
  `

  // Write HTML report
  fs.writeFileSync(reportPath, html)

  console.log(`\n✅ Visual testing report generated!`)
  console.log(`📄 Report location: ${reportPath}`)
  console.log(`\n🌐 Open the report in your browser:`)
  console.log(`   file://${reportPath}\n`)
}

// Run the script
generateReport()

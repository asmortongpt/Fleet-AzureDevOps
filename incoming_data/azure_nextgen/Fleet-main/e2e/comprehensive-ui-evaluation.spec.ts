import * as fs from 'fs'

import { test } from '@playwright/test'

test('Comprehensive UI Evaluation - Screenshot and analyze all pages', async ({ page }) => {
  test.setTimeout(600000) // 10 minutes

  console.log('Starting comprehensive UI evaluation...\n')

  // Enable demo mode
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.setItem('demo_mode', 'true')
    localStorage.setItem('demo_role', 'Admin')
  })
  await page.reload({ waitUntil: 'networkidle' })

  const pages = [
    { name: 'Dashboard', url: '/', file: 'dashboard' },
    { name: 'Financial Hub', url: '/financial', file: 'financial-hub' },
    { name: 'Fleet Hub', url: '/fleet', file: 'fleet-hub' },
    { name: 'Maintenance Hub', url: '/maintenance', file: 'maintenance-hub' },
    { name: 'Procurement Hub', url: '/procurement', file: 'procurement-hub' },
    { name: 'Operations Hub', url: '/operations', file: 'operations-hub' },
    { name: 'Drivers Hub', url: '/drivers', file: 'drivers-hub' },
    { name: 'Safety Hub', url: '/safety', file: 'safety-hub' },
    { name: 'Compliance Hub', url: '/compliance', file: 'compliance-hub' },
    { name: 'Analytics Hub', url: '/analytics', file: 'analytics-hub' },
  ]

  const evaluationResults: any[] = []

  for (const pageInfo of pages) {
    try {
      console.log(`\n${'='.repeat(70)}`)
      console.log(`Evaluating: ${pageInfo.name}`)
      console.log('='.repeat(70))

      await page.goto(`http://localhost:5173${pageInfo.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      await page.waitForTimeout(3000)

      // Capture full page screenshot
      await page.screenshot({
        path: `/tmp/ui-evaluation/${pageInfo.file}-full.png`,
        fullPage: true
      })

      // Capture viewport screenshot
      await page.screenshot({
        path: `/tmp/ui-evaluation/${pageInfo.file}-viewport.png`,
        fullPage: false
      })

      // Collect detailed metrics
      const metrics = await page.evaluate(() => {
        const results: any = {
          url: window.location.href,
          title: document.title,
          bodyStyles: window.getComputedStyle(document.body),
          errors: [] as string[],
          warnings: [] as string[],
          textElements: {
            tooSmall: 0,
            appropriate: 0,
            sizes: [] as number[]
          },
          colorContrast: {
            lowContrast: 0,
            acceptable: 0
          },
          interactiveElements: {
            buttons: 0,
            links: 0,
            inputs: 0
          },
          layout: {
            hasHeader: false,
            hasSidebar: false,
            hasFooter: false,
            mainContentWidth: 0
          },
          contentDensity: {
            paragraphs: 0,
            headings: 0,
            images: 0,
            tables: 0,
            cards: 0
          }
        }

        // Check for error messages
        const errorElements = document.querySelectorAll('[class*="error" i], [role="alert"], .text-red-500, .text-red-600')
        errorElements.forEach(el => {
          if (el.textContent?.trim()) {
            results.errors.push(el.textContent.trim().substring(0, 100))
          }
        })

        // Analyze text sizes
        const allTextElements = document.querySelectorAll('p, span, div, a, button, label, li, td, th, h1, h2, h3, h4, h5, h6')
        allTextElements.forEach(el => {
          if (el.textContent && el.textContent.trim().length > 0) {
            const fontSize = window.getComputedStyle(el).fontSize
            const size = parseFloat(fontSize)
            results.textElements.sizes.push(size)
            if (size < 12) {
              results.textElements.tooSmall++
            } else {
              results.textElements.appropriate++
            }
          }
        })

        // Check contrast (simple check)
        const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6')
        textElements.forEach(el => {
          const style = window.getComputedStyle(el)
          const color = style.color
          const bg = style.backgroundColor
          // Simple check for white on white or black on black
          if ((color === 'rgb(255, 255, 255)' && bg === 'rgb(255, 255, 255)') ||
              (color === 'rgb(0, 0, 0)' && bg === 'rgb(0, 0, 0)')) {
            results.colorContrast.lowContrast++
          } else {
            results.colorContrast.acceptable++
          }
        })

        // Count interactive elements
        results.interactiveElements.buttons = document.querySelectorAll('button').length
        results.interactiveElements.links = document.querySelectorAll('a').length
        results.interactiveElements.inputs = document.querySelectorAll('input, textarea, select').length

        // Check layout structure
        results.layout.hasHeader = document.querySelector('header, [role="banner"]') !== null
        results.layout.hasSidebar = document.querySelector('aside, nav, [role="navigation"]') !== null
        results.layout.hasFooter = document.querySelector('footer, [role="contentinfo"]') !== null

        const main = document.querySelector('main, [role="main"]')
        if (main) {
          results.layout.mainContentWidth = main.getBoundingClientRect().width
        }

        // Count content elements
        results.contentDensity.paragraphs = document.querySelectorAll('p').length
        results.contentDensity.headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length
        results.contentDensity.images = document.querySelectorAll('img').length
        results.contentDensity.tables = document.querySelectorAll('table').length
        results.contentDensity.cards = document.querySelectorAll('[class*="card" i]').length

        return results
      })

      console.log(`✓ Screenshots captured`)
      console.log(`  - Errors found: ${metrics.errors.length}`)
      console.log(`  - Text too small: ${metrics.textElements.tooSmall} elements`)
      console.log(`  - Buttons: ${metrics.interactiveElements.buttons}`)
      console.log(`  - Cards: ${metrics.contentDensity.cards}`)
      console.log(`  - Headings: ${metrics.contentDensity.headings}`)

      evaluationResults.push({
        page: pageInfo.name,
        url: pageInfo.url,
        metrics: metrics
      })

    } catch (error) {
      console.log(`✗ Failed to evaluate ${pageInfo.name}:`, error)
      evaluationResults.push({
        page: pageInfo.name,
        url: pageInfo.url,
        error: String(error)
      })
    }
  }

  // Save evaluation results
  fs.writeFileSync(
    '/tmp/ui-evaluation/evaluation-results.json',
    JSON.stringify(evaluationResults, null, 2)
  )

  console.log('\n' + '='.repeat(70))
  console.log('UI Evaluation Complete!')
  console.log('Screenshots saved to: /tmp/ui-evaluation/')
  console.log('Results saved to: /tmp/ui-evaluation/evaluation-results.json')
  console.log('='.repeat(70))
})

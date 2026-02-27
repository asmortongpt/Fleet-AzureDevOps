import { test } from '@playwright/test'

test('find what is preventing logo from rendering', async ({ page }) => {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })

  // First, just get HTML structure
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 2000))
  console.log('=== Body HTML (first 2000 chars) ===')
  console.log(bodyHTML)

  // Check for all img tags
  const imgs = await page.$$eval('img', el => el.map(img => ({
    src: img.src,
    alt: img.alt
  })))
  console.log('\n=== All <img> tags on page ===')
  console.log(`Total: ${imgs.length}`)
  imgs.forEach(img => console.log(`  ${img.src} (alt: "${img.alt}")`))

  // Check for ArchonYLogo component in React tree
  const archonyElements = await page.$$eval('[alt*="ARCHONY"], [src*="Screenshot"]', els =>
    els.map(el => ({
      tag: el.tagName,
      src: (el as any).src || 'N/A',
      alt: (el as any).alt || 'N/A',
      visible: (el as any).offsetHeight > 0
    }))
  )
  console.log('\n=== Elements with ARCHONY or Screenshot ===')
  console.log(`Found: ${archonyElements.length}`)
  archonyElements.forEach(el => {
    console.log(`  <${el.tag}> src="${el.src}" alt="${el.alt}" visible=${el.visible}`)
  })

  // Check what's in the sidebar area
  const sidebarArea = await page.evaluate(() => {
    const nav = document.querySelector('nav')
    const sidebar = document.querySelector('[role="complementary"]')
    const left = document.querySelector('[class*="sidebar"]')
    return {
      nav: nav?.outerHTML.substring(0, 500) || 'NOT FOUND',
      sidebar: sidebar?.outerHTML.substring(0, 500) || 'NOT FOUND',
      left: left?.outerHTML.substring(0, 500) || 'NOT FOUND'
    }
  })
  console.log('\n=== Sidebar area search ===')
  console.log(JSON.stringify(sidebarArea, null, 2))

  // Check for motion components (Framer Motion)
  const motionDivs = await page.$$eval('div[style*="opacity"]', divs =>
    divs.slice(0, 5).map(div => ({
      hasImg: div.querySelector('img') !== null,
      style: div.getAttribute('style'),
      classes: div.className
    }))
  )
  console.log('\n=== Divs with animation (opacity style) ===')
  motionDivs.forEach((div, i) => {
    console.log(`  [${i}] hasImg=${div.hasImg}, classes="${div.classes}"`)
  })

  // Direct test - can we access the image?
  const imageTest = await page.evaluate(async () => {
    try {
      const resp = await fetch('/logos/approved-branding/Screenshot 2026-02-15 at 4.05.10 PM.png')
      return `Image file exists: ${resp.ok} (status ${resp.status})`
    } catch (e) {
      return `Fetch failed: ${(e as Error).message}`
    }
  })
  console.log('\n=== Direct image fetch ===')
  console.log(imageTest)

  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-logo-final.png', fullPage: true })
})

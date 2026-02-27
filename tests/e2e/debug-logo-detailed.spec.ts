import { test, expect } from '@playwright/test'

test.describe('Logo Component Debugging', () => {
  test('detailed investigation of ArchonYLogo rendering', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })

    // Check if ArchonYLogo component is even rendering
    console.log('\n=== Checking for ArchonYLogo in DOM ===')

    // Check for any div that might contain the logo
    const logoContainer = await page.$$('div:has(img[alt*="ARCHONY"]), div:has(img[src*="Screenshot"])')
    console.log(`Logo container found: ${logoContainer.length}`)

    // Check sidebar structure
    console.log('\n=== Sidebar Structure ===')
    const sidebar = page.locator('[aria-label="Application sidebar"]')
    const sidebarHTML = await sidebar.innerHTML()
    console.log(`Sidebar HTML length: ${sidebarHTML.length}`)
    console.log(sidebarHTML.substring(0, 500))

    // Look for motion div elements
    const motionDivs = await page.$$eval('div', divs =>
      divs
        .filter(div => div.style.opacity !== undefined || div.style.transform !== undefined)
        .map(div => ({
          classes: div.className,
          hasImg: div.querySelector('img') !== null,
          innerHTML: div.innerHTML.substring(0, 200)
        }))
        .slice(0, 10)
    )
    console.log('\n=== Motion divs (with animation styles) ===')
    motionDivs.forEach((div, i) => {
      console.log(`${i}: classes="${div.classes}", hasImg=${div.hasImg}`)
    })

    // Check all img tags in the entire page
    console.log('\n=== All img tags in page ===')
    const allImgs = await page.$$eval('img', imgs => imgs.map(img => ({
      src: img.src,
      alt: img.alt,
      offsetHeight: img.offsetHeight,
      offsetWidth: img.offsetWidth,
      complete: img.complete,
      naturalWidth: img.naturalWidth
    })))
    console.log(`Total img tags: ${allImgs.length}`)
    allImgs.forEach((img, i) => {
      console.log(`  [${i}] ${img.src}`)
      console.log(`       Size: ${img.offsetWidth}x${img.offsetHeight}, Complete: ${img.complete}, Natural: ${img.naturalWidth}`)
    })

    // Check the specific logo file in the DevTools
    console.log('\n=== Checking if img src attribute contains the logo ===')
    const logoImgs = await page.$$eval('img[src*="Screenshot"], img[alt*="ARCHONY"]', imgs =>
      imgs.map(img => img.src)
    )
    console.log(`Logo images found: ${logoImgs.length}`)
    logoImgs.forEach(src => console.log(`  - ${src}`))

    // Check if the logo path is in any attribute
    console.log('\n=== Checking all elements with "Screenshot" in attributes ===')
    const screenshotElements = await page.$$eval('*', els =>
      els
        .filter(el => {
          const allAttrs = Array.from(el.attributes).map(attr => attr.value).join(' ')
          return allAttrs.includes('Screenshot')
        })
        .map(el => ({
          tag: el.tagName,
          src: (el as any).src,
          alt: (el as any).alt,
          html: el.outerHTML.substring(0, 300)
        }))
        .slice(0, 5)
    )
    console.log(`Elements with "Screenshot": ${screenshotElements.length}`)
    screenshotElements.forEach((el, i) => {
      console.log(`  [${i}] <${el.tag}> src="${el.src}" alt="${el.alt}"`)
      console.log(`       HTML: ${el.html}`)
    })

    // Take screenshot to visually inspect
    await page.screenshot({ path: 'test-results/debug-logo-detailed.png', fullPage: true })
    console.log('\nScreenshot saved')
  })
})

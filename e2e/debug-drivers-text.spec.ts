import { test, expect } from '@playwright/test'

test('Debug Drivers Hub small text', async ({ page }) => {
  // Enable demo mode first
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.setItem('demo_mode', 'true')
    localStorage.setItem('demo_role', 'Admin')
  })
  await page.reload({ waitUntil: 'networkidle' })

  await page.goto('http://localhost:5173/drivers', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  // Use same selector as comprehensive test
  const results = await page.evaluate(() => {
    const allTextElements = document.querySelectorAll('p, span, div, a, button, label, li, td, th, h1, h2, h3, h4, h5, h6')
    const smallElements: Array<{ tag: string; text: string; fontSize: number; classes: string }> = []

    allTextElements.forEach(el => {
      if (el.textContent && el.textContent.trim().length > 0) {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize)
        if (fontSize < 12) {
          smallElements.push({
            tag: el.tagName.toLowerCase(),
            text: el.textContent.trim().substring(0, 50),
            fontSize: fontSize,
            classes: el.className || ''
          })
        }
      }
    })

    return smallElements
  })

  console.log('\n======== SMALL TEXT ELEMENTS (<12px) ========')
  console.log(`Total found: ${results.length}`)
  console.log('\nSample elements:')
  results.slice(0, 30).forEach((el, i) => {
    console.log(`${i + 1}. <${el.tag}> "${el.text}" - ${el.fontSize}px`)
    console.log(`   Class: ${el.classes}`)
    console.log('')
  })

  // Group by fontSize
  const sizeGroups = results.reduce((acc, el) => {
    const key = el.fontSize.toString()
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\n======== SIZE DISTRIBUTION ========')
  Object.entries(sizeGroups).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).forEach(([size, count]) => {
    console.log(`${size}px: ${count} elements`)
  })
})

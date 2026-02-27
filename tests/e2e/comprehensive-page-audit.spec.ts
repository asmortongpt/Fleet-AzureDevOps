import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:5173';
const AUDIT_DIR = 'test-results/page-audit';
const REQUIRED_SCORE = 100;

interface PageAudit {
  path: string;
  name: string;
  accessibility: { score: number; violations: number; details: string[] };
  usability: { score: number; details: string[] };
  design: { score: number; details: string[] };
  branding: { score: number; logoVisible: boolean; details: string[] };
  overall: number;
  screenshot: string;
  passed: boolean;
}

const pageAudits: PageAudit[] = [];

if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

async function auditAccessibility(page: any, path: string): Promise<{ score: number; violations: number; details: string[] }> {
  try {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const violations = results.violations.length;
    const passes = results.passes.length;
    const score = violations === 0 ? 100 : Math.max(0, 100 - (violations * 10));

    const details = results.violations.map(v => `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);

    return { score: Math.min(100, score), violations, details };
  } catch (error) {
    return { score: 0, violations: 999, details: [`Accessibility audit failed: ${error}`] };
  }
}

async function auditUsability(page: any): Promise<{ score: number; details: string[] }> {
  const details: string[] = [];
  let score = 100;

  // Check for proper heading structure
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
  if (headings === 0) {
    details.push('❌ No headings found - improper semantic structure');
    score -= 15;
  } else {
    details.push(`✅ Heading structure present (${headings} headings)`);
  }

  // Check for form labels
  const labels = await page.locator('label').count();
  const inputs = await page.locator('input, textarea, select').count();
  if (inputs > 0 && labels === 0) {
    details.push('❌ Form inputs found without labels');
    score -= 10;
  } else if (inputs > 0) {
    details.push(`✅ Form labels present (${labels} labels for ${inputs} inputs)`);
  }

  // Check for navigation
  const navElements = await page.locator('nav, [role="navigation"]').count();
  if (navElements === 0) {
    details.push('⚠️  No dedicated navigation elements found');
    score -= 5;
  } else {
    details.push(`✅ Navigation elements present (${navElements})`);
  }

  // Check for buttons/clickables
  const buttons = await page.locator('button, [role="button"], a[href]').count();
  if (buttons === 0) {
    details.push('❌ No interactive elements found');
    score -= 20;
  } else {
    details.push(`✅ Interactive elements present (${buttons} clickables)`);
  }

  // Check for focus management
  const focusableElements = await page.locator('button, a, input, [tabindex]').count();
  if (focusableElements === 0) {
    details.push('⚠️  Limited focusable elements for keyboard navigation');
    score -= 5;
  } else {
    details.push(`✅ Keyboard navigation support (${focusableElements} focusable elements)`);
  }

  // Check for proper landmark regions
  const landmarks = await page.locator('main, [role="main"], header, footer, aside, [role="complementary"]').count();
  if (landmarks < 2) {
    details.push('⚠️  Limited landmark regions');
    score -= 5;
  } else {
    details.push(`✅ Landmark regions present (${landmarks})`);
  }

  return { score: Math.max(0, score), details };
}

async function auditDesign(page: any): Promise<{ score: number; details: string[] }> {
  const details: string[] = [];
  let score = 100;

  const design = await page.evaluate(() => {
    const root = document.documentElement;
    const styles = window.getComputedStyle(root);
    const body = document.body;
    const bodyStyles = window.getComputedStyle(body);

    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt')).length;

    const links = document.querySelectorAll('a');
    const buttons = document.querySelectorAll('button');

    return {
      bgColor: bodyStyles.backgroundColor,
      fontFamily: bodyStyles.fontFamily,
      fontSize: bodyStyles.fontSize,
      lineHeight: bodyStyles.lineHeight,
      imagesWithoutAlt,
      totalImages: images.length,
      textContent: body.innerText.length,
      hasButtons: buttons.length > 0,
      hasLinks: links.length > 0,
      hasGradients: body.innerHTML.includes('gradient'),
      hasConsistentSpacing: body.innerHTML.includes('padding') || body.innerHTML.includes('margin'),
    };
  });

  // Check typography
  if (design.fontFamily && design.fontSize) {
    details.push(`✅ Typography defined (${design.fontSize})`);
  } else {
    details.push('⚠️  Typography may not be properly configured');
    score -= 5;
  }

  // Check images have alt text
  if (design.totalImages > 0) {
    if (design.imagesWithoutAlt === 0) {
      details.push(`✅ All ${design.totalImages} images have alt text`);
    } else {
      details.push(`❌ ${design.imagesWithoutAlt}/${design.totalImages} images missing alt text`);
      score -= 15;
    }
  }

  // Check for visual polish
  if (design.hasGradients) {
    details.push('✅ Gradient effects present');
  }

  // Check content is readable
  if (design.textContent > 50) {
    details.push('✅ Sufficient content on page');
  } else if (design.textContent > 0) {
    details.push('⚠️  Limited text content');
    score -= 10;
  }

  // Check for consistent spacing
  if (design.hasConsistentSpacing) {
    details.push('✅ Spacing and layout structure present');
  }

  // Check color contrast (basic)
  if (design.bgColor && design.bgColor !== 'rgba(0, 0, 0, 0)') {
    details.push(`✅ Background color defined (${design.bgColor})`);
  }

  return { score: Math.max(0, score), details };
}

async function auditBranding(page: any): Promise<{ score: number; logoVisible: boolean; details: string[] }> {
  const details: string[] = [];
  let score = 100;

  // Check for CTA branding
  const ctaText = await page.locator('text=/CTA|Fleet/i').count();
  const hasLogo = ctaText > 0;

  if (hasLogo) {
    details.push(`✅ CTA branding text visible (${ctaText} occurrences)`);
  } else {
    details.push('❌ CTA branding text not found');
    score -= 50;
  }

  // Check for logo image or SVG
  const logo = await page.locator('[alt*="CTA"], [alt*="Fleet"], svg[viewBox], img[src*="logo"]').count();
  if (logo > 0) {
    details.push(`✅ Logo element found (${logo})`);
  } else if (hasLogo) {
    details.push('⚠️  Logo may be text-based rather than image');
    score -= 10;
  } else {
    details.push('❌ No logo element detected');
    score -= 30;
  }

  // Check for color branding (Navy #1A1847 or Gold #F0A000)
  const branding = await page.evaluate(() => {
    const html = document.body.innerHTML;
    const hasNavy = html.includes('#1A1847') || html.includes('1A1847') || html.includes('rgb(26, 24, 71)');
    const hasGold = html.includes('#F0A000') || html.includes('F0A000') || html.includes('rgb(240, 160, 0)');
    return { hasNavy, hasGold };
  });

  if (branding.hasNavy || branding.hasGold) {
    details.push('✅ CTA brand colors detected in styling');
  } else {
    details.push('⚠️  CTA brand colors not explicitly in code (may be CSS variables)');
  }

  // Check page title
  const title = await page.title();
  if (title.includes('CTA') || title.includes('Fleet')) {
    details.push(`✅ Page title includes branding: "${title}"`);
  } else {
    details.push(`❌ Page title missing branding: "${title}"`);
    score -= 20;
  }

  return { score: Math.max(0, score), logoVisible: hasLogo, details };
}

async function auditPage(pagePath: string, pageName: string): Promise<void> {
  test(`Audit: ${pageName}`, async ({ page }) => {
    console.log(`\n${'='.repeat(70)}\n🔍 Auditing: ${pageName}\n${'='.repeat(70)}`);

    // Navigate to page
    const url = `${BASE_URL}${pagePath}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {
      // Continue even if page takes longer
    });

    // Allow page to fully load
    await page.waitForTimeout(2000);

    // Run audits
    const accessibility = await auditAccessibility(page, pagePath);
    const usability = await auditUsability(page);
    const design = await auditDesign(page);
    const branding = await auditBranding(page);

    // Calculate overall score
    const overall = Math.round((accessibility.score + usability.score + design.score + branding.score) / 4);

    // Take screenshot
    const screenshotPath = path.join(AUDIT_DIR, `${pagePath.replace(/\//g, '-') || 'home'}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Store results
    const audit: PageAudit = {
      path: pagePath,
      name: pageName,
      accessibility,
      usability,
      design,
      branding,
      overall,
      screenshot: screenshotPath,
      passed: overall === REQUIRED_SCORE,
    };

    pageAudits.push(audit);

    // Log results
    console.log(`\n📊 SCORES:`);
    console.log(`  Accessibility: ${accessibility.score}/100 (${accessibility.violations} violations)`);
    console.log(`  Usability:     ${usability.score}/100`);
    console.log(`  Design:        ${design.score}/100`);
    console.log(`  Branding:      ${branding.score}/100 (Logo: ${branding.logoVisible ? '✅' : '❌'})`);
    console.log(`  ─────────────────`);
    console.log(`  OVERALL:       ${overall}/100 ${overall === 100 ? '✅ PASS' : '❌ FAIL'}`);

    // Show issues
    if (overall < 100) {
      console.log(`\n⚠️  ISSUES FOUND:`);
      if (accessibility.violations > 0) {
        console.log(`\n  Accessibility Issues (${accessibility.violations}):`);
        accessibility.details.slice(0, 3).forEach(d => console.log(`    • ${d}`));
      }
      if (usability.score < 100) {
        console.log(`\n  Usability Issues:`);
        usability.details.filter(d => d.includes('❌') || d.includes('⚠️')).forEach(d => console.log(`    • ${d}`));
      }
      if (design.score < 100) {
        console.log(`\n  Design Issues:`);
        design.details.filter(d => d.includes('❌') || d.includes('⚠️')).forEach(d => console.log(`    • ${d}`));
      }
      if (branding.score < 100) {
        console.log(`\n  Branding Issues:`);
        branding.details.filter(d => d.includes('❌') || d.includes('⚠️')).forEach(d => console.log(`    • ${d}`));
      }
    }

    console.log(`\n📸 Screenshot: ${screenshotPath}\n`);

    // Assertion - must be 100/100 or fail
    expect(overall).toBe(REQUIRED_SCORE);
  });
}

test.describe('🎯 COMPREHENSIVE PAGE AUDIT - 100/100 REQUIREMENT', () => {
  // Define all pages to audit
  const pagesToAudit = [
    { path: '/', name: 'Dashboard Home' },
    { path: '/fleet', name: 'Fleet Management' },
    { path: '/drivers', name: 'Drivers Module' },
    { path: '/maintenance', name: 'Maintenance' },
  ];

  // Create audit tests for each page
  pagesToAudit.forEach(({ path, name }) => {
    auditPage(path, name);
  });

  test.afterAll(async () => {
    // Generate comprehensive report
    const report = {
      title: 'CTA Fleet - Comprehensive Page Audit Report',
      timestamp: new Date().toISOString(),
      requirement: '100/100 on all metrics',
      summary: {
        totalPages: pageAudits.length,
        passed: pageAudits.filter(a => a.passed).length,
        failed: pageAudits.filter(a => !a.passed).length,
        averageScore: Math.round(pageAudits.reduce((sum, a) => sum + a.overall, 0) / pageAudits.length),
      },
      pages: pageAudits.map(a => ({
        name: a.name,
        path: a.path,
        scores: {
          accessibility: a.accessibility.score,
          usability: a.usability.score,
          design: a.design.score,
          branding: a.branding.score,
          overall: a.overall,
        },
        logoVisible: a.branding.logoVisible,
        passed: a.passed,
        issues: {
          accessibility: a.accessibility.violations,
          usability: a.usability.details.filter(d => d.includes('❌')).length,
          design: a.design.details.filter(d => d.includes('❌')).length,
          branding: a.branding.details.filter(d => d.includes('❌')).length,
        },
      })),
    };

    // Save JSON report
    const jsonPath = path.join(AUDIT_DIR, 'audit-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Save Markdown report
    let markdown = `# CTA Fleet - Comprehensive Page Audit Report\n\n`;
    markdown += `**Requirement:** 100/100 on all metrics\n`;
    markdown += `**Generated:** ${report.timestamp}\n\n`;

    markdown += `## Executive Summary\n`;
    markdown += `- **Total Pages Audited:** ${report.summary.totalPages}\n`;
    markdown += `- **Passed (100/100):** ${report.summary.passed}\n`;
    markdown += `- **Failed:** ${report.summary.failed}\n`;
    markdown += `- **Average Score:** ${report.summary.averageScore}/100\n\n`;

    markdown += `## Results\n\n`;

    pageAudits.forEach(audit => {
      markdown += `### ${audit.name}\n`;
      markdown += `**Path:** \`${audit.path}\`\n`;
      markdown += `**Status:** ${audit.passed ? '✅ PASS' : '❌ FAIL'}\n\n`;
      markdown += `| Metric | Score |\n`;
      markdown += `|--------|-------|\n`;
      markdown += `| Accessibility | ${audit.accessibility.score}/100 |\n`;
      markdown += `| Usability | ${audit.usability.score}/100 |\n`;
      markdown += `| Design | ${audit.design.score}/100 |\n`;
      markdown += `| Branding (Logo: ${audit.branding.logoVisible ? '✅' : '❌'}) | ${audit.branding.score}/100 |\n`;
      markdown += `| **OVERALL** | **${audit.overall}/100** |\n\n`;

      if (!audit.passed) {
        markdown += `**Issues Found:**\n`;
        if (audit.accessibility.violations > 0) {
          markdown += `- Accessibility: ${audit.accessibility.violations} violations\n`;
        }
        if (audit.usability.score < 100) {
          markdown += `- Usability: ${audit.usability.details.filter(d => d.includes('❌')).length} issues\n`;
        }
        if (audit.design.score < 100) {
          markdown += `- Design: ${audit.design.details.filter(d => d.includes('❌')).length} issues\n`;
        }
        if (audit.branding.score < 100) {
          markdown += `- Branding: ${audit.branding.details.filter(d => d.includes('❌')).length} issues\n`;
        }
        markdown += `\n`;
      }

      markdown += `**Screenshot:** ${path.basename(audit.screenshot)}\n\n`;
    });

    const mdPath = path.join(AUDIT_DIR, 'AUDIT_REPORT.md');
    fs.writeFileSync(mdPath, markdown);

    console.log('\n' + '='.repeat(70));
    console.log('📋 AUDIT REPORT GENERATED');
    console.log('='.repeat(70));
    console.log(`\nSummary:`);
    console.log(`  Pages Audited: ${report.summary.totalPages}`);
    console.log(`  Passed (100/100): ${report.summary.passed}`);
    console.log(`  Failed: ${report.summary.failed}`);
    console.log(`  Average Score: ${report.summary.averageScore}/100`);
    console.log(`\nReports:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  Markdown: ${mdPath}`);
    console.log(`\nDirectory: ${AUDIT_DIR}\n`);
  });
});

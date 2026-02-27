#!/usr/bin/env node

/**
 * Coverage Badge Generator
 *
 * Generates dynamic coverage badges for README and pull requests.
 * Creates SVG badges showing current coverage percentage.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../public/badges');
const FRONTEND_COVERAGE_PATH = path.join(
  __dirname,
  '../coverage/coverage-summary.json'
);
const BACKEND_COVERAGE_PATH = path.join(
  __dirname,
  '../api/coverage/coverage-summary.json'
);

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Read coverage summary
 */
function readCoverageSummary(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading coverage file: ${filePath}`, error.message);
    return null;
  }
}

/**
 * Get color based on coverage percentage
 */
function getColor(percentage) {
  if (percentage >= 80) return '#4c1';
  if (percentage >= 70) return '#dfb317';
  if (percentage >= 60) return '#fe7d37';
  return '#e05d44';
}

/**
 * Generate SVG badge
 */
function generateBadgeSVG(label, value, color) {
  const valueStr = value.toFixed(1) + '%';

  // Calculate widths
  const labelWidth = label.length * 6 + 12;
  const valueWidth = valueStr.length * 6 + 12;
  const totalWidth = labelWidth + valueWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${valueStr}">
    <title>${label}: ${valueStr}</title>
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb"/>
      <stop offset="1" stop-color="#999"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
      <rect width="${labelWidth}" height="20" fill="#555"/>
      <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
      <rect width="${totalWidth}" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
      <text aria-hidden="true" x="${labelWidth * 5 + 50}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - 10) * 10}">${label}</text>
      <text x="${labelWidth * 5 + 50}" y="140" transform="scale(.1)" fill="#fff" textLength="${(labelWidth - 10) * 10}">${label}</text>
      <text aria-hidden="true" x="${(labelWidth + valueWidth / 2) * 5 + 50}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(valueWidth - 10) * 10}">${valueStr}</text>
      <text x="${(labelWidth + valueWidth / 2) * 5 + 50}" y="140" transform="scale(.1)" fill="#fff" textLength="${(valueWidth - 10) * 10}">${valueStr}</text>
    </g>
  </svg>`;

  return svg;
}

/**
 * Save badge to file
 */
function saveBadge(filename, svg) {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Badge created: ${filepath}`);
}

/**
 * Generate all badges
 */
function generateBadges() {
  console.log('🎨 Generating coverage badges...\n');

  ensureOutputDir();

  // Frontend coverage
  const frontendCoverage = readCoverageSummary(FRONTEND_COVERAGE_PATH);
  if (frontendCoverage && frontendCoverage.total) {
    const lineCoverage = frontendCoverage.total.lines.pct;
    const branchCoverage = frontendCoverage.total.branches.pct;

    const lineBadge = generateBadgeSVG('frontend coverage', lineCoverage, getColor(lineCoverage));
    const branchBadge = generateBadgeSVG('frontend branches', branchCoverage, getColor(branchCoverage));

    saveBadge('frontend-coverage.svg', lineBadge);
    saveBadge('frontend-branches.svg', branchBadge);
  }

  // Backend coverage
  const backendCoverage = readCoverageSummary(BACKEND_COVERAGE_PATH);
  if (backendCoverage && backendCoverage.total) {
    const lineCoverage = backendCoverage.total.lines.pct;
    const branchCoverage = backendCoverage.total.branches.pct;

    const lineBadge = generateBadgeSVG('backend coverage', lineCoverage, getColor(lineCoverage));
    const branchBadge = generateBadgeSVG('backend branches', branchCoverage, getColor(branchCoverage));

    saveBadge('backend-coverage.svg', lineBadge);
    saveBadge('backend-branches.svg', branchBadge);
  }

  // Combined coverage (average)
  if (frontendCoverage && backendCoverage) {
    const avgCoverage =
      (frontendCoverage.total.lines.pct + backendCoverage.total.lines.pct) / 2;
    const combinedBadge = generateBadgeSVG('overall coverage', avgCoverage, getColor(avgCoverage));
    saveBadge('coverage.svg', combinedBadge);
  }

  console.log('\n✅ Badge generation complete\n');
}

/**
 * Generate README badge markdown
 */
function generateReadmeBadges() {
  const frontendCoverage = readCoverageSummary(FRONTEND_COVERAGE_PATH);
  const backendCoverage = readCoverageSummary(BACKEND_COVERAGE_PATH);

  let markdown = '## Coverage\n\n';

  if (frontendCoverage) {
    const coverage = frontendCoverage.total.lines.pct.toFixed(1);
    markdown += `![Frontend Coverage Badge](./public/badges/frontend-coverage.svg?style=flat-square)\n`;
    markdown += `Frontend: ${coverage}%\n\n`;
  }

  if (backendCoverage) {
    const coverage = backendCoverage.total.lines.pct.toFixed(1);
    markdown += `![Backend Coverage Badge](./public/badges/backend-coverage.svg?style=flat-square)\n`;
    markdown += `Backend: ${coverage}%\n\n`;
  }

  if (frontendCoverage && backendCoverage) {
    const avg = ((frontendCoverage.total.lines.pct + backendCoverage.total.lines.pct) / 2).toFixed(1);
    markdown += `![Overall Coverage Badge](./public/badges/coverage.svg?style=flat-square)\n`;
    markdown += `Overall: ${avg}%\n`;
  }

  console.log('\n📝 Add to README.md:\n');
  console.log(markdown);

  const badgeFile = path.join(OUTPUT_DIR, '..', 'COVERAGE_BADGES.md');
  fs.writeFileSync(badgeFile, markdown);
  console.log(`✅ Badge markdown saved to ${badgeFile}`);
}

/**
 * Main function
 */
function main() {
  generateBadges();
  generateReadmeBadges();
}

// Run badge generation
main();

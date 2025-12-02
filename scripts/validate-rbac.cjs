#!/usr/bin/env node
/**
 * RBAC Implementation Validation Script
 * Scans all route files to check RBAC implementation status
 */

const fs = require('fs')
const path = require('path')

const ROUTES_DIR = path.join(__dirname, '../api/src/routes')
const FIELD_MASKING_REQUIRED = [
  'drivers.ts',
  'vehicles.ts',
  'purchase-orders.ts',
  'work-orders.ts',
  'fuel-transactions.ts',
  'safety-incidents.ts'
]

function analyzeRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const fileName = path.basename(filePath)

  // Check for imports and usage
  const hasRequirePermission = content.includes('requirePermission')
  const hasOldAuthorize = /authorize\(['"]admin['"]/.test(content)
  const hasFieldMasking = content.includes('applyFieldMasking')

  // Count occurrences
  const authorizeMatches = content.match(/authorize\(/g)
  const requirePermissionMatches = content.match(/requirePermission\(/g)
  const authorizeCount = authorizeMatches ? authorizeMatches.length : 0
  const requirePermissionCount = requirePermissionMatches ? requirePermissionMatches.length : 0

  // Extract endpoints
  const endpoints = extractEndpoints(content)

  // Determine status
  let status
  if (hasRequirePermission && !hasOldAuthorize) {
    status = 'full'
  } else if (hasRequirePermission && hasOldAuthorize) {
    status = 'partial'
  } else {
    status = 'none'
  }

  return {
    file: fileName,
    hasRequirePermission,
    hasOldAuthorize,
    hasFieldMasking,
    authorizeCount,
    requirePermissionCount,
    endpoints,
    status
  }
}

function extractEndpoints(content) {
  const endpoints = []

  // Match router.get, router.post, router.put, router.delete, router.patch
  const routeRegex = /router\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^,]+)/g
  let match

  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase()
    const path = match[2]
    const middlewareSection = match[3]

    let authType = 'none'
    let permission = undefined

    if (middlewareSection.includes('requirePermission')) {
      authType = 'requirePermission'
      const permMatch = middlewareSection.match(/requirePermission\(['"`]([^'"`]+)['"`]\)/)
      if (permMatch) {
        permission = permMatch[1]
      }
    } else if (middlewareSection.includes('authorize')) {
      authType = 'authorize'
    }

    const hasFieldMasking = content.includes('applyFieldMasking')

    endpoints.push({
      method,
      path,
      authType,
      permission,
      hasFieldMasking
    })
  }

  return endpoints
}

function generateReport() {
  const files = fs.readdirSync(ROUTES_DIR)
    .filter(f => f.endsWith('.ts') && !f.endsWith('.backup') && !f.endsWith('.disabled'))

  const analyses = []

  for (const file of files) {
    const filePath = path.join(ROUTES_DIR, file)
    const analysis = analyzeRouteFile(filePath)
    analyses.push(analysis)
  }

  const fullyUpdated = analyses.filter(a => a.status === 'full')
  const partiallyUpdated = analyses.filter(a => a.status === 'partial')
  const notUpdated = analyses.filter(a => a.status === 'none')

  const needsFieldMasking = FIELD_MASKING_REQUIRED.filter(file => {
    const analysis = analyses.find(a => a.file === file)
    return analysis && !analysis.hasFieldMasking
  })

  const totalEndpoints = analyses.reduce((sum, a) => sum + a.endpoints.length, 0)

  return {
    totalRoutes: analyses.length,
    fullyUpdated,
    partiallyUpdated,
    notUpdated,
    needsFieldMasking,
    summary: {
      fullCount: fullyUpdated.length,
      partialCount: partiallyUpdated.length,
      noneCount: notUpdated.length,
      totalEndpoints
    }
  }
}

function printReport(report) {
  console.log('\n' + '='.repeat(80))
  console.log('RBAC IMPLEMENTATION VALIDATION REPORT')
  console.log('='.repeat(80) + '\n')

  console.log('SUMMARY')
  console.log('-'.repeat(80))
  console.log(`Total Route Files:        ${report.totalRoutes}`)
  console.log(`Total API Endpoints:      ${report.summary.totalEndpoints}`)
  console.log(`✅ Fully Updated:         ${report.summary.fullCount} (${Math.round(report.summary.fullCount / report.totalRoutes * 100)}%)`)
  console.log(`⚠️  Partially Updated:     ${report.summary.partialCount} (${Math.round(report.summary.partialCount / report.totalRoutes * 100)}%)`)
  console.log(`❌ Not Updated:           ${report.summary.noneCount} (${Math.round(report.summary.noneCount / report.totalRoutes * 100)}%)`)
  console.log()

  if (report.fullyUpdated.length > 0) {
    console.log('✅ FULLY UPDATED ROUTES (' + report.fullyUpdated.length + ')')
    console.log('-'.repeat(80))
    report.fullyUpdated.forEach(route => {
      const maskingStatus = route.hasFieldMasking ? '🔒' : '  '
      console.log(`  ${maskingStatus} ${route.file} (${route.requirePermissionCount} endpoints)`)
    })
    console.log()
  }

  if (report.partiallyUpdated.length > 0) {
    console.log('⚠️  PARTIALLY UPDATED ROUTES (' + report.partiallyUpdated.length + ')')
    console.log('-'.repeat(80))
    report.partiallyUpdated.forEach(route => {
      const maskingStatus = route.hasFieldMasking ? '🔒' : '  '
      console.log(`  ${maskingStatus} ${route.file}`)
      console.log(`     - requirePermission(): ${route.requirePermissionCount}`)
      console.log(`     - authorize():         ${route.authorizeCount}`)
    })
    console.log()
  }

  if (report.notUpdated.length > 0) {
    console.log('❌ NOT UPDATED (Still Using Old authorize()) (' + report.notUpdated.length + ')')
    console.log('-'.repeat(80))
    report.notUpdated.forEach(route => {
      console.log(`  ${route.file} (${route.authorizeCount} authorize() calls)`)
    })
    console.log()
  }

  if (report.needsFieldMasking.length > 0) {
    console.log('🔒 MISSING FIELD MASKING')
    console.log('-'.repeat(80))
    console.log('The following routes handle sensitive data but lack field masking:')
    report.needsFieldMasking.forEach(file => {
      console.log(`  - ${file}`)
    })
    console.log()
  }

  console.log('DETAILED ENDPOINT ANALYSIS')
  console.log('-'.repeat(80))

  // Show a sample of endpoints using old authorize
  const oldAuthorizeEndpoints = []
  report.notUpdated.forEach(route => {
    route.endpoints.forEach(ep => {
      if (ep.authType === 'authorize') {
        oldAuthorizeEndpoints.push({ file: route.file, endpoint: ep })
      }
    })
  })

  if (oldAuthorizeEndpoints.length > 0) {
    console.log(`Found ${oldAuthorizeEndpoints.length} endpoints still using authorize()`)
    console.log('Sample (first 10):')
    oldAuthorizeEndpoints.slice(0, 10).forEach(item => {
      console.log(`  ${item.file}: ${item.endpoint.method} ${item.endpoint.path}`)
    })
    console.log()
  }

  console.log('NEXT STEPS')
  console.log('-'.repeat(80))

  if (report.summary.noneCount > 0) {
    console.log('1. Update remaining routes to use requirePermission() middleware')
    console.log(`   - ${report.summary.noneCount} route files need updating`)
  }

  if (report.summary.partialCount > 0) {
    console.log('2. Complete partial migrations:')
    report.partiallyUpdated.forEach(route => {
      console.log(`   - ${route.file}: Convert ${route.authorizeCount} authorize() calls`)
    })
  }

  if (report.needsFieldMasking.length > 0) {
    console.log('3. Add field masking to sensitive endpoints:')
    report.needsFieldMasking.forEach(file => {
      console.log(`   - ${file}: Add applyFieldMasking() middleware`)
    })
  }

  if (report.summary.fullCount === report.totalRoutes && report.needsFieldMasking.length === 0) {
    console.log('🎉 ALL ROUTES FULLY UPDATED WITH RBAC!')
    console.log('   - Run database migration: 002_rbac_permissions.sql')
    console.log('   - Configure user scopes and approval limits')
    console.log('   - Enable MFA for required roles')
    console.log('   - Test break-glass workflow')
  }

  console.log()
  console.log('='.repeat(80))
}

// Main execution
try {
  const report = generateReport()
  printReport(report)

  // Exit with error code if there are issues
  if (report.summary.noneCount > 0 || report.summary.partialCount > 0 || report.needsFieldMasking.length > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
} catch (error) {
  console.error('Error running validation:', error)
  process.exit(1)
}

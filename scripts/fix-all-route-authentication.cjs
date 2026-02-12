#!/usr/bin/env node
/**
 * Automated Route Authentication Fixer
 * Adds router.use(authenticateJWT) to all routes that don't have it
 */

const fs = require('fs');
const path = require('path');

// List of all vulnerable files from /tmp/vulnerable-by-file.json
const vulnerableFiles = [
  'api/src/routes/policy-templates.ts',
  'api/src/routes/outlook.routes.ts',
  'api/src/routes/search.ts',
  'api/src/routes/mobile-hardware.routes.ts',
  'api/src/routes/maintenance-schedules.ts',
  'api/src/routes/inventory.routes.ts',
  'api/src/routes/custom-reports.routes.ts',
  'api/src/routes/routes.ts',
  'api/src/routes/purchase-orders-enhanced.routes.ts',
  'api/src/routes/heavy-equipment.routes.ts',
  'api/src/routes/emulator.routes.ts',
  'api/src/routes/documents.ts',
  'api/src/routes/documents.routes.ts',
  'api/src/routes/document-geo.routes.ts',
  'api/src/routes/dispatch.routes.ts',
  'api/src/routes/attachments.routes.ts',
  'api/src/routes/alerts.routes.ts',
  'api/src/routes/ai-search.ts',
  'api/src/routes/admin/configuration.ts',
  'api/src/routes/teams.routes.ts',
  'api/src/routes/sync.routes.ts',
  'api/src/routes/storage-admin.ts',
  'api/src/routes/reservations.ts',
  'api/src/routes/ocr.routes.ts',
  'api/src/routes/mobile-integration.routes.ts',
  'api/src/routes/incidents.ts',
  'api/src/routes/documents/index.ts',
  'api/src/routes/auth.routes.ts',
  'api/src/routes/ai-task-prioritization.routes.ts',
  'api/src/routes/admin-jobs.routes.ts',
  'api/src/routes/vehicle-identification.routes.ts',
  'api/src/routes/safety-alerts.ts',
  'api/src/routes/queue.routes.ts',
  'api/src/routes/personal-use-charges.ts',
  'api/src/routes/osha-compliance.ts',
  'api/src/routes/mobile-obd2.routes.ts',
  'api/src/routes/emulators.routes.ts',
  'api/src/routes/damage-reports.ts',
  'api/src/routes/communications.ts',
  'api/src/routes/asset-management.routes.ts',
  'api/src/routes/vehicle-hardware-config.routes.ts',
  'api/src/routes/trip-usage.ts',
  'api/src/routes/telematics.routes.ts',
  'api/src/routes/task-management.routes.ts',
  'api/src/routes/scan-sessions.routes.ts',
  'api/src/routes/safety-notifications.ts',
  'api/src/routes/route-emulator.routes.ts',
  'api/src/routes/reimbursement-requests.ts',
  'api/src/routes/permissions.routes.ts',
  'api/src/routes/mobile-trips.routes.ts',
  'api/src/routes/mobile-photos.routes.ts',
  'api/src/routes/mobile-messaging.routes.ts',
  'api/src/routes/incident-management.routes.ts',
  'api/src/routes/hos.ts',
  'api/src/routes/damage-reports.routes.ts',
  'api/src/routes/auth.ts',
  'api/src/routes/asset-relationships.routes.ts',
  'api/src/routes/ai-dispatch.routes.ts',
  'api/src/routes/ai-chat.ts',
  'api/src/routes/work-orders.ts',
  'api/src/routes/vendors.ts',
  'api/src/routes/vehicles.ts',
  'api/src/routes/vehicle-3d.routes.ts',
  'api/src/routes/trip-marking.ts',
  'api/src/routes/telemetry.ts',
  'api/src/routes/tasks.ts',
  'api/src/routes/scheduling-notifications.routes.ts',
  'api/src/routes/safety-training.ts',
  'api/src/routes/safety-incidents.ts',
  'api/src/routes/route-optimization.routes.ts',
  'api/src/routes/purchase-orders.ts',
  'api/src/routes/policies.ts',
  'api/src/routes/parts.ts',
  'api/src/routes/mobile-ocr.routes.ts',
  'api/src/routes/mileage-reimbursement.ts',
  'api/src/routes/maintenance.ts',
  'api/src/routes/langchain.routes.ts',
  'api/src/routes/invoices.ts',
  'api/src/routes/inspections.ts',
  'api/src/routes/geofences.ts',
  'api/src/routes/garage-bays.ts',
  'api/src/routes/fuel-transactions.ts',
  'api/src/routes/fuel-purchasing.routes.ts',
  'api/src/routes/fleet-documents.routes.ts',
  'api/src/routes/facilities.ts',
  'api/src/routes/document-search.example.ts',
  'api/src/routes/communication-logs.ts',
  'api/src/routes/charging-stations.ts',
  'api/src/routes/charging-sessions.ts',
  'api/src/routes/break-glass.ts',
  'api/src/routes/arcgis-layers.ts',
  'api/src/routes/ai/chat.ts',
  'api/src/routes/admin/users.routes.ts',
  'api/src/routes/video-events.ts',
  'api/src/routes/obd2-emulator.routes.ts',
  'api/src/routes/gps.ts',
  'api/src/routes/geospatial.routes.ts',
  'api/src/routes/fleet-optimizer.routes.ts',
  'api/src/routes/e2e-test.routes.ts',
  'api/src/routes/deployments.ts',
  'api/src/routes/dashboard.routes.ts',
  'api/src/routes/costs.ts',
  'api/src/routes/cost-analysis.routes.ts',
  'api/src/routes/compliance.ts',
  'api/src/routes/assets-mobile.routes.ts',
  'api/src/routes/ai-damage-detection.routes.ts',
  'api/src/routes/webhooks/teams.webhook.ts',
  'api/src/routes/webhooks/outlook.webhook.ts',
  'api/src/routes/system/connections.ts',
  'api/src/routes/quality-gates.ts',
  'api/src/routes/personal-use-policies.ts',
  'api/src/routes/monitoring/query-performance.ts',
  'api/src/routes/integrations-health.ts',
  'api/src/routes/health-startup.routes.ts',
  'api/src/routes/driver-scorecard.routes.ts',
  'api/src/routes/drill-through/drill-through.routes.ts',
  'api/src/routes/crash-detection.routes.ts',
  'api/src/routes/billing-reports.ts',
  'api/src/routes/analytics.ts'
];

const projectRoot = '/Users/andrewmorton/Documents/GitHub/Fleet-CTA';

function hasRouterAuth(content) {
  // Check if router.use(authenticateJWT) already exists
  return /router\.use\(authenticateJWT\)/g.test(content);
}

function hasAuthImport(content) {
  // Check if authenticateJWT is imported
  return /import.*authenticateJWT.*from.*['"]\.\.\/middleware\/auth['"]/g.test(content);
}

function addRouterAuth(content, filePath) {
  const lines = content.split('\n');

  // Find router = declaration
  let routerLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/const\s+router\s*=/.test(lines[i])) {
      routerLine = i;
      break;
    }
  }

  if (routerLine === -1) {
    console.log(`⚠️  ${filePath}: Could not find router declaration`);
    return content;
  }

  // Check if auth already exists
  if (hasRouterAuth(content)) {
    console.log(`✓ ${filePath}: Already has router.use(authenticateJWT)`);
    return content;
  }

  // Add authentication after router declaration
  lines.splice(routerLine + 1, 0, '', '// Apply authentication to all routes', 'router.use(authenticateJWT)');

  return lines.join('\n');
}

function addAuthImport(content, filePath) {
  if (hasAuthImport(content)) {
    return content;
  }

  const lines = content.split('\n');

  // Find last import statement
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i]) || /^}\s+from\s/.test(lines[i])) {
      lastImportLine = i;
    }
  }

  if (lastImportLine === -1) {
    console.log(`⚠️  ${filePath}: Could not find import statements`);
    return content;
  }

  // Add import after last import
  lines.splice(lastImportLine + 1, 0, "import { authenticateJWT } from '../middleware/auth'");

  return lines.join('\n');
}

function processFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  ${filePath}: File not found`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  const originalContent = content;

  // Add import if needed
  if (!hasAuthImport(content)) {
    content = addAuthImport(content, filePath);
  }

  // Add router-level auth
  content = addRouterAuth(content, filePath);

  // Write back if changed
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✓ ${filePath}: Added authentication`);
    return true;
  }

  return false;
}

// Process all files
console.log(`Starting authentication fix for ${vulnerableFiles.length} files...\n`);
let processedCount = 0;
let skippedCount = 0;

for (const filePath of vulnerableFiles) {
  if (processFile(filePath)) {
    processedCount++;
  } else {
    skippedCount++;
  }
}

console.log(`\n✅ Complete! Processed ${processedCount} files, skipped ${skippedCount} files`);
console.log(`\nNext steps:`);
console.log(`1. Review changes: git diff`);
console.log(`2. Test TypeScript compilation: npm run typecheck`);
console.log(`3. Commit changes: git add . && git commit -m "security: Add authentication to all routes"`);

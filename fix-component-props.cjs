#!/usr/bin/env node

/**
 * Add data?: any prop to component interfaces
 * This fixes TS2322 errors where components are passed a data prop
 */

const fs = require('fs');
const path = require('path');

// Components that receive data={fleetData} in App.tsx
const components = [
  { file: 'src/components/FleetDashboard.tsx', interface: 'FleetDashboardProps' },
  { file: 'src/components/modules/ExecutiveDashboard.tsx', interface: 'ExecutiveDashboardProps' },
  { file: 'src/components/modules/PeopleManagement.tsx', interface: 'PeopleManagementProps' },
  { file: 'src/components/modules/GarageService.tsx', interface: 'GarageServiceProps' },
  { file: 'src/components/VirtualGarage.tsx', interface: 'VirtualGarageProps' },
  { file: 'src/components/modules/PredictiveMaintenance.tsx', interface: 'PredictiveMaintenanceProps' },
  { file: 'src/components/modules/FuelManagement.tsx', interface: 'FuelManagementProps' },
  { file: 'src/components/DataWorkbench.tsx', interface: 'DataWorkbenchProps' },
  { file: 'src/components/modules/MileageReimbursement.tsx', interface: 'MileageReimbursementProps' },
  { file: 'src/components/modules/MaintenanceRequest.tsx', interface: 'MaintenanceRequestProps' },
  { file: 'src/components/RouteManagement.tsx', interface: 'RouteManagementProps' },
  { file: 'src/components/modules/GISCommandCenter.tsx', interface: 'GISCommandCenterProps' },
  { file: 'src/components/modules/DriverPerformance.tsx', interface: 'DriverPerformanceProps' },
  { file: 'src/components/modules/FleetAnalytics.tsx', interface: 'FleetAnalyticsProps' },
  { file: 'src/components/modules/AssetManagement.tsx', interface: 'AssetManagementProps' },
  { file: 'src/components/modules/EquipmentDashboard.tsx', interface: 'EquipmentDashboardProps' },
];

let fixed = 0;
let skipped = 0;
let errors = 0;

console.log('🔧 Adding data props to component interfaces...\n');

components.forEach(({ file, interface: interfaceName }) => {
  try {
    const filePath = path.join(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} (not found)`);
      skipped++;
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if interface exists
    const interfaceRegex = new RegExp(`(export\\s+)?interface\\s+${interfaceName}\\s*{`, 'g');
    if (!interfaceRegex.test(content)) {
      console.log(`⚠️  Skipping ${file} (interface ${interfaceName} not found)`);
      skipped++;
      return;
    }

    // Reset regex
    interfaceRegex.lastIndex = 0;

    // Check if data prop already exists
    if (content.includes('data?:') || content.includes('data :')) {
      console.log(`⏭️  Skipping ${file} (data prop already exists)`);
      skipped++;
      return;
    }

    // Add data?: any prop right after interface opening brace
    content = content.replace(
      interfaceRegex,
      (match) => `${match}\n  data?: any`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Added data prop to ${interfaceName} in ${file}`);
    fixed++;

  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
    errors++;
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Fixed: ${fixed} components`);
console.log(`⏭️  Skipped: ${skipped} components`);
console.log(`❌ Errors: ${errors} components`);
console.log(`${'='.repeat(60)}\n`);

console.log('Running TypeScript check...');

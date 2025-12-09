import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173');
await page.waitForTimeout(2000);

// Take screenshot
await page.screenshot({ path: '/tmp/current-ui-state.png', fullPage: true });

// Get sidebar state
const sidebarState = await page.evaluate(() => {
  const sidebar = document.querySelector('[data-testid="mobile-nav"]');
  if (!sidebar) return 'SIDEBAR NOT FOUND';
  const styles = window.getComputedStyle(sidebar);
  return {
    width: styles.width,
    classes: sidebar.className,
    display: styles.display,
    overflow: styles.overflow
  };
});
console.log('=== SIDEBAR STATE ===');
console.log(JSON.stringify(sidebarState, null, 2));

// Check if FleetDashboard is rendering
const dashboardState = await page.evaluate(() => {
  const dashboard = document.querySelector('[data-testid="dashboard-container"]');
  return {
    exists: !!dashboard,
    visible: dashboard ? window.getComputedStyle(dashboard).display !== 'none' : false,
    classList: dashboard ? dashboard.className : null
  };
});
console.log('\n=== FLEET DASHBOARD STATE ===');
console.log(JSON.stringify(dashboardState, null, 2));

// Check for vehicle table
const tableState = await page.evaluate(() => {
  const table = document.querySelector('table');
  const tableContainer = document.querySelector('[data-testid="fleet-table"]');
  return {
    tableExists: !!table,
    tableContainerExists: !!tableContainer,
    rowCount: table ? table.querySelectorAll('tbody tr').length : 0
  };
});
console.log('\n=== TABLE STATE ===');
console.log(JSON.stringify(tableState, null, 2));

await browser.close();

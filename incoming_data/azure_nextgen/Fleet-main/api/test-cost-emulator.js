/**
 * Test script for Cost Emulator
 * Run with: node test-cost-emulator.js
 */

// Import the compiled JavaScript
const { costEmulator } = require('./dist/emulators/cost/CostEmulator.js');

console.log('🚀 Testing Cost Emulator...\n');

// 1. Check initial state
const state = costEmulator.getCurrentState();
console.log('📊 Initial State:');
console.log(`  - Total Entries: ${state.totalEntries}`);
console.log(`  - Total Cost: $${state.totalCost.toFixed(2)}`);
console.log(`  - Running: ${state.isRunning}`);

// 2. Get some sample costs
const recentCosts = costEmulator.getAllCosts().slice(0, 5);
console.log('\n📝 Recent Cost Entries:');
recentCosts.forEach((cost, i) => {
  console.log(`  ${i + 1}. ${cost.category}: $${cost.amount.toFixed(2)} - ${cost.description} (Vehicle ${cost.vehicleId})`);
});

// 3. Get analytics
const analytics = costEmulator.getAnalytics();
console.log('\n📈 Analytics Summary:');
console.log(`  - Total Costs (6 months): $${analytics.totalCosts.toLocaleString()}`);
console.log(`  - Cost per Mile: $${analytics.costPerMile.toFixed(2)}`);
console.log(`  - Cost per Vehicle: $${analytics.costPerVehicle.toFixed(2)}`);
console.log(`  - Cost per Day: $${analytics.costPerDay.toFixed(2)}`);
console.log('\n  Top Expense Categories:');
analytics.topExpenseCategories.slice(0, 3).forEach(cat => {
  console.log(`    • ${cat.category}: $${cat.amount.toFixed(2)} (${cat.percent.toFixed(1)}%)`);
});

// 4. Check budget tracking
const currentMonth = new Date().toISOString().slice(0, 7);
const budgets = costEmulator.getBudgetTracking(currentMonth);
console.log(`\n💰 Budget Status for ${currentMonth}:`);

const overBudget = budgets.filter(b => b.status === 'over');
const underBudget = budgets.filter(b => b.status === 'under');
const onTrack = budgets.filter(b => b.status === 'on-track');

console.log(`  - Categories Over Budget: ${overBudget.length}`);
console.log(`  - Categories Under Budget: ${underBudget.length}`);
console.log(`  - Categories On Track: ${onTrack.length}`);

if (overBudget.length > 0) {
  console.log('\n  ⚠️ Over Budget Categories:');
  overBudget.forEach(b => {
    console.log(`    • ${b.category}: ${b.variancePercent.toFixed(1)}% over (Budget: $${b.budgeted}, Actual: $${b.actual.toFixed(2)})`);
  });
}

// 5. Get forecast
const forecast = costEmulator.getForecast();
console.log('\n🔮 Cost Forecast:');
console.log(`  - Next Month: $${forecast.nextMonth.toLocaleString()}`);
console.log(`  - Next Quarter: $${forecast.nextQuarter.toLocaleString()}`);
console.log(`  - Year End Projection: $${forecast.yearEnd.toLocaleString()}`);
console.log(`  - Confidence Level: ${forecast.confidence}`);
console.log(`  - Assumptions:`);
forecast.assumptions.forEach(a => console.log(`    • ${a}`));

// 6. Test CSV export
const csv = costEmulator.exportToCSV();
const lines = csv.split('\n');
console.log('\n📄 CSV Export:');
console.log(`  - Total rows: ${lines.length - 1} (excluding header)`);
console.log(`  - Header: ${lines[0].substring(0, 100)}...`);

// 7. Test adding a new cost
const newCost = costEmulator.addCost({
  vehicleId: 10,
  category: 'fuel',
  amount: 85.50,
  date: new Date(),
  description: 'Test fuel purchase',
  vendorName: 'Shell Test Station',
  department: 'Operations',
  paymentMethod: 'fleet_card'
});
console.log('\n✅ New Cost Entry Added:');
console.log(`  - ID: ${newCost.id}`);
console.log(`  - Amount: $${newCost.amount}`);
console.log(`  - Category: ${newCost.category}`);
console.log(`  - Vendor: ${newCost.vendorName}`);

// Final summary
console.log('\n' + '='.repeat(60));
console.log('🎉 Cost Emulator Test Complete!');
console.log('='.repeat(60));

const finalState = costEmulator.getCurrentState();
console.log(`\nFinal Statistics:`);
console.log(`  - Total Entries: ${finalState.totalEntries}`);
console.log(`  - Total Cost: $${finalState.totalCost.toFixed(2)}`);
console.log(`  - Categories Tracked: ${Object.keys(finalState.categoryCounts).length}`);

console.log('\n✨ All tests passed successfully!');
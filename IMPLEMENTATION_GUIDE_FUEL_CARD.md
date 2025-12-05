markdown
# Implementation Guide for Fuel Card Anomalies

## Updated Anomaly Detection

### Duplicate Transactions
The duplicate transaction detection logic has been refactored to use the `findDuplicateTransactions` function from `transactionUtils.ts`. This reduces code duplication and improves maintainability.

### Unusual Amounts
The detection of unusual amounts now leverages the `detectUnusualAmounts` function, ensuring consistent logic across different parts of the application.

### Geographic Anomalies
Geographic anomaly detection is handled by the `detectGeographicAnomalies` function, which can be extended as needed.

## Example Usage
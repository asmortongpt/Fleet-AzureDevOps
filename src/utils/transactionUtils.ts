/**
 * Utility functions for transaction anomaly detection.
 * @module transactionUtils
 */

interface Transaction {
  amount: number;
  merchant_name: string;
  transaction_date: string;
}

interface Anomaly {
  type: string;
  severity: string;
  count?: number;
  average?: number;
}

/**
 * Finds duplicate transactions based on amount, merchant name, and transaction date.
 * @param {Transaction[]} transactions - List of transactions to analyze.
 * @returns {Transaction[]} - List of duplicate transactions.
 */
export function findDuplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Map<string, Transaction>();
  const duplicates: Transaction[] = [];

  transactions?.forEach(tx => {
    const key = `${tx?.amount}-${tx?.merchant_name}-${tx?.transaction_date}`;
    if (seen.has(key)) {
      duplicates.push(tx);
    } else {
      seen.set(key, tx);
    }
  });

  return duplicates;
}

/**
 * Detects transactions with unusual amounts.
 * @param {Transaction[]} transactions - List of transactions to analyze.
 * @returns {Anomaly[]} - List of anomalies detected.
 */
export function detectUnusualAmounts(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const avgAmount = transactions?.reduce((sum, tx) => sum + (tx?.amount ?? 0), 0) / (transactions?.length || 1);
  const highAmount = transactions?.filter(tx => (tx?.amount ?? 0) > avgAmount * 2.5) ?? [];

  if (highAmount.length > 3) {
    anomalies.push({
      type: 'UNUSUAL_AMOUNTS',
      severity: 'warning',
      count: highAmount.length,
      average: avgAmount
    });
  }

  return anomalies;
}

/**
 * Detects geographic anomalies in transactions.
 * @param {Transaction[]} transactions - List of transactions to analyze.
 * @returns {Anomaly[]} - List of geographic anomalies detected.
 */
export function detectGeographicAnomalies(_transactions: Transaction[]): Anomaly[] {
  // Placeholder for geographic anomaly detection logic
  return [];
}
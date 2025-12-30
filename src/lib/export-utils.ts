/**
 * Export/Import Utilities
 *
 * Centralized utilities for exporting and importing data across all modules.
 * Eliminates duplicate export/import logic in 15+ modules.
 *
 * Supported formats:
 * - CSV (export & import)
 * - Excel (export & import)
 * - PDF (export only - requires jsPDF)
 * - JSON (export & import)
 *
 * Features:
 * - Type-safe exports with TypeScript
 * - Automatic filename generation
 * - Custom column mapping
 * - Data validation on import
 * - Error handling
 * - Progress callbacks for large datasets
 *
 * Usage:
 *
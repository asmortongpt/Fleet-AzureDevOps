// Export utilities
import logger from '@/utils/logger';
export function exportToCSV(_data: unknown): void {
  logger.info('Export to CSV')
}

export function exportToPDF(_data: unknown): void {
  logger.info('Export to PDF')
}

export function exportToExcel(_data: unknown): void {
  logger.info('Export to Excel')
}

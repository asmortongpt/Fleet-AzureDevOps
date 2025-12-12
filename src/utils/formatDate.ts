export function formatDate(date: Date): string {
  try {
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}
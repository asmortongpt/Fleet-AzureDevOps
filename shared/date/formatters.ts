import { format } from 'date-fns';

const formatDate = (date: Date, formatString: string = 'yyyy-MM-dd'): string => {
  try {
    return format(date, formatString);
  } catch (error) {
    logger.error(`Error formatting date: ${error.message}`);
    throw new Error('Invalid date format');
  }
};

const formatISO = (date: Date): string => {
  try {
    return date.toISOString();
  } catch (error) {
    logger.error(`Error formatting ISO date: ${error.message}`);
    throw new Error('Invalid date');
  }
};

export { formatDate, formatISO };
import { parseISO } from 'date-fns';

const parseDate = (dateString: string, formatString: string = 'yyyy-MM-dd'): Date => {
  try {
    return parseISO(dateString);
  } catch (error) {
    logger.error(`Error parsing date: ${error.message}`);
    throw new Error('Invalid date string');
  }
};

export { parseDate };
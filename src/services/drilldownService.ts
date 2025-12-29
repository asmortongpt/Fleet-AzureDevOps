import logger from '@/utils/logger'

/**
 * Service for handling drilldown operations.
 * @module drilldownService
 */

interface DrilldownConfig {
  [key: string]: (id: string, name: string) => void;
}

const drilldownConfig: DrilldownConfig = {
  vehicle: (id, name) => logger.debug(`Navigating to vehicle detail: ${id}, ${name}`),
  driver: (id, name) => logger.debug(`Navigating to driver detail: ${id}, ${name}`),
  maintenance: (id, name) => logger.debug(`Navigating to maintenance detail: ${id}, ${name}`),
  facility: (id, name) => logger.debug(`Navigating to facility detail: ${id}, ${name}`)
};

/**
 * Opens the detail view for a given entity type.
 * @param {string} entityType - The type of entity to drill down into.
 * @param {string} id - The unique identifier of the entity.
 * @param {string} name - The display name of the entity.
 */
export function openEntityDetail(entityType: string, id: string, name: string): void {
  const action = drilldownConfig[entityType];
  if (action) {
    action(id, name);
  } else {
    logger.error(`No drilldown configuration found for entity type: ${entityType}`);
  }
}
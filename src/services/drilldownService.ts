/**
 * Service for handling drilldown operations.
 * @module drilldownService
 */

interface DrilldownConfig {
  [key: string]: (id: string, name: string) => void;
}

const drilldownConfig: DrilldownConfig = {
  vehicle: (id, name) => console.log(`Navigating to vehicle detail: ${id}, ${name}`),
  driver: (id, name) => console.log(`Navigating to driver detail: ${id}, ${name}`),
  maintenance: (id, name) => console.log(`Navigating to maintenance detail: ${id}, ${name}`),
  facility: (id, name) => console.log(`Navigating to facility detail: ${id}, ${name}`)
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
    console.error(`No drilldown configuration found for entity type: ${entityType}`);
  }
}
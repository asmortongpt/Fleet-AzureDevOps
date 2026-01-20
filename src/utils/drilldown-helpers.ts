import { DrilldownConfig, DrilldownLevel, DrilldownState } from '../types/drilldown';

export function createDrilldownState(
  config: DrilldownConfig,
  initialLevel?: string
): DrilldownState {
  const firstLevel = initialLevel || config.levels[0]?.field;
  
  if (!firstLevel) {
    throw new Error('Drilldown configuration must have at least one level');
  }

  return {
    currentLevel: firstLevel,
    filters: {},
    breadcrumbs: []
  };
}

export function navigateToDrilldown(
  state: DrilldownState,
  config: DrilldownConfig,
  level: string,
  value: string | number,
  label?: string
): DrilldownState {
  const levelIndex = config.levels.findIndex(l => l.field === level);
  
  if (levelIndex === -1) {
    throw new Error(`Level "${level}" not found in drilldown configuration`);
  }

  const nextLevelIndex = levelIndex + 1;
  const nextLevel = config.levels[nextLevelIndex];
  
  if (!nextLevel) {
    return state; // Already at the deepest level
  }

  const newFilters = { ...state.filters };
  const newBreadcrumbs = [...state.breadcrumbs];

  // Remove filters and breadcrumbs for levels deeper than the current one
  config.levels.slice(nextLevelIndex).forEach(l => {
    delete newFilters[l.field];
  });
  
  const breadcrumbIndex = newBreadcrumbs.findIndex(b => b.level === level);
  if (breadcrumbIndex !== -1) {
    newBreadcrumbs.splice(breadcrumbIndex + 1);
  }

  // Add the new filter and breadcrumb
  newFilters[level] = value;
  newBreadcrumbs.push({
    level,
    value,
    label: label || String(value)
  });

  return {
    currentLevel: nextLevel.field,
    filters: newFilters,
    breadcrumbs: newBreadcrumbs
  };
}

export function navigateUp(
  state: DrilldownState,
  config: DrilldownConfig,
  targetLevel?: string
): DrilldownState {
  if (!targetLevel && state.breadcrumbs.length === 0) {
    return state; // Already at the top level
  }

  let newBreadcrumbs = [...state.breadcrumbs];
  const newFilters = { ...state.filters };

  if (targetLevel) {
    const targetIndex = newBreadcrumbs.findIndex(b => b.level === targetLevel);
    if (targetIndex === -1) {
      return state; // Target level not in breadcrumbs
    }
    
    // Remove breadcrumbs after the target
    newBreadcrumbs = newBreadcrumbs.slice(0, targetIndex);
  } else {
    // Go up one level
    newBreadcrumbs.pop();
  }

  // Determine the new current level
  let newCurrentLevel: string;
  if (newBreadcrumbs.length === 0) {
    newCurrentLevel = config.levels[0].field;
  } else {
    const lastBreadcrumb = newBreadcrumbs[newBreadcrumbs.length - 1];
    const lastLevelIndex = config.levels.findIndex(l => l.field === lastBreadcrumb.level);
    newCurrentLevel = config.levels[lastLevelIndex + 1]?.field || lastBreadcrumb.level;
  }

  // Remove filters for levels we've navigated away from
  const currentLevelIndex = config.levels.findIndex(l => l.field === newCurrentLevel);
  config.levels.slice(currentLevelIndex).forEach(l => {
    delete newFilters[l.field];
  });

  return {
    currentLevel: newCurrentLevel,
    filters: newFilters,
    breadcrumbs: newBreadcrumbs
  };
}

export function getCurrentLevelConfig(
  state: DrilldownState,
  config: DrilldownConfig
): DrilldownLevel | undefined {
  return config.levels.find(level => level.field === state.currentLevel);
}

export function getAvailableLevels(
  state: DrilldownState,
  config: DrilldownConfig
): DrilldownLevel[] {
  const currentIndex = config.levels.findIndex(l => l.field === state.currentLevel);
  return config.levels.slice(0, currentIndex + 1);
}

export function canDrillDown(
  state: DrilldownState,
  config: DrilldownConfig
): boolean {
  const currentIndex = config.levels.findIndex(l => l.field === state.currentLevel);
  return currentIndex < config.levels.length - 1;
}

export function canDrillUp(state: DrilldownState): boolean {
  return state.breadcrumbs.length > 0;
}

export function getDrilldownPath(state: DrilldownState): string {
  return state.breadcrumbs
    .map(b => b.label)
    .join(' > ');
}

export function buildDrilldownQuery(
  state: DrilldownState,
  baseQuery?: Record<string, any>
): Record<string, any> {
  return {
    ...baseQuery,
    ...state.filters
  };
}

export function validateDrilldownConfig(config: DrilldownConfig): string[] {
  const errors: string[] = [];

  if (!config.levels || config.levels.length === 0) {
    errors.push('Drilldown configuration must have at least one level');
  }

  const fieldNames = new Set<string>();
  config.levels.forEach((level, index) => {
    if (!level.field) {
      errors.push(`Level at index ${index} must have a field`);
    }
    
    if (!level.label) {
      errors.push(`Level at index ${index} must have a label`);
    }

    if (fieldNames.has(level.field)) {
      errors.push(`Duplicate field name "${level.field}" in drilldown configuration`);
    }
    
    fieldNames.add(level.field);
  });

  return errors;
}

export function resetDrilldownState(config: DrilldownConfig): DrilldownState {
  return createDrilldownState(config);
}
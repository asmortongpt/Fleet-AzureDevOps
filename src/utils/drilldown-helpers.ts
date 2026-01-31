import {
  HierarchicalDrilldownConfig,
  HierarchicalDrilldownLevel,
  HierarchicalDrilldownState,
  DrilldownBreadcrumbItem
} from '../types/drilldown';

export function createDrilldownState(
  config: HierarchicalDrilldownConfig,
  initialLevel?: string
): HierarchicalDrilldownState {
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
  state: HierarchicalDrilldownState,
  config: HierarchicalDrilldownConfig,
  level: string,
  value: string | number,
  label?: string
): HierarchicalDrilldownState {
  const levelIndex = config.levels.findIndex((l: HierarchicalDrilldownLevel) => l.field === level);
  
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
  config.levels.slice(nextLevelIndex).forEach((l: HierarchicalDrilldownLevel) => {
    delete newFilters[l.field];
  });

  const breadcrumbIndex = newBreadcrumbs.findIndex((b: DrilldownBreadcrumbItem) => b.level === level);
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
  state: HierarchicalDrilldownState,
  config: HierarchicalDrilldownConfig,
  targetLevel?: string
): HierarchicalDrilldownState {
  if (!targetLevel && state.breadcrumbs.length === 0) {
    return state; // Already at the top level
  }

  let newBreadcrumbs = [...state.breadcrumbs];
  let newFilters = { ...state.filters };

  if (targetLevel) {
    const targetIndex = newBreadcrumbs.findIndex((b: DrilldownBreadcrumbItem) => b.level === targetLevel);
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
    const lastLevelIndex = config.levels.findIndex((l: HierarchicalDrilldownLevel) => l.field === lastBreadcrumb.level);
    newCurrentLevel = config.levels[lastLevelIndex + 1]?.field || lastBreadcrumb.level;
  }

  // Remove filters for levels we've navigated away from
  const currentLevelIndex = config.levels.findIndex((l: HierarchicalDrilldownLevel) => l.field === newCurrentLevel);
  config.levels.slice(currentLevelIndex).forEach((l: HierarchicalDrilldownLevel) => {
    delete newFilters[l.field];
  });

  return {
    currentLevel: newCurrentLevel,
    filters: newFilters,
    breadcrumbs: newBreadcrumbs
  };
}

export function getCurrentLevelConfig(
  state: HierarchicalDrilldownState,
  config: HierarchicalDrilldownConfig
): HierarchicalDrilldownLevel | undefined {
  return config.levels.find((level: HierarchicalDrilldownLevel) => level.field === state.currentLevel);
}

export function getAvailableLevels(
  state: HierarchicalDrilldownState,
  config: HierarchicalDrilldownConfig
): HierarchicalDrilldownLevel[] {
  const currentIndex = config.levels.findIndex((l: HierarchicalDrilldownLevel) => l.field === state.currentLevel);
  return config.levels.slice(0, currentIndex + 1);
}

export function canDrillDown(
  state: HierarchicalDrilldownState,
  config: HierarchicalDrilldownConfig
): boolean {
  const currentIndex = config.levels.findIndex((l: HierarchicalDrilldownLevel) => l.field === state.currentLevel);
  return currentIndex < config.levels.length - 1;
}

export function canDrillUp(state: HierarchicalDrilldownState): boolean {
  return state.breadcrumbs.length > 0;
}

export function getDrilldownPath(state: HierarchicalDrilldownState): string {
  return state.breadcrumbs
    .map((b: DrilldownBreadcrumbItem) => b.label)
    .join(' > ');
}

export function buildDrilldownQuery(
  state: HierarchicalDrilldownState,
  baseQuery?: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...baseQuery,
    ...state.filters
  };
}

export function validateDrilldownConfig(config: HierarchicalDrilldownConfig): string[] {
  const errors: string[] = [];

  if (!config.levels || config.levels.length === 0) {
    errors.push('Drilldown configuration must have at least one level');
  }

  const fieldNames = new Set<string>();
  config.levels.forEach((level: HierarchicalDrilldownLevel, index: number) => {
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

export function resetDrilldownState(config: HierarchicalDrilldownConfig): HierarchicalDrilldownState {
  return createDrilldownState(config);
}
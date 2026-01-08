import { useState, useCallback } from 'react';

import { DrilldownLevel } from '../components/shared/DrilldownPanel';

export interface DrilldownData {
  id: string;
  type: string;
  label: string;
  data: any;
}

export function useMultiLevelDrilldown() {
  const [levels, setLevels] = useState<DrilldownLevel[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const push = useCallback((drilldownData: DrilldownData, component: React.ReactNode) => {
    setLevels(prev => [
      ...prev,
      {
        id: drilldownData.id,
        title: drilldownData.label,
        component,
        breadcrumb: drilldownData.label
      }
    ]);
    setIsOpen(true);
  }, []);

  const navigateToLevel = useCallback((levelIndex: number) => {
    setLevels(prev => prev.slice(0, levelIndex + 1));
  }, []);

  const pop = useCallback(() => {
    setLevels(prev => prev.slice(0, -1));
    if (levels.length <= 1) {
      setIsOpen(false);
    }
  }, [levels.length]);

  const close = useCallback(() => {
    setLevels([]);
    setIsOpen(false);
  }, []);

  const reset = useCallback(() => {
    setLevels([]);
    setIsOpen(false);
  }, []);

  return {
    levels,
    isOpen,
    push,
    pop,
    navigateToLevel,
    close,
    reset
  };
}

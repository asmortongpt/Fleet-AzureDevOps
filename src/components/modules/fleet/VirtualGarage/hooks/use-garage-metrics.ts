/**
 * useGarageMetrics - Custom hook for garage metrics calculation
 *
 * Calculates statistics and metrics for the garage dashboard.
 */

import { useMemo } from "react"

import type { DamageReport, Inspection } from "../utils/api"

import type { GarageAsset } from "./use-garage-filters"

export function useGarageMetrics(
  assets: GarageAsset[],
  filteredAssets: GarageAsset[],
  damageReports: DamageReport[],
  inspections: Inspection[]
) {
  return useMemo(() => {
    // Count 3D models ready
    const modelsReady = damageReports.filter(
      (r) => r.triposr_status === "completed"
    ).length

    return {
      totalAssets: assets.length,
      filteredCount: filteredAssets.length,
      damageReports: damageReports.length,
      inspections: inspections.length,
      modelsReady
    }
  }, [assets, filteredAssets, damageReports, inspections])
}

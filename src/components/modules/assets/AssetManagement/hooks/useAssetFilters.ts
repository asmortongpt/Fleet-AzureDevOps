import { useState, useMemo } from "react"

import { Asset } from "./useAssets"

export function useAssetFilters(assets: Asset[]) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filterType === "all" || asset.asset_type === filterType
      const matchesStatus = filterStatus === "all" || asset.status === filterStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [assets, searchTerm, filterType, filterStatus])

  const stats = useMemo(() => {
    const totalAssets = assets.length
    const activeAssets = assets.filter((a) => a.status === "active" || a.status === "in_use").length
    const maintenanceAssets = assets.filter((a) => a.status === "maintenance").length
    const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0)

    const assetsByType = assets.reduce(
      (acc, asset) => {
        acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const assetsByStatus = assets.reduce(
      (acc, asset) => {
        acc[asset.status] = (acc[asset.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalAssets,
      activeAssets,
      maintenanceAssets,
      totalValue,
      assetsByType,
      assetsByStatus
    }
  }, [assets])

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredAssets,
    stats
  }
}

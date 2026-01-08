/**
 * useGarageFilters - Custom hook for garage filtering logic
 *
 * Centralizes all filter state and logic for VirtualGarage module.
 */

import { useState, useMemo } from "react"

import { AssetCategory } from "@/types/asset.types"

export interface GarageAsset {
  id: string
  make: string
  model: string
  year: number
  asset_name?: string
  asset_tag?: string
  license_plate?: string
  asset_category?: AssetCategory
  [key: string]: any
}

export interface GarageFilters {
  searchTerm: string
  selectedCategory: AssetCategory | "ALL"
}

export function useGarageFilters(assets: GarageAsset[]) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | "ALL">("ALL")

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: assets.length }

    assets.forEach((asset) => {
      const category = asset.asset_category || "PASSENGER_VEHICLE"
      counts[category] = (counts[category] || 0) + 1
    })

    return counts
  }, [assets])

  // Filter assets based on search and category
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Category filter
      if (selectedCategory !== "ALL") {
        if (asset.asset_category !== selectedCategory) return false
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const assetName = asset.asset_name?.toLowerCase() || ""
        const make = asset.make.toLowerCase()
        const model = asset.model.toLowerCase()
        const tag = asset.asset_tag?.toLowerCase() || ""
        const plate = asset.license_plate?.toLowerCase() || ""

        return (
          assetName.includes(search) ||
          make.includes(search) ||
          model.includes(search) ||
          tag.includes(search) ||
          plate.includes(search)
        )
      }

      return true
    })
  }, [assets, searchTerm, selectedCategory])

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categoryCounts,
    filteredAssets
  }
}

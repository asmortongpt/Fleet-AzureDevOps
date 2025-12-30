import { useState, useEffect } from "react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api-client"
import logger from '@/utils/logger';

export interface Asset {
  id: string
  asset_tag: string
  asset_name: string
  asset_type: string
  category: string
  description?: string
  manufacturer?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  purchase_price?: number
  current_value?: number
  depreciation_rate?: number
  condition: "excellent" | "good" | "fair" | "poor" | "needs_repair"
  status: "active" | "in_use" | "maintenance" | "retired" | "disposed"
  location?: string
  assigned_to?: string
  assigned_to_name?: string
  warranty_expiration?: string
  last_maintenance?: string
  qr_code?: string
}

interface ApiResponse<T> {
  data?: T;
}

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const response: ApiResponse<Asset[]> = await apiClient.get("/api/assets")
      if (response?.data) {
        setAssets(response.data)
      }
    } catch (error) {
      logger.error("Failed to fetch assets:", error)
      toast.error("Failed to load assets")
    } finally {
      setLoading(false)
    }
  }

  const addAsset = async (asset: Partial<Asset>) => {
    try {
      const response: ApiResponse<Asset> = await apiClient.post("/api/assets", asset)
      if (response?.data) {
        setAssets((prev) => [...prev, response.data])
        toast.success("Asset added successfully")
        return response.data
      }
    } catch (error) {
      logger.error("Failed to add asset:", error)
      toast.error("Failed to add asset")
      throw error
    }
  }

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    try {
      const response: ApiResponse<Asset> = await apiClient.put(`/api/assets/${id}`, updates)
      if (response?.data) {
        setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))
        toast.success("Asset updated successfully")
        return response.data
      }
    } catch (error) {
      logger.error("Failed to update asset:", error)
      toast.error("Failed to update asset")
      throw error
    }
  }

  const deleteAsset = async (id: string) => {
    try {
      await apiClient.delete(`/api/assets/${id}`)
      setAssets((prev) => prev.filter((a) => a.id !== id))
      toast.success("Asset deleted successfully")
    } catch (error) {
      logger.error("Failed to delete asset:", error)
      toast.error("Failed to delete asset")
      throw error
    }
  }

  return {
    assets,
    loading,
    fetchAssets,
    addAsset,
    updateAsset,
    deleteAsset
  }
}
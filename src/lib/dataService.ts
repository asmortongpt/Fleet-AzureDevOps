import { Vehicle, Driver, WorkOrder, Part, Vendor, PurchaseOrder, Invoice } from "./types"

/**
 * Enterprise-grade data service with multi-tenant isolation,
 * pagination, filtering, and performance optimizations
 */

export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface FilterParams {
  [key: string]: any
}

export class DataService {
  private tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  /**
   * Generic paginated query with filtering and sorting
   */
  async query<T>(
    storageKey: string,
    pagination: PaginationParams,
    filters?: FilterParams
  ): Promise<PaginatedResult<T>> {
    // Simulate async data fetch
    await new Promise(resolve => setTimeout(resolve, 10))

    // Get data from storage (in production, this would be an API call)
    const allData = this.getFromStorage<T[]>(storageKey) || []
    
    // Filter by tenant
    const tenantData = allData.filter((item: any) => 
      !item.tenantId || item.tenantId === this.tenantId
    )

    // Apply filters
    let filteredData = tenantData
    if (filters) {
      filteredData = this.applyFilters(tenantData, filters)
    }

    // Apply sorting
    if (pagination.sortBy) {
      filteredData = this.applySorting(filteredData, pagination.sortBy, pagination.sortOrder)
    }

    // Calculate pagination
    const total = filteredData.length
    const totalPages = Math.ceil(total / pagination.pageSize)
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    const paginatedData = filteredData.slice(start, end)

    return {
      data: paginatedData,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages
    }
  }

  /**
   * Get single entity by ID
   */
  async getById<T extends { id: string; tenantId?: string }>(
    storageKey: string,
    id: string
  ): Promise<T | null> {
    const allData = this.getFromStorage<T[]>(storageKey) || []
    const item = allData.find(item => 
      item.id === id && (!item.tenantId || item.tenantId === this.tenantId)
    )
    return item || null
  }

  /**
   * Create new entity
   */
  async create<T extends { tenantId?: string }>(
    storageKey: string,
    data: T
  ): Promise<T> {
    const allData = this.getFromStorage<T[]>(storageKey) || []
    const newData = { ...data, tenantId: this.tenantId }
    allData.push(newData)
    this.saveToStorage(storageKey, allData)
    return newData
  }

  /**
   * Update existing entity
   */
  async update<T extends { id: string; tenantId?: string }>(
    storageKey: string,
    id: string,
    updates: Partial<T>
  ): Promise<T | null> {
    const allData = this.getFromStorage<T[]>(storageKey) || []
    const index = allData.findIndex(item => 
      item.id === id && (!item.tenantId || item.tenantId === this.tenantId)
    )
    
    if (index === -1) return null
    
    allData[index] = { ...allData[index], ...updates }
    this.saveToStorage(storageKey, allData)
    return allData[index]
  }

  /**
   * Delete entity
   */
  async delete<T extends { id: string; tenantId?: string }>(
    storageKey: string,
    id: string
  ): Promise<boolean> {
    const allData = this.getFromStorage<T[]>(storageKey) || []
    const filteredData = allData.filter(item => 
      !(item.id === id && (!item.tenantId || item.tenantId === this.tenantId))
    )
    
    if (filteredData.length === allData.length) return false
    
    this.saveToStorage(storageKey, filteredData)
    return true
  }

  /**
   * Bulk operations for performance
   */
  async bulkCreate<T extends { tenantId?: string }>(
    storageKey: string,
    items: T[]
  ): Promise<T[]> {
    const allData = this.getFromStorage<T[]>(storageKey) || []
    const newItems = items.map(item => ({ ...item, tenantId: this.tenantId }))
    allData.push(...newItems)
    this.saveToStorage(storageKey, allData)
    return newItems
  }

  /**
   * Search across multiple fields
   */
  async search<T>(
    storageKey: string,
    searchTerm: string,
    searchFields: (keyof T)[],
    pagination: PaginationParams
  ): Promise<PaginatedResult<T>> {
    const allData = this.getFromStorage<T[]>(storageKey) || []
    const tenantData = allData.filter((item: any) => 
      !item.tenantId || item.tenantId === this.tenantId
    )

    const searchLower = searchTerm.toLowerCase()
    const searchResults = tenantData.filter(item => {
      return searchFields.some(field => {
        const value = item[field]
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchLower)
        }
        return false
      })
    })

    const total = searchResults.length
    const totalPages = Math.ceil(total / pagination.pageSize)
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    const paginatedData = searchResults.slice(start, end)

    return {
      data: paginatedData,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages
    }
  }

  /**
   * Get aggregated statistics
   */
  async getStats<T>(
    storageKey: string,
    aggregations: { field: keyof T; operation: "count" | "sum" | "avg" | "min" | "max" }[]
  ): Promise<Record<string, number>> {
    const allData = this.getFromStorage<T[]>(storageKey) || []
    const tenantData = allData.filter((item: any) => 
      !item.tenantId || item.tenantId === this.tenantId
    )

    const stats: Record<string, number> = {}

    aggregations.forEach(agg => {
      const values = tenantData.map(item => item[agg.field]).filter(v => typeof v === "number") as number[]
      
      switch (agg.operation) {
        case "count":
          stats[String(agg.field)] = tenantData.length
          break
        case "sum":
          stats[String(agg.field)] = values.reduce((a, b) => a + b, 0)
          break
        case "avg":
          stats[String(agg.field)] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
          break
        case "min":
          stats[String(agg.field)] = values.length > 0 ? Math.min(...values) : 0
          break
        case "max":
          stats[String(agg.field)] = values.length > 0 ? Math.max(...values) : 0
          break
      }
    })

    return stats
  }

  private applyFilters<T>(data: T[], filters: FilterParams): T[] {
    return (data || []).filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        const itemValue = (item as any)[key]
        
        // Handle array filters
        if (Array.isArray(value)) {
          return value.includes(itemValue)
        }
        
        // Handle object filters (e.g., range queries)
        if (typeof value === "object" && value !== null) {
          if ("min" in value && itemValue < value.min) return false
          if ("max" in value && itemValue > value.max) return false
          return true
        }
        
        // Exact match
        return itemValue === value
      })
    })
  }

  private applySorting<T>(data: T[], sortBy: string, sortOrder: "asc" | "desc" = "asc"): T[] {
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortBy]
      const bVal = (b as any)[sortBy]
      
      if (aVal === bVal) return 0
      
      const comparison = aVal < bVal ? -1 : 1
      return sortOrder === "asc" ? comparison : -comparison
    })
  }

  private getFromStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  private saveToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error("Failed to save to storage:", error)
    }
  }
}

/**
 * Create a data service instance for a specific tenant
 */
export function createDataService(tenantId: string): DataService {
  return new DataService(tenantId)
}

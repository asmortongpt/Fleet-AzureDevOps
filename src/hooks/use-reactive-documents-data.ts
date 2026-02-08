/**
 * useReactiveDocumentsData - Real-time documents data with React Query
 * Auto-refreshes every 10 seconds for live document management dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface Document {
  id: string
  title: string
  description?: string
  filename: string
  originalFilename: string
  mimeType: string
  fileSize: number
  category: string
  subcategory?: string
  tags: string[]
  status: string
  accessLevel: string
  ownerName: string
  createdAt: string
  updatedAt: string
  downloadCount: number
  aiGeneratedSummary?: string
}

interface DocumentCategory {
  category: string
  count: number
  totalSize: number
  lastUpdated: string
}

export function useReactiveDocumentsData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch all documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['documents', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/documents/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagination: { page: 1, limit: 1000 },
          sort: { field: 'updatedAt', order: 'desc' },
        }),
      })
      if (!response.ok) throw new Error('Failed to fetch documents')
      const result = await response.json()
      return result.data?.documents || []
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch document analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['document-analytics', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/documents/analytics`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const result = await response.json()
      return result.data?.analytics || null
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })

  // Calculate document metrics
  const metrics = {
    totalDocuments: documents.length,
    totalStorage: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
    recentUploads: documents.filter((doc) => {
      const uploadDate = new Date(doc.createdAt)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return uploadDate >= sevenDaysAgo
    }).length,
    pendingApprovals: documents.filter((doc) => doc.status === 'pending-review').length,
    publishedDocuments: documents.filter((doc) => doc.status === 'published').length,
    archivedDocuments: documents.filter((doc) => doc.status === 'archived').length,
    avgDownloads: documents.length > 0
      ? Math.round(documents.reduce((sum, doc) => sum + doc.downloadCount, 0) / documents.length)
      : 0,
  }

  // Document status distribution
  const statusDistribution = documents.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Documents by category
  const categoryDistribution = documents.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Documents by access level
  const accessLevelDistribution = documents.reduce((acc, doc) => {
    acc[doc.accessLevel] = (acc[doc.accessLevel] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // File type distribution
  const fileTypeDistribution = documents.reduce((acc, doc) => {
    const type = doc.mimeType.split('/')[0] || 'other'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Upload trend data (by month)
  const uploadTrendData = (() => {
    const monthlyData: Record<string, { uploads: number, size: number }> = {}
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    documents.forEach((doc) => {
      const date = new Date(doc.createdAt)
      const monthName = months[date.getMonth()]
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = { uploads: 0, size: 0 }
      }
      monthlyData[monthName].uploads += 1
      monthlyData[monthName].size += doc.fileSize
    })

    return months.map((month) => ({
      name: month,
      uploads: monthlyData[month]?.uploads || 0,
      size: Math.round((monthlyData[month]?.size || 0) / (1024 * 1024)), // Convert to MB
    }))
  })()

  // Top downloaded documents
  const topDownloadedDocuments = [...documents]
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, 10)

  // Recent documents (last 7 days)
  const recentDocuments = documents
    .filter((doc) => {
      const uploadDate = new Date(doc.createdAt)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return uploadDate >= sevenDaysAgo
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  // Category details
  const categoryDetails: DocumentCategory[] = Object.entries(categoryDistribution).map(([category, count]) => {
    const categoryDocs = documents.filter((doc) => doc.category === category)
    const totalSize = categoryDocs.reduce((sum, doc) => sum + doc.fileSize, 0)
    const lastUpdated = categoryDocs.reduce((latest, doc) => {
      const docDate = new Date(doc.updatedAt).getTime()
      return docDate > latest ? docDate : latest
    }, 0)

    return {
      category,
      count,
      totalSize,
      lastUpdated: new Date(lastUpdated).toISOString(),
    }
  }).sort((a, b) => b.count - a.count)

  // Storage by category
  const storageByCategoryData = categoryDetails.map((cat) => ({
    name: cat.category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: Math.round(cat.totalSize / (1024 * 1024)), // Convert to MB
    count: cat.count,
  }))

  return {
    documents,
    analytics,
    metrics,
    statusDistribution,
    categoryDistribution,
    accessLevelDistribution,
    fileTypeDistribution,
    uploadTrendData,
    topDownloadedDocuments,
    recentDocuments,
    categoryDetails,
    storageByCategoryData,
    isLoading: documentsLoading || analyticsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}

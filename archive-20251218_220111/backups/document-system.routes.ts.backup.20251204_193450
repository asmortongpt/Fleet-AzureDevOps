/**
 * Document System - Master Route Registry
 * Registers all document-related routes in the Express app
 */

import { Express } from 'express'
import { documentSystemConfig } from '../config/document-system.config'

// Import all document-related routes
import ocrRoutes from './ocr.routes'
import aiSearchRoutes from './ai-search'
import aiChatRoutes from './ai-chat'
import documentGeoRoutes from './document-geo.routes'
import searchRoutes from './search'
import storageAdminRoutes from './storage-admin'

/**
 * Register all document system routes
 * @param app Express application
 */
export function registerDocumentSystemRoutes(app: Express): void {
  console.log('📄 Registering Document System routes...')

  // OCR Routes (if enabled)
  if (documentSystemConfig.features.enableOCR) {
    app.use('/api/ocr', ocrRoutes)
    console.log('   ✓ OCR routes registered at /api/ocr')
  }

  // AI Search Routes (if enabled)
  if (documentSystemConfig.features.enableAI && documentSystemConfig.features.enableRAG) {
    app.use('/api/ai-search', aiSearchRoutes)
    console.log('   ✓ AI Search routes registered at /api/ai-search')
  }

  // AI Chat Routes (if enabled)
  if (documentSystemConfig.features.enableAI) {
    app.use('/api/ai-chat', aiChatRoutes)
    console.log('   ✓ AI Chat routes registered at /api/ai-chat')
  }

  // Geospatial Document Routes (if enabled)
  if (documentSystemConfig.features.enableGeospatial) {
    app.use('/api/documents/geo', documentGeoRoutes)
    console.log('   ✓ Document Geo routes registered at /api/documents/geo')
  }

  // Advanced Search Routes
  app.use('/api/search', searchRoutes)
  console.log('   ✓ Search routes registered at /api/search')

  // Storage Admin Routes (if external storage enabled)
  if (documentSystemConfig.features.enableExternalStorage) {
    app.use('/api/storage', storageAdminRoutes)
    console.log('   ✓ Storage Admin routes registered at /api/storage')
  }

  console.log('📄 Document System routes registered successfully')
}

/**
 * Get route registry information
 */
export function getDocumentSystemRoutes() {
  const routes = []

  if (documentSystemConfig.features.enableOCR) {
    routes.push({
      path: '/api/ocr',
      description: 'OCR processing and management',
      endpoints: 12
    })
  }

  if (documentSystemConfig.features.enableAI && documentSystemConfig.features.enableRAG) {
    routes.push({
      path: '/api/ai-search',
      description: 'AI-powered semantic search',
      endpoints: 8
    })
  }

  if (documentSystemConfig.features.enableAI) {
    routes.push({
      path: '/api/ai-chat',
      description: 'Document Q&A chat interface',
      endpoints: 6
    })
  }

  if (documentSystemConfig.features.enableGeospatial) {
    routes.push({
      path: '/api/documents/geo',
      description: 'Geospatial document features',
      endpoints: 10
    })
  }

  routes.push({
    path: '/api/search',
    description: 'Advanced document search',
    endpoints: 16
  })

  if (documentSystemConfig.features.enableExternalStorage) {
    routes.push({
      path: '/api/storage',
      description: 'Storage management and admin',
      endpoints: 12
    })
  }

  return routes
}

import { Express } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import { documentSystemConfig } from '../config/document-system.config';
import ocrRoutes from './ocr.routes';
import aiSearchRoutes from './ai-search.routes';
import aiChatRoutes from './ai-chat.routes';
import documentGeoRoutes from './document-geo.routes';
import searchRoutes from './search.routes';
import storageAdminRoutes from './storage-admin.routes';

export function registerDocumentSystemRoutes(app: Express): void {
  console.log('📄 Registering Document System routes...');

  // Security enhancements
  app.use(helmet());
  app.use(rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  }));
  app.use(csurf());

  // OCR Routes (if enabled)
  if (documentSystemConfig.features.enableOCR) {
    app.use('/api/ocr', ocrRoutes);
    console.log('   ✓ OCR routes registered at /api/ocr');
  }

  // AI Search Routes (if enabled)
  if (documentSystemConfig.features.enableAI && documentSystemConfig.features.enableRAG) {
    app.use('/api/ai-search', aiSearchRoutes);
    console.log('   ✓ AI Search routes registered at /api/ai-search');
  }

  // AI Chat Routes (if enabled)
  if (documentSystemConfig.features.enableAI) {
    app.use('/api/ai-chat', aiChatRoutes);
    console.log('   ✓ AI Chat routes registered at /api/ai-chat');
  }

  // Geospatial Document Routes (if enabled)
  if (documentSystemConfig.features.enableGeospatial) {
    app.use('/api/documents/geo', documentGeoRoutes);
    console.log('   ✓ Document Geo routes registered at /api/documents/geo');
  }

  // Advanced Search Routes
  app.use('/api/search', searchRoutes);
  console.log('   ✓ Search routes registered at /api/search');

  // Storage Admin Routes (if external storage enabled)
  if (documentSystemConfig.features.enableExternalStorage) {
    app.use('/api/storage', storageAdminRoutes);
    console.log('   ✓ Storage Admin routes registered at /api/storage');
  }

  console.log('📄 Document System routes registered successfully');
}

export function getDocumentSystemRoutes() {
  const routes = [];

  if (documentSystemConfig.features.enableOCR) {
    routes.push({
      path: '/api/ocr',
      description: 'OCR processing and management',
      endpoints: 12,
    });
  }

  if (documentSystemConfig.features.enableAI && documentSystemConfig.features.enableRAG) {
    routes.push({
      path: '/api/ai-search',
      description: 'AI-powered semantic search',
      endpoints: 8,
    });
  }

  if (documentSystemConfig.features.enableAI) {
    routes.push({
      path: '/api/ai-chat',
      description: 'Document Q&A chat interface',
      endpoints: 6,
    });
  }

  if (documentSystemConfig.features.enableGeospatial) {
    routes.push({
      path: '/api/documents/geo',
      description: 'Geospatial document features',
      endpoints: 10,
    });
  }

  routes.push({
    path: '/api/search',
    description: 'Advanced document search',
    endpoints: 16,
  });

  if (documentSystemConfig.features.enableExternalStorage) {
    routes.push({
      path: '/api/storage',
      description: 'Storage management and administration',
      endpoints: 4,
    });
  }

  return routes;
}
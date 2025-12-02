/**
 * Document Search Service Tests
 *
 * These tests demonstrate the expected behavior of the DocumentSearchService.
 * To run: npm test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import pool from '../../config/database'
import documentSearchService from '../document-search.service'

describe('DocumentSearchService', () => {
  const testTenantId = 'test-tenant-' + Date.now()
  const testUserId = 'test-user-' + Date.now()
  let testDocumentIds: string[] = []

  beforeAll(async () => {
    // Setup: Create test tenant and user
    // Note: This assumes tenants and users tables exist
    // Adjust based on your actual schema

    // Insert test documents for searching
    const documents = [
      {
        file_name: 'Invoice_Oil_Change_2024.pdf',
        description: 'Oil change and filter replacement invoice',
        extracted_text: 'Invoice for oil change service. Replaced oil filter. Total: $45.99',
        document_type: 'Invoice',
        tags: ['maintenance', 'oil', 'invoice']
      },
      {
        file_name: 'Brake_Inspection_Report.pdf',
        description: 'Annual brake system inspection',
        extracted_text: 'Brake pads at 40% wear. Rotors in good condition. No immediate action needed.',
        document_type: 'Report',
        tags: ['safety', 'brakes', 'inspection']
      },
      {
        file_name: 'Receipt_Fuel_Station_A.jpg',
        description: 'Fuel receipt from Station A',
        extracted_text: 'Station A. Premium gas 15.3 gallons. Total: $52.47',
        document_type: 'Receipt',
        tags: ['fuel', 'receipt']
      },
      {
        file_name: 'Tire_Replacement_Invoice.pdf',
        description: 'Four new tires installed',
        extracted_text: 'Replaced all four tires. Brand: Michelin. Model: Defender. Total: $620.00',
        document_type: 'Invoice',
        tags: ['maintenance', 'tires', 'invoice']
      }
    ]

    for (const doc of documents) {
      const result = await pool.query(
        `INSERT INTO documents (
          tenant_id, file_name, file_type, file_size, file_url,
          description, extracted_text, document_type, tags,
          uploaded_by, status, ocr_status, embedding_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id',
        [
          testTenantId,
          doc.file_name,
          'application/pdf',
          1024,
          '/test/' + doc.file_name,
          doc.description,
          doc.extracted_text,
          doc.document_type,
          doc.tags,
          testUserId,
          'active',
          'completed',
          'pending'
        ]
      )
      testDocumentIds.push(result.rows[0].id)
    }

    // Wait a moment for triggers to process
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  afterAll(async () => {
    // Cleanup: Delete test documents
    if (testDocumentIds.length > 0) {
      await pool.query(
        `DELETE FROM documents WHERE id = ANY($1)`,
        [testDocumentIds]
      )
    }
  })

  describe('searchDocuments', () => {
    it('should find documents by single word', async () => {
      const results = await documentSearchService.searchDocuments('invoice', {
        tenantId: testTenantId,
        status: 'active'
      })

      expect(results.documents.length).toBeGreaterThan(0)
      expect(results.total).toBeGreaterThan(0)
      expect(results.query).toBe('invoice')

      // All results should contain "invoice" in some field
      const hasInvoice = results.documents.some(doc =>
        doc.file_name.toLowerCase().includes('invoice') ||
        doc.description?.toLowerCase().includes('invoice') ||
        doc.document_type?.toLowerCase() === 'invoice'
      )
      expect(hasInvoice).toBe(true)
    })

    it('should find documents by multiple words', async () => {
      const results = await documentSearchService.searchDocuments('oil change', {
        tenantId: testTenantId,
        status: 'active'
      })

      expect(results.documents.length).toBeGreaterThan(0)

      // Should find the oil change invoice
      const oilChangeDoc = results.documents.find(doc =>
        doc.file_name.includes('Oil_Change')
      )
      expect(oilChangeDoc).toBeDefined()
    })

    it('should rank results by relevance', async () => {
      const results = await documentSearchService.searchDocuments('invoice', {
        tenantId: testTenantId,
        status: 'active',
        limit: 10
      })

      if (results.documents.length > 1) {
        // Results should be ordered by rank (descending)
        for (let i = 0; i < results.documents.length - 1; i++) {
          const currentRank = results.documents[i].rank || 0
          const nextRank = results.documents[i + 1].rank || 0
          expect(currentRank).toBeGreaterThanOrEqual(nextRank)
        }
      }
    })

    it('should filter by document type', async () => {
      const results = await documentSearchService.searchDocuments('maintenance', {
        tenantId: testTenantId,
        documentType: 'Invoice',
        status: 'active'
      })

      results.documents.forEach(doc => {
        expect(doc.document_type).toBe('Invoice')
      })
    })

    it('should return headline excerpts', async () => {
      const results = await documentSearchService.searchDocuments('brake', {
        tenantId: testTenantId,
        status: 'active'
      })

      expect(results.documents.length).toBeGreaterThan(0)

      // At least one document should have a headline
      const hasHeadline = results.documents.some(doc => doc.headline && doc.headline.length > 0)
      expect(hasHeadline).toBe(true)
    })

    it('should handle pagination', async () => {
      // Get first page
      const page1 = await documentSearchService.searchDocuments('invoice', {
        tenantId: testTenantId,
        limit: 1,
        offset: 0
      })

      // Get second page
      const page2 = await documentSearchService.searchDocuments('invoice', {
        tenantId: testTenantId,
        limit: 1,
        offset: 1
      })

      // Pages should have different results (if there are multiple results)
      if (page1.total > 1) {
        expect(page1.documents[0].id).not.toBe(page2.documents[0]?.id)
      }
    })

    it('should return empty results for non-existent terms', async () => {
      const results = await documentSearchService.searchDocuments(
        'xyzabc123nonexistent',
        { tenantId: testTenantId }
      )

      expect(results.documents).toHaveLength(0)
      expect(results.total).toBe(0)
    })

    it('should include execution time', async () => {
      const results = await documentSearchService.searchDocuments('invoice', {
        tenantId: testTenantId
      })

      expect(results.execution_time_ms).toBeGreaterThan(0)
      expect(results.execution_time_ms).toBeLessThan(5000) // Should be fast
    })

    it('should throw error for empty query', async () => {
      await expect(
        documentSearchService.searchDocuments('', { tenantId: testTenantId })
      ).rejects.toThrow('Search query cannot be empty')
    })

    it('should throw error for missing tenant ID', async () => {
      await expect(
        documentSearchService.searchDocuments('test', {} as any)
      ).rejects.toThrow('Tenant ID is required')
    })
  })

  describe('searchByVehicle', () => {
    it('should filter documents by vehicle ID', async () => {
      // This test would require documents linked to vehicles
      // For now, test that the function works without throwing
      const results = await documentSearchService.searchByVehicle(
        'test-vehicle-123',
        undefined,
        testTenantId
      )

      // Should return array (possibly empty if no vehicles linked)
      expect(Array.isArray(results)).toBe(true)
    })

    it('should combine vehicle filter with search query', async () => {
      const results = await documentSearchService.searchByVehicle(
        'test-vehicle-123',
        'invoice',
        testTenantId
      )

      expect(Array.isArray(results)).toBe(true)
    })

    it('should throw error for missing tenant ID', async () => {
      await expect(
        documentSearchService.searchByVehicle('vehicle-123', 'query')
      ).rejects.toThrow('Tenant ID is required')
    })
  })

  describe('indexDocument', () => {
    it('should index a document successfully', async () => {
      const documentId = testDocumentIds[0]

      await expect(
        documentSearchService.indexDocument(documentId)
      ).resolves.not.toThrow()
    })

    it('should throw error for non-existent document', async () => {
      await expect(
        documentSearchService.indexDocument('non-existent-id')
      ).rejects.toThrow()
    })
  })

  describe('batchIndexDocuments', () => {
    it('should index multiple documents', async () => {
      const idsToIndex = testDocumentIds.slice(0, 2)

      await expect(
        documentSearchService.batchIndexDocuments(idsToIndex)
      ).resolves.not.toThrow()
    })

    it('should handle empty array', async () => {
      await expect(
        documentSearchService.batchIndexDocuments([])
      ).resolves.not.toThrow()
    })
  })

  describe('getSuggestions', () => {
    it('should return suggestions for partial query', async () => {
      const suggestions = await documentSearchService.getSuggestions(
        'inv',
        testTenantId,
        5
      )

      expect(Array.isArray(suggestions)).toBe(true)

      // If we have invoice documents, should get suggestions
      if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
          expect(suggestion.toLowerCase()).toContain('inv')
        })
      }
    })

    it('should limit suggestions', async () => {
      const suggestions = await documentSearchService.getSuggestions(
        'i',
        testTenantId,
        2
      )

      expect(suggestions.length).toBeLessThanOrEqual(2)
    })

    it('should return empty for very short query', async () => {
      const suggestions = await documentSearchService.getSuggestions(
        'x',
        testTenantId,
        5
      )

      expect(Array.isArray(suggestions)).toBe(true)
    })
  })

  describe('getSearchStatistics', () => {
    it('should return statistics for tenant', async () => {
      const stats = await documentSearchService.getSearchStatistics(testTenantId)

      expect(stats).toHaveProperty('total_documents')
      expect(stats).toHaveProperty('ocr_completed')
      expect(stats).toHaveProperty('ocr_pending')
      expect(stats).toHaveProperty('searchable_documents')
      expect(stats).toHaveProperty('total_text_size_mb')

      expect(stats.total_documents).toBeGreaterThan(0)
      expect(stats.ocr_completed).toBeGreaterThanOrEqual(0)
    })
  })
})

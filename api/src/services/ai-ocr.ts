/**
 * Enhanced OCR and Document Analysis Service
 *
 * Provides intelligent document processing with:
 * - Multi-format support (receipts, invoices, inspections, licenses)
 * - Auto-detection of document type
 * - Confidence scoring
 * - Entity matching to database
 * - Batch processing capabilities
 */

import OpenAI from 'openai'
import pool from '../config/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export type DocumentType =
  | 'fuel_receipt'
  | 'parts_invoice'
  | 'service_invoice'
  | 'inspection_report'
  | 'driver_license'
  | 'vehicle_registration'
  | 'insurance_document'
  | 'bill_of_lading'
  | 'unknown'

export interface DocumentAnalysis {
  documentType: DocumentType
  confidence: number
  extractedData: Record<string, {
    value: any
    confidence: number
    needsReview: boolean
    alternatives?: any[]
  }>
  suggestedMatches: {
    vehicle?: { id: string; name: string; confidence: number }
    vendor?: { id: string; name: string; confidence: number }
    driver?: { id: string; name: string; confidence: number }
  }
  validationIssues: string[]
  rawOcrText?: string
}

/**
 * Document type-specific extraction schemas
 */
const EXTRACTION_SCHEMAS = {
  fuel_receipt: {
    fields: [
      'date',
      'vendor_name',
      'location',
      'total_cost',
      'gallons',
      'price_per_gallon',
      'fuel_type',
      'vehicle_identifier',
      'odometer',
      'pump_number',
      'receipt_number'
    ],
    required: ['date', 'total_cost', 'gallons']
  },
  parts_invoice: {
    fields: [
      'invoice_number',
      'date',
      'vendor_name',
      'line_items',
      'subtotal',
      'tax',
      'total',
      'vehicle_identifier',
      'po_number'
    ],
    required: ['invoice_number', 'date', 'total']
  },
  service_invoice: {
    fields: [
      'invoice_number',
      'date',
      'vendor_name',
      'services_performed',
      'labor_cost',
      'parts_cost',
      'total',
      'vehicle_identifier',
      'technician_name'
    ],
    required: ['invoice_number', 'date', 'total']
  },
  inspection_report: {
    fields: [
      'inspection_date',
      'inspector_name',
      'vehicle_identifier',
      'inspection_type',
      'passed',
      'issues_found',
      'next_inspection_date',
      'signature'
    ],
    required: ['inspection_date', 'vehicle_identifier', 'passed']
  },
  driver_license: {
    fields: [
      'license_number',
      'first_name',
      'last_name',
      'date_of_birth',
      'issue_date',
      'expiration_date',
      'class',
      'endorsements',
      'restrictions',
      'address'
    ],
    required: ['license_number', 'first_name', 'last_name', 'expiration_date']
  },
  vehicle_registration: {
    fields: [
      'registration_number',
      'vin',
      'license_plate',
      'make',
      'model',
      'year',
      'owner_name',
      'issue_date',
      'expiration_date'
    ],
    required: ['license_plate', 'vin', 'expiration_date']
  }
}

/**
 * Detect document type from image
 */
async function detectDocumentType(imageUrl: string): Promise<{ type: DocumentType; confidence: number }> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this document image and identify its type.
Possible types: fuel_receipt, parts_invoice, service_invoice, inspection_report, driver_license, vehicle_registration, insurance_document, bill_of_lading, unknown.

Return ONLY a JSON object with:
{
  "type": "document_type",
  "confidence": 0.0-1.0
}

Be very confident (>0.9) only if you're certain.`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          }
        ]
      }
    ],
    max_tokens: 100,
    temperature: 0.1
  })

  try {
    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return {
      type: result.type || 'unknown',
      confidence: result.confidence || 0.0
    }
  } catch {
    return { type: 'unknown', confidence: 0.0 }
  }
}

/**
 * Extract data from document based on type
 */
async function extractDocumentData(
  imageUrl: string,
  documentType: DocumentType
): Promise<{
  extractedData: Record<string, any>
  confidenceScores: Record<string, number>
  rawText: string
}> {
  const schema = EXTRACTION_SCHEMAS[documentType as keyof typeof EXTRACTION_SCHEMAS]

  if (!schema) {
    return {
      extractedData: {},
      confidenceScores: {},
      rawText: ''
    }
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract all available information from this ${documentType.replace('_', ' ')}.

Fields to extract: ${schema.fields.join(', ')}

Return as JSON with this structure:
{
  "extractedData": {
    "field_name": value,
    ...
  },
  "confidenceScores": {
    "field_name": 0.0-1.0,
    ...
  },
  "rawText": "all visible text on document"
}

Rules:
- Extract ALL fields you can see, not just required ones
- For dates, use ISO format (YYYY-MM-DD)
- For currency, return numeric values only (no $ signs)
- For line_items and services_performed, return as arrays of objects
- Only include fields where confidence > 0.5
- Be accurate with numbers - fuel receipts especially
- Extract vehicle identifiers (plate, fleet #, VIN) carefully`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          }
        ]
      }
    ],
    max_tokens: 1500,
    temperature: 0.1
  })

  try {
    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return {
      extractedData: result.extractedData || {},
      confidenceScores: result.confidenceScores || {},
      rawText: result.rawText || ''
    }
  } catch (error) {
    console.error('Failed to parse OCR result:', error)
    return {
      extractedData: {},
      confidenceScores: {},
      rawText: ''
    }
  }
}

/**
 * Match extracted entities to database records
 */
async function matchEntitiesToDatabase(
  extractedData: Record<string, any>,
  tenantId: string
): Promise<DocumentAnalysis['suggestedMatches']> {
  const matches: DocumentAnalysis['suggestedMatches'] = {}

  // Match vehicle by identifier (fleet number, license plate, VIN)
  if (extractedData.vehicle_identifier) {
    const identifier = extractedData.vehicle_identifier.toString().toUpperCase()

    const vehicleResult = await pool.query(
      `SELECT id, fleet_number, license_plate, make, model, vin
       FROM vehicles
       WHERE tenant_id = $1
         AND (
           UPPER(fleet_number) = $2
           OR UPPER(license_plate) = $2
           OR UPPER(vin) = $2
         )
       LIMIT 1`,
      [tenantId, identifier]
    )

    if (vehicleResult.rows.length > 0) {
      const vehicle = vehicleResult.rows[0]
      matches.vehicle = {
        id: vehicle.id,
        name: `${vehicle.make} ${vehicle.model} (${vehicle.fleet_number || vehicle.license_plate})`,
        confidence: 0.95
      }
    } else {
      // Try fuzzy matching
      const fuzzyResult = await pool.query(
        `SELECT id, fleet_number, license_plate, make, model,
                SIMILARITY(UPPER(fleet_number), $2) as sim1,
                SIMILARITY(UPPER(license_plate), $2) as sim2
         FROM vehicles
         WHERE tenant_id = $1
         ORDER BY GREATEST(
           SIMILARITY(UPPER(fleet_number), $2),
           SIMILARITY(UPPER(license_plate), $2)
         ) DESC
         LIMIT 1`,
        [tenantId, identifier]
      )

      if (fuzzyResult.rows.length > 0) {
        const vehicle = fuzzyResult.rows[0]
        const maxSim = Math.max(vehicle.sim1 || 0, vehicle.sim2 || 0)

        if (maxSim > 0.6) {
          matches.vehicle = {
            id: vehicle.id,
            name: `${vehicle.make} ${vehicle.model} (${vehicle.fleet_number || vehicle.license_plate})`,
            confidence: maxSim
          }
        }
      }
    }
  }

  // Match vendor by name
  if (extractedData.vendor_name) {
    const vendorResult = await pool.query(
      `SELECT id, name,
              SIMILARITY(UPPER(name), UPPER($2)) as similarity
       FROM vendors
       WHERE tenant_id = $1
       ORDER BY similarity DESC
       LIMIT 1`,
      [tenantId, extractedData.vendor_name]
    )

    if (vendorResult.rows.length > 0 && vendorResult.rows[0].similarity > 0.6) {
      matches.vendor = {
        id: vendorResult.rows[0].id,
        name: vendorResult.rows[0].name,
        confidence: vendorResult.rows[0].similarity
      }
    }
  }

  // Match driver by name (for licenses, inspection reports)
  if (extractedData.first_name && extractedData.last_name) {
    const driverResult = await pool.query(
      `SELECT id, first_name, last_name,
              (SIMILARITY(UPPER(first_name), UPPER($2)) + SIMILARITY(UPPER(last_name), UPPER($3))) / 2 as similarity
       FROM drivers
       WHERE tenant_id = $1
       ORDER BY similarity DESC
       LIMIT 1`,
      [tenantId, extractedData.first_name, extractedData.last_name]
    )

    if (driverResult.rows.length > 0 && driverResult.rows[0].similarity > 0.7) {
      matches.driver = {
        id: driverResult.rows[0].id,
        name: `${driverResult.rows[0].first_name} ${driverResult.rows[0].last_name}`,
        confidence: driverResult.rows[0].similarity
      }
    }
  }

  return matches
}

/**
 * Validate extracted data
 */
function validateExtractedData(
  extractedData: Record<string, any>,
  confidenceScores: Record<string, number>,
  documentType: DocumentType
): string[] {
  const issues: string[] = []
  const schema = EXTRACTION_SCHEMAS[documentType as keyof typeof EXTRACTION_SCHEMAS]

  if (!schema) return issues

  // Check required fields
  for (const field of schema.required) {
    if (!extractedData[field] || extractedData[field] === '') {
      issues.push(`Missing required field: ${field}`)
    } else if (confidenceScores[field] < 0.7) {
      issues.push(`Low confidence (${(confidenceScores[field] * 100).toFixed(0)}%) for required field: ${field}`)
    }
  }

  // Data sanity checks
  if (documentType === 'fuel_receipt') {
    if (extractedData.price_per_gallon && (extractedData.price_per_gallon < 1 || extractedData.price_per_gallon > 20)) {
      issues.push(`Unusual price per gallon: $${extractedData.price_per_gallon}`)
    }

    if (extractedData.gallons && (extractedData.gallons < 1 || extractedData.gallons > 200)) {
      issues.push(`Unusual gallons amount: ${extractedData.gallons}`)
    }

    if (extractedData.total_cost && extractedData.gallons && extractedData.price_per_gallon) {
      const calculatedTotal = extractedData.gallons * extractedData.price_per_gallon
      const diff = Math.abs(calculatedTotal - extractedData.total_cost)

      if (diff > 2) {
        issues.push(`Math doesn't match: ${extractedData.gallons} gal × $${extractedData.price_per_gallon}/gal ≠ $${extractedData.total_cost}`)
      }
    }
  }

  // Date validation
  if (extractedData.date) {
    const date = new Date(extractedData.date)
    const now = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(now.getFullYear() - 1)

    if (date > now) {
      issues.push('Date is in the future')
    } else if (date < oneYearAgo) {
      issues.push('Date is more than 1 year ago')
    }
  }

  return issues
}

/**
 * Main document analysis function
 */
export async function analyzeDocument(
  imageUrl: string,
  tenantId: string,
  userId: string,
  documentType?: DocumentType
): Promise<DocumentAnalysis> {
  try {
    // Auto-detect document type if not provided
    let detectedType = documentType
    let typeConfidence = 1.0

    if (!detectedType) {
      const detection = await detectDocumentType(imageUrl)
      detectedType = detection.type
      typeConfidence = detection.confidence
    }

    // Extract data from document
    const { extractedData, confidenceScores, rawText } = await extractDocumentData(imageUrl, detectedType)

    // Match entities to database
    const suggestedMatches = await matchEntitiesToDatabase(extractedData, tenantId)

    // Validate extracted data
    const validationIssues = validateExtractedData(extractedData, confidenceScores, detectedType)

    // Format extracted data with confidence and review flags
    const formattedData: DocumentAnalysis['extractedData'] = {}

    for (const [field, value] of Object.entries(extractedData)) {
      formattedData[field] = {
        value,
        confidence: confidenceScores[field] || 0.5,
        needsReview: (confidenceScores[field] || 0.5) < 0.8
      }
    }

    const analysis: DocumentAnalysis = {
      documentType: detectedType,
      confidence: typeConfidence,
      extractedData: formattedData,
      suggestedMatches,
      validationIssues,
      rawOcrText: rawText
    }

    // Save to database
    const needsReview = validationIssues.length > 0 ||
      Object.values(confidenceScores).some(c => c < 0.8)

    await pool.query(
      `INSERT INTO document_analyses
       (tenant_id, user_id, document_url, document_type, extracted_data,
        confidence_scores, suggested_matches, validation_issues, needs_review)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tenantId,
        userId,
        imageUrl,
        detectedType,
        JSON.stringify(extractedData),
        JSON.stringify(confidenceScores),
        JSON.stringify(suggestedMatches),
        JSON.stringify(validationIssues),
        needsReview
      ]
    )

    return analysis
  } catch (error) {
    console.error('Document analysis error:', error)
    throw error
  }
}

/**
 * Batch process multiple documents
 */
export async function batchAnalyzeDocuments(
  imageUrls: string[],
  tenantId: string,
  userId: string
): Promise<DocumentAnalysis[]> {
  const results: DocumentAnalysis[] = []

  // Process in parallel (limit concurrency to avoid rate limits)
  const batchSize = 3
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(url => analyzeDocument(url, tenantId, userId))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Get documents that need review
 */
export async function getDocumentsNeedingReview(
  tenantId: string,
  limit: number = 20
): Promise<any[]> {
  const result = await pool.query(
    `SELECT * FROM document_analyses
     WHERE tenant_id = $1 AND needs_review = true AND reviewed = false
     ORDER BY created_at DESC
     LIMIT $2`,
    [tenantId, limit]
  )

  return result.rows
}

/**
 * Mark document as reviewed
 */
export async function markDocumentReviewed(
  documentId: string,
  reviewedBy: string,
  corrections?: Record<string, any>
): Promise<void> {
  await pool.query(
    `UPDATE document_analyses
     SET reviewed = true,
         reviewed_by = $2,
         reviewed_at = CURRENT_TIMESTAMP,
         extracted_data = COALESCE($3, extracted_data)
     WHERE id = $1`,
    [documentId, reviewedBy, corrections ? JSON.stringify(corrections) : null]
  )
}

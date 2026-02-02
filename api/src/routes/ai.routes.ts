/**
 * AI Utility Routes
 *
 * Lightweight endpoints to support UI integrations that expect:
 * - /api/ai/query (semantic search)
 * - /api/ai/assistant (single-turn assistant)
 * - /api/ai/receipt and /api/ai/receipt/extract (receipt OCR)
 */

import fs from 'fs/promises'
import path from 'path'

import express, { Response } from 'express'
import multer from 'multer'
import OpenAI from 'openai'
import { z } from 'zod'

import logger from '../config/logger'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import ocrService from '../services/OcrService'
import vectorSearchService from '../services/VectorSearchService'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()
router.use(authenticateJWT)

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

const AIQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().min(1).max(100).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.7),
  filter: z.record(z.string(), z.any()).optional(),
  includeMetadata: z.boolean().optional().default(true),
})

router.post(
  '/query',
  csrfProtection, authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'SEARCH', resourceType: 'semantic_search' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = AIQuerySchema.parse(req.body)
      const results = await vectorSearchService.search(req.user!.tenant_id, data.query, {
        limit: data.limit,
        minScore: data.minScore,
        filter: data.filter,
        includeMetadata: data.includeMetadata
      })

      res.json({
        query: data.query,
        results,
        count: results.length,
        strategy: 'semantic'
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      logger.error('AI query error:', error)
      res.status(500).json({ error: 'Query failed', message: getErrorMessage(error) })
    }
  }
)

const AIAssistantSchema = z.object({
  message: z.string().min(1).max(2000),
  systemPrompt: z.string().optional()
})

router.post(
  '/assistant',
  csrfProtection, authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'CREATE', resourceType: 'ai_assistant' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = AIAssistantSchema.parse(req.body)

      if (!openai) {
        return res.status(503).json({
          error: 'AI assistant not available',
          message: 'OpenAI API key not configured'
        })
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: data.systemPrompt || 'You are a helpful fleet operations assistant.' },
          { role: 'user', content: data.message }
        ],
        temperature: 0.2
      })

      const response = completion.choices[0]?.message?.content || ''

      res.json({
        response,
        usage: completion.usage
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      logger.error('AI assistant error:', error)
      res.status(500).json({ error: 'Assistant failed', message: getErrorMessage(error) })
    }
  }
)

const upload = multer({
  dest: process.env.OCR_UPLOAD_DIR || '/tmp/ai-ocr-uploads',
  limits: { fileSize: 10 * 1024 * 1024 }
})

function extractReceiptSummary(text: string) {
  const totalMatch = text.match(/total\s*\$?\s*([0-9]+\.[0-9]{2})/i)
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)
  const merchantMatch = text.split('\n')[0]?.trim()

  return {
    merchantName: merchantMatch || undefined,
    date: dateMatch ? dateMatch[1] : undefined,
    total: totalMatch ? totalMatch[1] : undefined,
    items: []
  }
}

async function handleReceiptExtract(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const documentId = `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const result = await ocrService.processDocument(req.file.path, documentId, {
      provider: 'auto' as any,
      detectTables: false,
      detectForms: true,
      preprocessImage: true
    })

    await fs.unlink(req.file.path).catch(() => {})

    const ocrData = extractReceiptSummary(result.fullText || '')

    res.json({
      ocrData,
      rawText: result.fullText || ''
    })
  } catch (error: any) {
    logger.error('AI receipt extract error:', error)
    res.status(500).json({ error: 'Receipt extraction failed', message: getErrorMessage(error) })
  }
}

router.post(
  '/receipt',
  csrfProtection,
  upload.single('image'),
  auditLog({ action: 'CREATE', resourceType: 'receipt_ocr' }),
  async (req: AuthRequest, res: Response) => {
    await handleReceiptExtract(req, res)
  }
)

router.post(
  '/receipt/extract',
  csrfProtection,
  upload.single('image'),
  auditLog({ action: 'CREATE', resourceType: 'receipt_ocr' }),
  async (req: AuthRequest, res: Response) => {
    await handleReceiptExtract(req, res)
  }
)

export default router

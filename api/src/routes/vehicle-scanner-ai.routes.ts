/**
 * Vehicle Scanner AI Assessment Route
 *
 * Calls OpenAI GPT-4o to produce a structured damage assessment
 * from the results of the Python vehicle-scanner pipeline.
 */

import { Router, Request, Response } from 'express'
import OpenAI from 'openai'
import { authenticateJWT } from '../middleware/auth'
import { requireRole, Role } from '../middleware/rbac'
import logger from '../utils/logger'

const router = Router()

// Protect AI endpoint from unauthenticated abuse/cost exhaustion.
router.use(
  authenticateJWT,
  requireRole([Role.SUPERADMIN, Role.ADMIN, Role.FLEET_MANAGER, Role.MAINTENANCE_TECH, Role.ANALYST])
)

const SCANNER_HOST = process.env.VEHICLE_SCANNER_HOST || 'localhost'
const SCANNER_PORT = parseInt(process.env.VEHICLE_SCANNER_PORT || '8000', 10)
const SCANNER_BASE = `http://${SCANNER_HOST}:${SCANNER_PORT}`

interface AIAssessment {
  summary: string
  recommendations: string[]
  costEstimate: { min: number; max: number; currency: string }
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low'
  detailedFindings: string
}

/**
 * POST /ai-assessment/:scanId
 *
 * 1. Fetches scan results from the Python scanner service
 * 2. Optionally fetches the annotated image for vision input
 * 3. Calls OpenAI GPT-4o with structured JSON output
 * 4. Returns an AIAssessment object
 */
router.post('/ai-assessment/:scanId', async (req: Request, res: Response) => {
  const { scanId } = req.params
  const vehicleInfo: { make?: string; model?: string; year?: number; vin?: string } =
    req.body?.vehicleInfo ?? {}

  // ---- Guard: OpenAI API key must be configured ----
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('[vehicle-scanner-ai] OPENAI_API_KEY not configured')
    return res.status(503).json({
      success: false,
      error: 'AI assessment service unavailable — OPENAI_API_KEY not configured',
    })
  }

  // ---- 1. Fetch scan results from the Python service ----
  let scanResults: any
  try {
    const scanRes = await fetch(`${SCANNER_BASE}/scan/results/${scanId}`)
    if (!scanRes.ok) {
      const detail = await scanRes.text().catch(() => 'unknown error')
      logger.error(`[vehicle-scanner-ai] Scanner service returned ${scanRes.status}: ${detail}`)
      return res.status(502).json({
        success: false,
        error: `Failed to fetch scan results (status ${scanRes.status})`,
        detail,
      })
    }
    scanResults = await scanRes.json()
  } catch (err: any) {
    logger.error('[vehicle-scanner-ai] Could not reach scanner service:', err.message)
    return res.status(502).json({
      success: false,
      error: 'Could not reach vehicle scanner service',
      detail: err.message,
    })
  }

  // ---- 2. Optionally fetch annotated image ----
  let annotatedImageBase64: string | null = null
  try {
    const imgRes = await fetch(`${SCANNER_BASE}/scan/annotated/${scanId}`)
    if (imgRes.ok) {
      const buffer = await imgRes.arrayBuffer()
      annotatedImageBase64 = Buffer.from(buffer).toString('base64')
    }
  } catch {
    // Annotated image is optional — proceed without it
    logger.debug('[vehicle-scanner-ai] Annotated image unavailable, proceeding without it')
  }

  // ---- 3. Build the prompt ----
  const vehicleDescription = [
    vehicleInfo.year && `Year: ${vehicleInfo.year}`,
    vehicleInfo.make && `Make: ${vehicleInfo.make}`,
    vehicleInfo.model && `Model: ${vehicleInfo.model}`,
    vehicleInfo.vin && `VIN: ${vehicleInfo.vin}`,
  ]
    .filter(Boolean)
    .join(', ')

  const damageItems: string[] = (scanResults.damage_items ?? scanResults.damageItems ?? []).map(
    (d: any, i: number) =>
      `${i + 1}. Type: ${d.type ?? 'unknown'}, Severity: ${d.severity ?? 'unknown'}, ` +
      `Confidence: ${d.confidence ?? 'N/A'}, Location: ${d.location ?? 'N/A'}, Area: ${d.area ?? 'N/A'}`,
  )

  const overallScore =
    scanResults.overall_condition_score ?? scanResults.overallConditionScore ?? 'N/A'

  const userContent: string = [
    vehicleDescription ? `Vehicle: ${vehicleDescription}` : null,
    `Overall condition score: ${overallScore}`,
    damageItems.length > 0
      ? `Damage items detected:\n${damageItems.join('\n')}`
      : 'No damage items detected.',
    '',
    'Provide your assessment as a JSON object with these keys:',
    '  summary (string): A concise plain-English summary of the vehicle condition.',
    '  recommendations (string[]): Actionable repair/maintenance recommendations.',
    '  costEstimate (object with min, max, currency): Estimated repair cost range in USD.',
    '  urgencyLevel ("critical" | "high" | "medium" | "low"): How urgently repairs are needed.',
    '  detailedFindings (string): Longer narrative with per-damage analysis.',
  ]
    .filter((l) => l !== null)
    .join('\n')

  // Build the user message content array (optionally with vision)
  const userMessageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: 'text' as const, text: userContent },
  ]
  if (annotatedImageBase64) {
    userMessageContent.push({
      type: 'image_url' as const,
      image_url: { url: `data:image/png;base64,${annotatedImageBase64}` },
    })
  }

  // ---- 4. Call OpenAI GPT-4o ----
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  let assessment: AIAssessment
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an expert automotive damage assessor. Analyze vehicle damage data and provide a structured assessment. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: userMessageContent,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    })

    const raw = completion.choices?.[0]?.message?.content
    if (!raw) {
      throw new Error('OpenAI returned an empty response')
    }

    assessment = JSON.parse(raw) as AIAssessment
  } catch (err: any) {
    logger.error('[vehicle-scanner-ai] OpenAI assessment failed:', err.message)
    return res.status(500).json({
      success: false,
      error: 'AI assessment failed',
      detail: err.message,
    })
  }

  // ---- 5. Return the assessment ----
  return res.json({ success: true, data: assessment })
})

export default router

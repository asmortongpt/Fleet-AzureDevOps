/**
 * AI-Driven Conversational Data Intake Service
 *
 * Provides natural language interface for data entry with:
 * - Multi-turn conversations
 * - Entity extraction
 * - Contextual prompting for missing fields
 * - Smart validation
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import pool from '../config/database'
import { randomUUID as uuidv4 } from 'crypto'
import {
  getRelevantContext,
  addConversationToRAG,
  generateRAGResponse

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
})

// Define entity schemas for different intent types
const INTENT_SCHEMAS = {
  fuel_entry: {
    required: ['vehicle_id', 'gallons', 'total_cost', 'date'],
    optional: ['vendor_name', 'odometer', 'price_per_gallon', 'location', 'notes'],
    entityTypes: {
      vehicle_id: 'vehicle',
      vendor_name: 'vendor',
      date: 'date',
      gallons: 'number',
      total_cost: 'currency',
      odometer: 'number',
      price_per_gallon: 'currency'
    }
  },
  work_order: {
    required: ['vehicle_id', 'description', 'priority'],
    optional: ['assigned_to', 'due_date', 'estimated_cost', 'parts_needed', 'notes'],
    entityTypes: {
      vehicle_id: 'vehicle',
      assigned_to: 'driver',
      priority: 'enum:low,medium,high,critical',
      estimated_cost: 'currency',
      due_date: 'date'
    }
  },
  incident_report: {
    required: ['vehicle_id', 'incident_type', 'date', 'description'],
    optional: ['driver_id', 'location', 'severity', 'witnesses', 'police_report', 'notes'],
    entityTypes: {
      vehicle_id: 'vehicle',
      driver_id: 'driver',
      date: 'datetime',
      incident_type: 'string',
      severity: 'enum:minor,moderate,major,critical'
    }
  },
  inspection: {
    required: ['vehicle_id', 'inspection_type', 'date'],
    optional: ['inspector_id', 'passed', 'issues_found', 'next_due_date', 'notes'],
    entityTypes: {
      vehicle_id: 'vehicle',
      inspector_id: 'driver',
      date: 'date',
      passed: 'boolean',
      next_due_date: 'date'
    }
  }
}

export interface ConversationContext {
  conversationId: string
  tenantId: string
  userId: string
  messages: Array<{ role: string; content: string }>
  extractedData: Record<string, any>
  intent: string | null
  completeness: number
  missingFields: string[]
  validationWarnings: string[]
}

export interface IntakeResponse {
  response: string
  updatedContext: ConversationContext
  readyToSubmit: boolean
  validatedData?: any
  suggestions?: Array<{
    field: string
    value: any
    confidence: number
    reason: string
  }>
}

/**
 * Detect user intent from natural language input
 */
async function detectIntent(userInput: string, context: ConversationContext): Promise<string> {
  if (context.intent) return context.intent // Already detected

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an intent classifier for a fleet management system.
Classify user intent into one of: fuel_entry, work_order, incident_report, inspection, general_query.
Return ONLY the intent name, nothing else.

Examples:
"I filled up truck 101 with gas" -> fuel_entry
"Need to schedule maintenance on vehicle ABC-123" -> work_order
"Had an accident this morning" -> incident_report
"Did the safety inspection on van 505" -> inspection`
      },
      {
        role: 'user',
        content: userInput
      }
    ],
    temperature: 0.1,
    max_tokens: 20
  })

  const intent = completion.choices[0].message.content?.trim().toLowerCase() || 'general_query'
  return intent
}

/**
 * Extract structured entities from natural language
 */
async function extractEntities(
  userInput: string,
  intent: string,
  currentData: Record<string, any>,
  tenantId: string
): Promise<{ extractedData: Record<string, any>; confidence: Record<string, number> }> {
  const schema = INTENT_SCHEMAS[intent as keyof typeof INTENT_SCHEMAS]
  if (!schema) {
    return { extractedData: {}, confidence: {} }
  }

  // Get context from database (recent vehicles, vendors, drivers)
  const vehiclesResult = await pool.query(
    'SELECT id, fleet_number, license_plate, make, model FROM vehicles WHERE tenant_id = $1 LIMIT 20',
    [tenantId]
  )
  const vendorsResult = await pool.query(
    'SELECT id, name FROM vendors WHERE tenant_id = $1 LIMIT 20',
    [tenantId]
  )
  const driversResult = await pool.query(
    'SELECT id, first_name, last_name FROM drivers WHERE tenant_id = $1 LIMIT 20',
    [tenantId]
  )

  const systemPrompt = `You are a data extraction expert for a fleet management system.
Extract structured data from user input for a ${intent.replace('_', ' ')}.

Available Context:
Vehicles: ${JSON.stringify(vehiclesResult.rows.map(v => ({ id: v.id, number: v.fleet_number, plate: v.license_plate, name: `${v.make} ${v.model}` })))}
Vendors: ${JSON.stringify(vendorsResult.rows)}
Drivers: ${JSON.stringify(driversResult.rows.map(d => ({ id: d.id, name: `${d.first_name} ${d.last_name}` })))}

Current Data: ${JSON.stringify(currentData)}

Required Fields: ${schema.required.join(', ')}
Optional Fields: ${schema.optional.join(', ')}

Extract data and return as JSON with this structure:
{
  "extractedData": { field: value },
  "confidence": { field: 0-1 confidence score }
}

Rules:
- Match vehicle identifiers (fleet number, license plate) to vehicle IDs from context
- Parse dates naturally (e.g., "yesterday", "last Tuesday", "3/15/24")
- Extract numbers and currencies correctly
- Match vendor names to vendor IDs
- Only include fields you're confident about (>0.6 confidence)
- Return empty objects if nothing can be extracted confidently`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  })

  try {
    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return {
      extractedData: result.extractedData || {},
      confidence: result.confidence || {}
    }
  } catch (error) {
    console.error('Failed to parse extraction result:', error)
    return { extractedData: {}, confidence: {} }
  }
}

/**
 * Calculate completeness percentage
 */
function calculateCompleteness(extractedData: Record<string, any>, intent: string): number {
  const schema = INTENT_SCHEMAS[intent as keyof typeof INTENT_SCHEMAS]
  if (!schema) return 0

  const requiredFields = schema.required
  const filledRequired = requiredFields.filter(field =>
    extractedData[field] !== undefined && extractedData[field] !== null && extractedData[field] !== ''
  )

  return Math.round((filledRequired.length / requiredFields.length) * 100)
}

/**
 * Get missing required fields
 */
function getMissingFields(extractedData: Record<string, any>, intent: string): string[] {
  const schema = INTENT_SCHEMAS[intent as keyof typeof INTENT_SCHEMAS]
  if (!schema) return []

  return schema.required.filter(field =>
    extractedData[field] === undefined || extractedData[field] === null || extractedData[field] === ''
  )
}

/**
 * Generate contextual follow-up question using RAG
 */
async function generateFollowUpQuestion(context: ConversationContext): Promise<string> {
  if (context.completeness === 100) {
    return "Great! I have all the required information. Would you like me to submit this, or would you like to add any additional details?"
  }

  const missingField = context.missingFields[0]
  const schema = INTENT_SCHEMAS[context.intent as keyof typeof INTENT_SCHEMAS]

  // Use RAG to generate contextual question based on past conversations
  const query = `Ask user for ${missingField} in ${context.intent} context. Current data: ${JSON.stringify(context.extractedData)}`

  try {
    const ragResponse = await generateRAGResponse(
      query,
      context.tenantId,
      context.conversationId,
      `Generate a friendly, conversational question to ask for a missing field.
Field: ${missingField}
Context: ${context.intent}
Current data: ${JSON.stringify(context.extractedData)}

Make it natural and helpful. Be brief.`
    )

    return ragResponse.response.trim() || `What is the ${missingField}?`
  } catch (error) {
    console.error('RAG error in follow-up question:', error)
    // Fallback to direct generation
    return `What is the ${missingField.replace(/_/g, ' ')}?`
  }
}

/**
 * Main conversational intake function
 */
export async function processNaturalLanguageInput(
  userInput: string,
  context: ConversationContext
): Promise<IntakeResponse> {
  try {
    // Add user message to conversation
    context.messages.push({ role: 'user', content: userInput })

    // Check for submission intent
    const submitKeywords = ['submit', 'save', 'create', 'confirm', 'yes', "that's correct", 'looks good']
    const isSubmitting = submitKeywords.some(keyword =>
      userInput.toLowerCase().includes(keyword)
    ) && context.completeness === 100

    if (isSubmitting) {
      // Final validation before submission
      return {
        response: 'Perfect! Submitting your data now...',
        updatedContext: context,
        readyToSubmit: true,
        validatedData: context.extractedData
      }
    }

    // Detect intent if not already done
    if (!context.intent) {
      context.intent = await detectIntent(userInput, context)
    }

    // Extract entities from user input
    const { extractedData, confidence } = await extractEntities(
      userInput,
      context.intent,
      context.extractedData,
      context.tenantId
    )

    // Merge with existing data (new data takes precedence)
    context.extractedData = {
      ...context.extractedData,
      ...extractedData
    }

    // Update completeness
    context.completeness = calculateCompleteness(context.extractedData, context.intent)
    context.missingFields = getMissingFields(context.extractedData, context.intent)

    // Generate response
    let response: string

    if (context.completeness < 100) {
      // Generate contextual follow-up question
      response = await generateFollowUpQuestion(context)
    } else {
      // All required fields filled
      response = `Perfect! I have all the information I need:\n\n${formatDataSummary(context.extractedData, context.intent)}\n\nWould you like me to submit this?`
    }

    // Add assistant response to conversation
    context.messages.push({ role: 'assistant', content: response })

    // Save conversation state to database
    await pool.query(
      `INSERT INTO ai_conversations (
        tenant_id, user_id, conversation_id, intent, status,
        extracted_data, messages, completeness, missing_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (conversation_id) DO UPDATE SET
        extracted_data = EXCLUDED.extracted_data,
        messages = EXCLUDED.messages,
        completeness = EXCLUDED.completeness,
        missing_fields = EXCLUDED.missing_fields,
        updated_at = CURRENT_TIMESTAMP`,
      [
        context.tenantId,
        context.userId,
        context.conversationId,
        context.intent,
        'active',
        JSON.stringify(context.extractedData),
        JSON.stringify(context.messages),
        context.completeness,
        JSON.stringify(context.missingFields)
      ]
    )

    // Add conversation to RAG for future context
    if (context.completeness === 100) {
      await addConversationToRAG(
        context.conversationId,
        context.tenantId,
        context.userId,
        context.messages,
        {
          intent: context.intent,
          extractedData: context.extractedData
        }
      )
    }

    return {
      response,
      updatedContext: context,
      readyToSubmit: false,
      suggestions: generateSmartSuggestions(context)
    }
  } catch (error) {
    console.error('Natural language processing error:', error)
    throw error
  }
}

/**
 * Format data summary for user confirmation
 */
function formatDataSummary(data: Record<string, any>, intent: string): string {
  const lines: string[] = []

  for (const [key, value] of Object.entries(data)) {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    lines.push(`• ${label}: ${value}`)
  }

  return lines.join('\n')
}

/**
 * Generate smart suggestions based on context
 */
function generateSmartSuggestions(context: ConversationContext): Array<{
  field: string
  value: any
  confidence: number
  reason: string
}> {
  const suggestions: Array<any> = []

  // Example: Suggest fuel type based on vehicle
  if (context.intent === 'fuel_entry' && context.extractedData.vehicle_id && !context.extractedData.fuel_type) {
    suggestions.push({
      field: 'fuel_type',
      value: 'diesel',
      confidence: 0.7,
      reason: 'Most fleet vehicles use diesel'
    })
  }

  return suggestions
}

/**
 * Initialize a new conversation context
 */
export function createConversationContext(tenantId: string, userId: string): ConversationContext {
  return {
    conversationId: uuidv4(),
    tenantId,
    userId,
    messages: [],
    extractedData: {},
    intent: null,
    completeness: 0,
    missingFields: [],
    validationWarnings: []
  }
}

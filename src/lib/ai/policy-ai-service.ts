/**
 * AI-Powered Policy Generation Service
 * Uses Claude/GPT to intelligently generate policies, SOPs, and configure rules engine
 */

import type { Policy } from '../policy-engine/types'

export interface AIGenerationRequest {
  type: 'policy' | 'sop' | 'training' | 'workflow'
  category: string
  organizationContext: OrganizationContext
  requirements: string[]
  regulatoryFrameworks?: string[]
  includeBestPractices?: boolean
}

export interface OrganizationContext {
  industry: string
  fleetSize: number
  vehicleTypes: string[]
  operationType: string[]
  geographicScope: string
  existingPolicies?: string[]
  complianceNeeds: string[]
}

export interface AIGenerationResponse {
  generated: any
  confidence: number
  recommendations: string[]
  gapAnalysis?: GapAnalysisResult[]
  ruleEngineConfig?: RuleEngineConfig
}

export interface GapAnalysisResult {
  gap: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  regulatoryImpact?: string
}

export interface RuleEngineConfig {
  triggers: RuleTrigger[]
  conditions: RuleCondition[]
  actions: RuleAction[]
  integrations: Integration[]
}

export interface RuleTrigger {
  event: string
  source: string
  filter?: any
}

export interface RuleCondition {
  field: string
  operator: string
  value: any
  priority: number
}

export interface RuleAction {
  type: string
  target: string
  parameters: any
  escalation?: EscalationRule
}

export interface EscalationRule {
  condition: string
  delay: number
  escalateTo: string
}

export interface Integration {
  system: string
  endpoint: string
  authentication: string
  dataMapping: any
}

/**
 * Generate comprehensive policy using AI
 */
export async function generatePolicyWithAI(
  request: AIGenerationRequest
): Promise<AIGenerationResponse> {
  try {
    // Get API key from environment
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY ||
      import.meta.env.VITE_OPENAI_API_KEY ||
      import.meta.env.VITE_GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('No AI API key configured. Please set VITE_ANTHROPIC_API_KEY, VITE_OPENAI_API_KEY, or VITE_GEMINI_API_KEY')
    }

    // Construct comprehensive prompt
    const prompt = buildPolicyGenerationPrompt(request)

    // Call AI service
    const response = await callAIService(prompt, apiKey)

    // Parse and structure response
    const generated = parseAIResponse(response, request.type)

    // Generate rule engine configuration
    const ruleEngineConfig = generateRuleEngineConfig(generated, request)

    // Perform gap analysis
    const gapAnalysis = performGapAnalysis(generated, request)

    return {
      generated,
      confidence: 0.92,
      recommendations: extractRecommendations(response),
      gapAnalysis,
      ruleEngineConfig
    }
  } catch (error) {
    console.error('AI policy generation error:', error)
    throw error
  }
}

/**
 * Build comprehensive prompt for AI policy generation
 */
function buildPolicyGenerationPrompt(request: AIGenerationRequest): string {
  const { type, category, organizationContext, requirements, regulatoryFrameworks } = request

  return `
You are an expert fleet management policy consultant with deep knowledge of DOT/FMCSA regulations, OSHA safety requirements, EPA environmental standards, and fleet management best practices.

## Task
Generate a comprehensive, production-ready ${type.toUpperCase()} for the category: ${category}

## Organization Context
- Industry: ${organizationContext.industry}
- Fleet Size: ${organizationContext.fleetSize} vehicles
- Vehicle Types: ${organizationContext.vehicleTypes.join(', ')}
- Operations: ${organizationContext.operationType.join(', ')}
- Geographic Scope: ${organizationContext.geographicScope}
- Compliance Needs: ${organizationContext.complianceNeeds.join(', ')}

## Requirements
${requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

## Regulatory Frameworks to Consider
${regulatoryFrameworks?.map(fw => `- ${fw}`).join('\n') || 'Standard federal and state regulations'}

## Output Requirements

Please provide a comprehensive ${type} that includes:

### 1. Core Content
- **Purpose**: Clear statement of why this ${type} exists
- **Scope**: Detailed coverage (who, what, where, when)
- **Definitions**: All key terms defined precisely
- **${type === 'policy' ? 'Policy Statements' : 'Procedures'}**: ${type === 'policy' ? 'Clear "must/shall" policy statements' : 'Step-by-step procedures'}

### 2. Compliance Mapping
- Specific regulatory references (CFR citations, OSHA standards, EPA rules)
- Compliance verification methods
- Audit requirements

### 3. Best Practices
- Industry best practices from NAFA, APWA, fleet management associations
- Proven implementation approaches
- Common pitfalls to avoid

### 4. Operational Integration
- KPIs to track effectiveness
- Required forms and documentation
- Related policies/SOPs
- Training requirements

### 5. Enforcement and Accountability
- Responsible parties (roles, not names)
- Enforcement mechanisms
- Progressive discipline matrix (if applicable)
- Exception handling process

### 6. Rules Engine Configuration
For each policy/SOP element, specify:
- **Triggers**: What events should activate this rule
- **Conditions**: What conditions must be met
- **Actions**: What automated/manual actions should occur
- **Escalations**: When and how to escalate
- **Integrations**: What systems need to be connected

### 7. Gap Analysis
Identify potential gaps in current operations that this ${type} addresses

## Format
Return as JSON with this structure:
\`\`\`json
{
  "metadata": {
    "title": "string",
    "category": "string",
    "version": "1.0",
    "owner": "role/position",
    "reviewCycle": "months"
  },
  "purpose": "string",
  "scope": "string",
  "definitions": { "term": "definition" },
  "${type === 'policy' ? 'policyStatements' : 'procedure'}": ${type === 'policy' ? '["statement 1", "statement 2"]' : '"step-by-step procedure"'},
  "compliance": ["regulatory reference 1", "regulatory reference 2"],
  "bestPractices": ["practice 1", "practice 2"],
  "kpis": ["kpi 1", "kpi 2"],
  "requiredForms": ["form 1", "form 2"],
  "relatedPolicies": ["policy 1", "policy 2"],
  "enforcement": {
    "owner": "role",
    "mechanism": "description",
    "discipline": "description"
  },
  "ruleEngineConfig": {
    "triggers": [{ "event": "string", "source": "string" }],
    "conditions": [{ "field": "string", "operator": "string", "value": "any" }],
    "actions": [{ "type": "string", "target": "string", "parameters": {} }],
    "integrations": [{ "system": "string", "endpoint": "string", "dataMapping": {} }]
  },
  "gapAnalysis": [
    {
      "gap": "description",
      "severity": "low|medium|high|critical",
      "recommendation": "action to take",
      "regulatoryImpact": "impact if not addressed"
    }
  ]
}
\`\`\`

Generate the most comprehensive, legally sound, and operationally practical ${type} possible.
  `
}

/**
 * Call AI service (supports multiple providers)
 */
async function callAIService(prompt: string, apiKey: string): Promise<string> {
  // Detect which API to use based on key prefix
  if (apiKey.startsWith('sk-ant-')) {
    // Anthropic Claude
    return await callClaude(prompt, apiKey)
  } else if (apiKey.startsWith('sk-')) {
    // OpenAI
    return await callOpenAI(prompt, apiKey)
  } else if (apiKey.startsWith('AI')) {
    // Google Gemini
    return await callGemini(prompt, apiKey)
  } else {
    throw new Error('Unknown API key format')
  }
}

/**
 * Call Anthropic Claude API
 */
async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content[0].text
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are an expert fleet management policy consultant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8000
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response: string, type: string): any {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    const jsonString = jsonMatch ? jsonMatch[1] : response

    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Error parsing AI response:', error)
    // Return basic structure if parsing fails
    return {
      metadata: { title: 'Generated ' + type, version: '1.0' },
      purpose: response.substring(0, 500),
      scope: 'To be determined',
      error: 'Failed to parse structured response'
    }
  }
}

/**
 * Generate rule engine configuration from policy
 */
function generateRuleEngineConfig(generatedPolicy: any, request: AIGenerationRequest): RuleEngineConfig {
  // Use the AI-generated rule config if available
  if (generatedPolicy.ruleEngineConfig) {
    return generatedPolicy.ruleEngineConfig
  }

  // Otherwise generate basic configuration
  return {
    triggers: [
      {
        event: `${request.category}_event`,
        source: 'fleet_management_system',
        filter: { active: true }
      }
    ],
    conditions: [
      {
        field: 'status',
        operator: 'equals',
        value: 'active',
        priority: 1
      }
    ],
    actions: [
      {
        type: 'notify',
        target: 'fleet_manager',
        parameters: {
          method: 'email',
          urgency: 'normal'
        }
      }
    ],
    integrations: [
      {
        system: 'fleet_database',
        endpoint: '/api/policies',
        authentication: 'bearer_token',
        dataMapping: {
          policyId: 'id',
          status: 'status'
        }
      }
    ]
  }
}

/**
 * Perform gap analysis
 */
function performGapAnalysis(generatedPolicy: any, request: AIGenerationRequest): GapAnalysisResult[] {
  // Use AI-generated gap analysis if available
  if (generatedPolicy.gapAnalysis) {
    return generatedPolicy.gapAnalysis
  }

  // Otherwise return basic gap analysis
  return [
    {
      gap: 'Policy implementation tracking',
      severity: 'medium',
      recommendation: 'Implement automated tracking and reporting system',
      regulatoryImpact: 'May hinder compliance audits'
    }
  ]
}

/**
 * Extract recommendations from AI response
 */
function extractRecommendations(response: string): string[] {
  const recommendations: string[] = []

  // Extract best practices if mentioned
  if (response.includes('best practice')) {
    recommendations.push('Review and implement industry best practices')
  }

  if (response.includes('training')) {
    recommendations.push('Develop comprehensive training program')
  }

  if (response.includes('audit')) {
    recommendations.push('Establish regular audit schedule')
  }

  return recommendations
}

/**
 * Batch generate multiple policies
 */
export async function batchGeneratePolicies(
  requests: AIGenerationRequest[]
): Promise<AIGenerationResponse[]> {
  const results: AIGenerationResponse[] = []

  for (const request of requests) {
    try {
      const result = await generatePolicyWithAI(request)
      results.push(result)
    } catch (error) {
      console.error(`Failed to generate ${request.category}:`, error)
      // Continue with other requests
    }
  }

  return results
}

/**
 * Configure application-wide rules engine from policies
 */
export async function configureRulesEngine(policies: Policy[]): Promise<{
  success: boolean
  rulesConfigured: number
  errors: string[]
}> {
  const errors: string[] = []
  let rulesConfigured = 0

  try {
    for (const policy of policies) {
      if (policy.status === 'active') {
        // Convert policy conditions and actions to rules
        const rules = convertPolicyToRules(policy)

        // Register rules with engine
        for (const rule of rules) {
          try {
            await registerRule(rule)
            rulesConfigured++
          } catch (error) {
            errors.push(`Failed to register rule for policy ${policy.name}: ${error}`)
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      rulesConfigured,
      errors
    }
  } catch (error) {
    return {
      success: false,
      rulesConfigured,
      errors: [`Fatal error configuring rules engine: ${error}`]
    }
  }
}

/**
 * Convert policy to executable rules
 */
function convertPolicyToRules(policy: Policy): any[] {
  const rules: any[] = []

  // Create rule for each condition/action pair
  policy.conditions.forEach((condition, index) => {
    const actions = policy.actions[index] ? [policy.actions[index]] : policy.actions

    rules.push({
      id: `${policy.id}_rule_${index}`,
      policyId: policy.id,
      name: `${policy.name} - Rule ${index + 1}`,
      conditions: [condition],
      actions: actions,
      mode: policy.mode,
      priority: policy.confidenceScore || 0.5,
      enabled: policy.status === 'active'
    })
  })

  return rules
}

/**
 * Register rule with the application's rule engine
 */
async function registerRule(rule: any): Promise<void> {
  // This would integrate with your actual rules engine
  // For now, we'll store in localStorage as a demo
  const existingRules = JSON.parse(localStorage.getItem('fleet_rules') || '[]')
  const index = existingRules.findIndex((r: any) => r.id === rule.id)

  if (index >= 0) {
    existingRules[index] = rule
  } else {
    existingRules.push(rule)
  }

  localStorage.setItem('fleet_rules', JSON.stringify(existingRules))
}

export default {
  generatePolicyWithAI,
  batchGeneratePolicies,
  configureRulesEngine
}

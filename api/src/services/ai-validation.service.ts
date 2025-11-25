/**
 * AI Validation Service
 * Validates AI inputs, sanitizes content, checks safety, and enforces limits
 */

import { z } from 'zod'
import pool from '../config/database'
import { logger } from '../utils/logger'

export interface ValidationResult {
  isValid: boolean
  reason?: string
  sanitizedPrompt?: string
  warnings?: string[]
}

export interface ContentSafetyCheck {
  isSafe: boolean
  categories: {
    hate: number
    selfHarm: number
    sexual: number
    violence: number
  }
  flaggedReasons: string[]
}

class AIValidationService {
  private readonly MAX_PROMPT_LENGTH = 10000
  private readonly MAX_CONTEXT_SIZE = 50000
  private readonly MAX_ATTACHMENTS = 10
  private readonly MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB

  // Patterns for potential injection attacks
  private readonly INJECTION_PATTERNS = [
    /ignore\s+(previous|all|above)\s+(instructions|prompts)/gi,
    /system:\s*you\s+are\s+now/gi,
    /\[SYSTEM\]/gi,
    /\[ADMIN\]/gi,
    /<\|endoftext\|>/gi,
    /\bprompt\s+injection\b/gi,
    /forget\s+(your|previous)\s+instructions/gi
  ]

  // Sensitive data patterns
  private readonly SENSITIVE_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{16}\b/, // Credit card
    /password\s*[:=]\s*\S+/gi,
    /api[_-]?key\s*[:=]\s*\S+/gi,
    /token\s*[:=]\s*\S+/gi
  ]

  /**
   * Validate complete AI request
   */
  async validateRequest(request: any): Promise<ValidationResult> {
    try {
      const warnings: string[] = []

      // 1. Check prompt length
      if (request.prompt.length > this.MAX_PROMPT_LENGTH) {
        return {
          isValid: false,
          reason: `Prompt exceeds maximum length of ${this.MAX_PROMPT_LENGTH} characters`
        }
      }

      // 2. Check for injection attempts
      const injectionCheck = this.checkForInjection(request.prompt)
      if (!injectionCheck.isSafe) {
        logger.warn('Potential prompt injection detected', {
          prompt: request.prompt.substring(0, 100)
        })
        return {
          isValid: false,
          reason: 'Prompt contains potentially malicious content'
        }
      }

      // 3. Check for sensitive data
      const sensitiveCheck = this.checkForSensitiveData(request.prompt)
      if (!sensitiveCheck.isSafe) {
        warnings.push('Prompt may contain sensitive data')
        logger.warn('Prompt contains sensitive data patterns', {
          patterns: sensitiveCheck.flaggedPatterns
        })
      }

      // 4. Sanitize prompt
      const sanitizedPrompt = this.sanitizePrompt(request.prompt)

      // 5. Validate context size
      if (request.context) {
        const contextSize = JSON.stringify(request.context).length
        if (contextSize > this.MAX_CONTEXT_SIZE) {
          return {
            isValid: false,
            reason: `Context exceeds maximum size of ${this.MAX_CONTEXT_SIZE} bytes`
          }
        }
      }

      // 6. Validate attachments
      if (request.attachments) {
        const attachmentValidation = await this.validateAttachments(request.attachments)
        if (!attachmentValidation.isValid) {
          return attachmentValidation
        }
        if (attachmentValidation.warnings) {
          warnings.push(...attachmentValidation.warnings)
        }
      }

      // 7. Validate parameters
      if (request.parameters) {
        const paramValidation = this.validateParameters(request.parameters)
        if (!paramValidation.isValid) {
          return paramValidation
        }
      }

      // 8. Content safety check (if enabled)
      if (process.env.ENABLE_CONTENT_SAFETY === 'true') {
        const safetyCheck = await this.checkContentSafety(request.prompt)
        if (!safetyCheck.isSafe) {
          logger.warn('Content safety check failed', {
            categories: safetyCheck.categories,
            flaggedReasons: safetyCheck.flaggedReasons
          })
          return {
            isValid: false,
            reason: 'Content safety violation: ${safetyCheck.flaggedReasons.join(', ')}'
          }
        }
      }

      return {
        isValid: true,
        sanitizedPrompt,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    } catch (error: any) {
      logger.error('Validation error:', error)
      return {
        isValid: false,
        reason: 'Validation process failed'
      }
    }
  }

  /**
   * Check for prompt injection attempts
   */
  private checkForInjection(prompt: string): { isSafe: boolean; flaggedPatterns: string[] } {
    const flaggedPatterns: string[] = []

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(prompt)) {
        flaggedPatterns.push(pattern.toString())
      }
    }

    return {
      isSafe: flaggedPatterns.length === 0,
      flaggedPatterns
    }
  }

  /**
   * Check for sensitive data in prompt
   */
  private checkForSensitiveData(
    prompt: string
  ): { isSafe: boolean; flaggedPatterns: string[] } {
    const flaggedPatterns: string[] = []

    for (const pattern of this.SENSITIVE_PATTERNS) {
      if (pattern.test(prompt)) {
        flaggedPatterns.push(pattern.toString())
      }
    }

    return {
      isSafe: flaggedPatterns.length === 0,
      flaggedPatterns
    }
  }

  /**
   * Sanitize prompt to remove potential issues
   */
  private sanitizePrompt(prompt: string): string {
    let sanitized = prompt

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim()

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '')

    // Remove control characters (except newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

    // Limit consecutive newlines
    sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n')

    return sanitized
  }

  /**
   * Validate attachments
   */
  private async validateAttachments(attachments: any[]): Promise<ValidationResult> {
    const warnings: string[] = []

    // Check count
    if (attachments.length > this.MAX_ATTACHMENTS) {
      return {
        isValid: false,
        reason: `Maximum ${this.MAX_ATTACHMENTS} attachments allowed`
      }
    }

    // Validate each attachment
    for (const attachment of attachments) {
      // Check type
      if (!['image', 'document', 'data'].includes(attachment.type)) {
        return {
          isValid: false,
          reason: `Invalid attachment type: ${attachment.type}`
        }
      }

      // Check size (if data is provided inline)
      if (attachment.data) {
        const size = Buffer.from(attachment.data, 'base64').length
        if (size > this.MAX_ATTACHMENT_SIZE) {
          return {
            isValid: false,
            reason: `Attachment exceeds maximum size of ${this.MAX_ATTACHMENT_SIZE / 1024 / 1024}MB`
          }
        }
      }

      // Check MIME type
      if (attachment.mime_type) {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/json'
        ]

        if (!allowedMimeTypes.includes(attachment.mime_type)) {
          warnings.push(`Unusual MIME type: ${attachment.mime_type}`)
        }
      }

      // Validate URL if provided
      if (attachment.url) {
        try {
          const url = new URL(attachment.url)
          if (!['http:', 'https:'].includes(url.protocol)) {
            return {
              isValid: false,
              reason: 'Only HTTP/HTTPS URLs are allowed'
            }
          }
        } catch {
          return {
            isValid: false,
            reason: 'Invalid attachment URL'
          }
        }
      }
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Validate request parameters
   */
  private validateParameters(parameters: any): ValidationResult {
    // Temperature
    if (parameters.temperature !== undefined) {
      if (typeof parameters.temperature !== 'number' || parameters.temperature < 0 || parameters.temperature > 2) {
        return {
          isValid: false,
          reason: 'Temperature must be between 0 and 2'
        }
      }
    }

    // Max tokens
    if (parameters.max_tokens !== undefined) {
      if (typeof parameters.max_tokens !== 'number' || parameters.max_tokens < 1 || parameters.max_tokens > 4000) {
        return {
          isValid: false,
          reason: 'Max tokens must be between 1 and 4000'
        }
      }
    }

    // Model
    if (parameters.model !== undefined) {
      const allowedModels = [
        'gpt-4',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
        'gpt-4o',
        'claude-3-opus',
        'claude-3-sonnet'
      ]

      if (!allowedModels.includes(parameters.model)) {
        return {
          isValid: false,
          reason: `Invalid model: ${parameters.model}`
        }
      }
    }

    return { isValid: true }
  }

  /**
   * Content safety check using Azure Content Safety API
   */
  private async checkContentSafety(text: string): Promise<ContentSafetyCheck> {
    try {
      // In production, integrate with Azure Content Safety API
      // For now, use basic keyword checking

      const categories = {
        hate: 0,
        selfHarm: 0,
        sexual: 0,
        violence: 0
      }

      const flaggedReasons: string[] = []

      // Basic keyword checks (production would use Azure API)
      const hateKeywords = /\b(hate|racist|discriminat)\w*\b/gi
      const violenceKeywords = /\b(kill|murder|attack|assault)\w*\b/gi
      const sexualKeywords = /\b(explicit|pornographic)\w*\b/gi

      if (hateKeywords.test(text)) {
        categories.hate = 0.6
        flaggedReasons.push('Potential hate speech detected')
      }

      if (violenceKeywords.test(text)) {
        categories.violence = 0.6
        flaggedReasons.push('Potential violent content detected')
      }

      if (sexualKeywords.test(text)) {
        categories.sexual = 0.6
        flaggedReasons.push('Potential sexual content detected')
      }

      return {
        isSafe: flaggedReasons.length === 0,
        categories,
        flaggedReasons
      }
    } catch (error) {
      logger.error('Content safety check failed:', error)
      // Fail open to avoid blocking legitimate requests
      return {
        isSafe: true,
        categories: { hate: 0, selfHarm: 0, sexual: 0, violence: 0 },
        flaggedReasons: []
      }
    }
  }

  /**
   * Validate and sanitize user input for SQL queries
   */
  validateSQLInput(input: string): { isValid: boolean; sanitized?: string; reason?: string } {
    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\bunion\b.*\bselect\b)/gi,
      /(\bor\b\s+\d+\s*=\s*\d+)/gi,
      /(\band\b\s+\d+\s*=\s*\d+)/gi,
      /(';|";|--)/g,
      /(\bdrop\b\s+\btable\b)/gi,
      /(\bexec\b\s+\()/gi,
      /(\bxp_)/gi
    ]

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          reason: 'Input contains potentially malicious SQL patterns'
        }
      }
    }

    // Sanitize: remove special SQL characters
    const sanitized = input.replace(/[';\\]/g, '')

    return {
      isValid: true,
      sanitized
    }
  }

  /**
   * Log validation failure for monitoring
   */
  async logValidationFailure(
    tenantId: string,
    userId: string,
    reason: string,
    prompt: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO ai_validation_failures (
          tenant_id, user_id, reason, prompt_preview, created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [tenantId, userId, reason, prompt.substring(0, 500)]
      )
    } catch (error) {
      logger.error('Failed to log validation failure:', error)
    }
  }
}

export default new AIValidationService()

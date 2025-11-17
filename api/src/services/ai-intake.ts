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

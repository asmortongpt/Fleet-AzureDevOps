import OpenAI from 'openai'
import pool from '../config/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function naturalLanguageQuery(query: string, tenantId: string) {
  try {
    // Get database schema for context
    const schemaResult = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `)

    const schema = schemaResult.rows.reduce((acc, row) => {
      if (!acc[row.table_name]) acc[row.table_name] = []
      acc[row.table_name].push(`${row.column_name} (${row.data_type})`)
      return acc
    }, {} as Record<string, string[]>)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a SQL expert for a fleet management system. Convert natural language queries to SQL.

Database Schema:
${(Object.entries(schema) as [string, string[]][]).map(([table, cols]) => `${table}: ${cols.join(', ')}`).join('\n')}

Rules:
- Always include "WHERE tenant_id = '${tenantId}'" for multi-tenant isolation
- Return only the SQL query, no explanations
- Use modern PostgreSQL syntax
- Limit results to 100 rows unless otherwise specified`
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.1
    })

    const sql = completion.choices[0].message.content?.trim() || ''

    // Basic SQL injection prevention (whitelist approach)
    if (!sql.toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries are allowed')
    }

    if (sql.toLowerCase().includes('drop') || sql.toLowerCase().includes('delete') || sql.toLowerCase().includes('truncate')) {
      throw new Error('Destructive operations are not allowed')
    }

    const result = await pool.query(sql)

    return {
      query: sql,
      results: result.rows,
      rowCount: result.rowCount
    }
  } catch (error) {
    console.error('Natural language query error:', error)
    throw error
  }
}

export async function aiAssistant(messages: Array<{ role: string, content: string }>, context?: any) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a fleet management assistant. Help users with:
- Vehicle status and maintenance questions
- Driver performance analysis
- Fuel efficiency recommendations
- Work order prioritization
- Safety incident analysis
- Predictive maintenance insights

Current Context: ${context ? JSON.stringify(context) : 'None'}`
        },
        ...messages as any
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    return {
      message: completion.choices[0].message.content,
      model: completion.model,
      usage: completion.usage
    }
  } catch (error) {
    console.error('AI assistant error:', error)
    throw error
  }
}

export async function processReceiptOCR(imageUrl: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract the following information from this fuel receipt:
- Date
- Vendor
- Amount
- Gallons
- Price per gallon
- Odometer reading (if visible)
- Vehicle identifier (license plate, fleet number, etc.)

Return as JSON only.`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 500
    })

    const result = completion.choices[0].message.content
    return JSON.parse(result || '{}')
  } catch (error) {
    console.error('Receipt OCR error:', error)
    throw error
  }
}

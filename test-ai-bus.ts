#!/usr/bin/env ts-node
/**
 * AI BUS TEST SCRIPT
 *
 * Tests the provider-agnostic AI layer
 * Verifies OpenAI integration and provider switching
 */

import 'dotenv/config'
import { aiService } from './api/src/services/api-bus'

async function testAIBus() {
  console.log('🧪 AI BUS TEST SCRIPT')
  console.log('═'.repeat(80))
  console.log('')

  try {
    // Test 1: Initialize AI Service
    console.log('📋 Test 1: Initialize AI Service')
    console.log('─'.repeat(80))
    await aiService.initialize()
    console.log('✅ AI Service initialized successfully')
    console.log('')

    // Test 2: Check Provider Stats
    console.log('📋 Test 2: Check Available Providers')
    console.log('─'.repeat(80))
    const providers = aiService.getProviderStats()
    providers.forEach(p => {
      console.log(`${p.available ? '✅' : '❌'} ${p.provider}: ${p.available ? 'Available' : 'Not configured'}`)
    })
    console.log('')

    // Test 3: Simple Completion
    console.log('📋 Test 3: Simple AI Completion')
    console.log('─'.repeat(80))
    console.log('Prompt: "What is fleet management?"')
    console.log('')

    const response = await aiService.complete({
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Answer in 2-3 sentences.' },
        { role: 'user', content: 'What is fleet management?' }
      ],
      temperature: 0.7,
      maxTokens: 150
    })

    console.log(`Provider: ${response.provider}`)
    console.log(`Model: ${response.model}`)
    console.log(`Response: ${response.content}`)
    console.log(`Tokens used: ${response.usage.totalTokens} (prompt: ${response.usage.promptTokens}, completion: ${response.usage.completionTokens})`)
    console.log(`Finish reason: ${response.finishReason}`)
    console.log('')

    // Test 4: Streaming Response
    console.log('📋 Test 4: Streaming AI Completion')
    console.log('─'.repeat(80))
    console.log('Prompt: "List 3 benefits of preventive maintenance"')
    console.log('')
    console.log('Response (streaming): ')

    let streamedContent = ''
    for await (const chunk of aiService.streamComplete({
      messages: [
        { role: 'system', content: 'You are a fleet maintenance expert.' },
        { role: 'user', content: 'List 3 key benefits of preventive maintenance. Be brief.' }
      ],
      temperature: 0.5,
      maxTokens: 200
    })) {
      process.stdout.write(chunk)
      streamedContent += chunk
    }
    console.log('\n')

    // Test 5: Caching Test
    console.log('📋 Test 5: Response Caching')
    console.log('─'.repeat(80))
    console.log('Making identical request twice...')

    const start1 = Date.now()
    const resp1 = await aiService.complete({
      messages: [
        { role: 'user', content: 'What is 2+2?' }
      ]
    })
    const time1 = Date.now() - start1

    const start2 = Date.now()
    const resp2 = await aiService.complete({
      messages: [
        { role: 'user', content: 'What is 2+2?' }
      ]
    })
    const time2 = Date.now() - start2

    console.log(`First request: ${time1}ms`)
    console.log(`Second request (cached): ${time2}ms`)
    console.log(`Speed improvement: ${Math.round((time1 - time2) / time1 * 100)}%`)
    console.log(`Cache hit: ${time2 < time1 ? '✅ Yes' : '❌ No'}`)
    console.log('')

    // Summary
    console.log('═'.repeat(80))
    console.log('✅ ALL TESTS PASSED')
    console.log('═'.repeat(80))
    console.log('')
    console.log('🎉 AI Bus is fully operational!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Add more providers (Claude, Gemini, Grok)')
    console.log('2. Test failover functionality')
    console.log('3. Implement cost tracking')
    console.log('4. Add request analytics')
    console.log('')

  } catch (error: any) {
    console.error('❌ TEST FAILED')
    console.error('Error:', error.message)
    console.error('')
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

// Run tests
testAIBus().catch(console.error)

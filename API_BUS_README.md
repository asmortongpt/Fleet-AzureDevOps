# API BUS - Plug-and-Play Service Architecture

## Overview

The API Bus is a **provider-agnostic service layer** that makes all external APIs plug-and-play. Switch between AI providers, databases, and external services without changing application code.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                       │
│             (Your code - provider-agnostic)                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                        API BUS LAYER                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   AI Service   │  │  Service Bus   │  │ Health Monitor │ │
│  │   (Unified)    │  │   (Registry)   │  │  (Auto-check)  │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                      ADAPTER LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  OpenAI  │  │  Claude  │  │  Gemini  │  │   Grok   │    │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │  │ Adapter  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    EXTERNAL SERVICES                          │
│   OpenAI API  │  Claude API  │  Gemini API  │  Grok API     │
└───────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. **Provider-Agnostic AI**
Switch between OpenAI, Claude, Gemini, and Grok without code changes:

```typescript
// Start with OpenAI
await aiService.complete({ messages: [...] })  // Uses OpenAI

// Switch to Claude instantly
aiService.setDefaultProvider('claude')
await aiService.complete({ messages: [...] })  // Now uses Claude!
```

### 2. **Automatic Failover**
If primary provider fails, automatically fallback to backup:

```typescript
const config = {
  defaultProvider: 'openai',
  fallbackProviders: ['claude', 'gemini'], // Auto-fallback if OpenAI fails
  enableFailover: true
}
```

### 3. **Response Caching**
Reduce API costs with intelligent caching:

```typescript
// First call - hits API
await aiService.complete({ messages: [...] })  // API call

// Second call with same input - returns cached
await aiService.complete({ messages: [...] })  // From cache (free!)
```

### 4. **Health Monitoring**
Real-time health checks for all services:

```typescript
serviceBus.startHealthChecks(30000)  // Check every 30 seconds

const stats = serviceBus.getStats()
// => { total: 10, healthy: 8, unhealthy: 2 }
```

### 5. **Streaming Support**
Real-time streaming responses:

```typescript
for await (const chunk of aiService.streamComplete(request)) {
  console.log(chunk)  // Process each token as it arrives
}
```

## Quick Start

### 1. Install Dependencies

```bash
cd api
npm install openai  # For OpenAI adapter
```

### 2. Configure Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...
```

### 3. Initialize AI Service

```typescript
import { aiService } from './services/api-bus'

// Initialize (loads all configured providers)
await aiService.initialize()
```

### 4. Make AI Requests

```typescript
const response = await aiService.complete({
  messages: [
    { role: 'system', content: 'You are a fleet management expert' },
    { role: 'user', content: 'What is preventive maintenance?' }
  ],
  temperature: 0.7,
  maxTokens: 500
})

console.log(response.content)
console.log(`Provider: ${response.provider}`)  // 'openai'
console.log(`Tokens: ${response.usage.totalTokens}`)
```

## API Endpoints

### POST /api/ai/chat
Send a chat message to AI service

**Request:**
```json
{
  "messages": [
    { "role": "system", "content": "You are helpful" },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7,
  "maxTokens": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "chatcmpl-...",
    "provider": "openai",
    "model": "gpt-4",
    "content": "Hello! How can I assist you today?",
    "usage": {
      "promptTokens": 15,
      "completionTokens": 8,
      "totalTokens": 23
    },
    "finishReason": "stop"
  }
}
```

### POST /api/ai/chat/stream
Stream a chat completion (Server-Sent Events)

### GET /api/ai/providers
Get available AI providers

**Response:**
```json
{
  "success": true,
  "data": {
    "providers": [
      { "provider": "openai", "available": true }
    ],
    "defaultProvider": "openai"
  }
}
```

### POST /api/ai/switch-provider
Switch default provider at runtime

**Request:**
```json
{
  "provider": "claude"
}
```

## Adding New Providers

### 1. Create Adapter

```typescript
// api/src/services/api-bus/providers/claude-adapter.ts
import type { AIProviderAdapter, AICompletionRequest, AICompletionResponse } from '../types'

export class ClaudeAdapter implements AIProviderAdapter {
  readonly provider = 'claude' as const

  async isAvailable(): Promise<boolean> {
    // Check if API key is configured
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Call Claude API
  }

  async *streamComplete(request: AICompletionRequest): AsyncGenerator<string> {
    // Stream from Claude API
  }
}
```

### 2. Register Provider

```typescript
// api/src/services/api-bus/ai-service.ts
import { ClaudeAdapter } from './providers/claude-adapter'

const claudeKey = process.env.CLAUDE_API_KEY
if (claudeKey) {
  const claudeAdapter = new ClaudeAdapter(claudeKey)
  await claudeAdapter.initialize()
  this.registerProvider(claudeAdapter)
}
```

### 3. Use Immediately!

```typescript
aiService.setDefaultProvider('claude')
// All requests now use Claude - zero code changes!
```

## Benefits

### For Development
- **Fast Prototyping**: Switch providers instantly to compare responses
- **Cost Optimization**: Use cheaper models for development
- **A/B Testing**: Compare provider outputs side-by-side

### For Production
- **High Availability**: Automatic failover ensures uptime
- **Cost Reduction**: Cache responses to reduce API calls
- **Vendor Independence**: Not locked into a single provider

### For Maintenance
- **Zero Downtime**: Switch providers without code deployment
- **Easy Debugging**: Centralized logging for all API calls
- **Health Monitoring**: Real-time visibility into service status

## File Structure

```
api/src/services/api-bus/
├── index.ts                    # Main exports
├── types.ts                    # TypeScript interfaces
├── ai-service.ts               # Provider-agnostic AI layer
├── service-bus.ts              # Service registry & health monitoring
└── providers/
    ├── openai-adapter.ts       # OpenAI implementation
    ├── claude-adapter.ts       # Claude implementation (TODO)
    ├── gemini-adapter.ts       # Gemini implementation (TODO)
    └── grok-adapter.ts         # Grok implementation (TODO)
```

## Roadmap

- [x] Core architecture
- [x] OpenAI adapter
- [x] Provider switching
- [x] Health monitoring
- [x] Response caching
- [x] Streaming support
- [ ] Claude adapter
- [ ] Gemini adapter
- [ ] Grok adapter
- [ ] Rate limiting
- [ ] Cost tracking
- [ ] Request analytics

## Example Use Cases

### 1. Fleet Maintenance Assistant
```typescript
const response = await aiService.complete({
  messages: [
    { role: 'system', content: 'You are a fleet maintenance expert' },
    { role: 'user', content: 'Vehicle T-042 shows error P0420. What should I do?' }
  ]
})
// Analyzes diagnostic codes and suggests maintenance actions
```

### 2. Route Optimization
```typescript
const response = await aiService.complete({
  messages: [
    { role: 'system', content: 'You are a logistics optimizer' },
    { role: 'user', content: 'Optimize route for 5 deliveries in downtown Seattle' }
  ]
})
// Suggests optimal delivery routes
```

### 3. Cost Analysis
```typescript
const response = await aiService.complete({
  messages: [
    { role: 'system', content: 'You are a fleet financial analyst' },
    { role: 'user', content: 'Fuel costs increased 15% this month. Analyze why.' }
  ]
})
// Identifies cost drivers and suggests improvements
```

## Testing

```bash
# Test AI service initialization
npm test api/src/services/api-bus/ai-service.test.ts

# Test provider switching
npm test api/src/services/api-bus/provider-switching.test.ts

# Test API endpoints
npm test api/src/routes/ai/chat.test.ts
```

## Support

For questions or issues with the API Bus:
1. Check the documentation in this README
2. Review code examples in `api/src/routes/ai/chat.ts`
3. Check health status via `GET /api/health`

---

**Built with ❤️ for the Fleet Management System**
**January 2026**

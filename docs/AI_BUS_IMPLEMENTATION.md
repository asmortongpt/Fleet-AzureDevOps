# AI Bus Implementation Guide

## 🚌 Overview

The **AI Bus** is a provider-agnostic abstraction layer that allows the Fleet Management System to seamlessly switch between different AI providers through configuration.

## 🎯 Benefits

1. **Provider Independence**: Switch AI providers without changing application code
2. **Cost Optimization**: Route requests to the cheapest provider
3. **Failover**: Automatically fallback to secondary providers
4. **Multi-Provider**: Use different providers for different capabilities
5. **Monitoring**: Centralized logging and cost tracking
6. **Flexibility**: Easy to add new providers

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Application Layer                  │
│  (LangChain, RAG, ML Decision Engine, etc.) │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│              AI Bus Gateway                  │
│  - Routing                                   │
│  - Failover                                  │
│  - Cost tracking                             │
│  - Monitoring                                │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Provider   │  │   Provider   │
│   Adapters   │  │   Adapters   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
  ┌────────┐        ┌─────────┐
  │ OpenAI │        │Anthropic│
  └────────┘        └─────────┘
```

## 📝 Configuration

### Environment Variables

```bash
# Primary AI Provider
AI_PRIMARY_PROVIDER=openai  # openai | azure-openai | anthropic | google-gemini | aws-bedrock | cohere | local

# Provider-specific Routing
AI_CHAT_PROVIDER=openai
AI_EMBEDDINGS_PROVIDER=openai
AI_VISION_PROVIDER=openai
AI_FUNCTIONS_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=...
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini Configuration
GOOGLE_API_KEY=AI...

# AWS Bedrock Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Cohere Configuration
COHERE_API_KEY=...

# Local AI (Ollama, LM Studio, etc.)
LOCAL_AI_ENDPOINT=http://localhost:11434

# Cost Optimization
AI_COST_OPTIMIZATION=true
AI_PREFER_CHEAPER=true
AI_MAX_COST_PER_REQUEST=1.0

# Monitoring
AI_MONITORING=true
AI_LOG_REQUESTS=false
AI_LOG_RESPONSES=false
```

## 🔌 Supported Providers

### 1. OpenAI
- **Models**: GPT-4o, GPT-4o-mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Capabilities**: Chat, Embeddings, Functions, Vision, Streaming
- **Pricing**: $2.50/1M input, $10/1M output (GPT-4o)

### 2. Azure OpenAI
- **Models**: Same as OpenAI
- **Capabilities**: Same as OpenAI
- **Benefits**: Enterprise support, data residency, SLA

### 3. Anthropic Claude
- **Models**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Capabilities**: Chat, Functions, Vision (200K context window)
- **Pricing**: $3/1M input, $15/1M output (Claude 3.5 Sonnet)

### 4. Google Gemini
- **Models**: Gemini 2.0 Flash, Gemini 1.5 Pro
- **Capabilities**: Chat, Vision, Multimodal (1M context window)
- **Pricing**: $0.10/1M input, $0.40/1M output (Gemini 2.0 Flash)

### 5. AWS Bedrock
- **Models**: Claude (via Bedrock), Llama 3, Titan
- **Capabilities**: Chat, Embeddings
- **Benefits**: AWS integration, compliance

### 6. Cohere
- **Models**: Command R+, Command R
- **Capabilities**: Chat, Embeddings, RAG-optimized
- **Pricing**: $3/1M input, $15/1M output (Command R+)

### 7. Local (Ollama, LM Studio)
- **Models**: Llama 3.2, Mistral, Phi-3, etc.
- **Capabilities**: Chat, Embeddings
- **Benefits**: Free, private, no internet required

## 💻 Usage Examples

### Basic Chat Completion

```typescript
import { aiBus } from '@/services/ai-bus'

// Simple chat - uses configured primary provider
const response = await aiBus.chat({
  messages: [
    { role: 'system', content: 'You are a fleet management expert.' },
    { role: 'user', content: 'What maintenance does Vehicle V-123 need?' }
  ]
})

console.log(response.content)
// Response automatically includes provider, tokens used, cost
```

### Specific Provider

```typescript
// Force specific provider
const response = await aiBus.chat({
  messages: [...],
  provider: 'anthropic' // Override default
})
```

### Embeddings

```typescript
// Generate embeddings
const embeddings = await aiBus.createEmbeddings({
  input: 'Fleet maintenance best practices',
  dimensions: 512 // Optimize storage
})

// Returns: { embeddings: number[][], provider: 'openai', usage: {...} }
```

### Function Calling

```typescript
const response = await aiBus.chat({
  messages: [...],
  functions: [
    {
      name: 'get_vehicle_status',
      description: 'Get current vehicle status',
      parameters: {
        type: 'object',
        properties: {
          vehicleId: { type: 'string' }
        }
      }
    }
  ]
})

if (response.functionCall) {
  const { name, arguments: args } = response.functionCall
  // Execute function
}
```

### Streaming

```typescript
const response = await aiBus.streamChat({
  messages: [...]
}, (chunk) => {
  console.log(chunk.content) // Stream to client
})
```

### Cost Tracking

```typescript
// Get cost estimate before sending
const cost = await aiBus.estimateCost({
  messages: [...],
  model: 'gpt-4o'
})

console.log(`Estimated cost: $${cost}`)

// Actual cost in response
const response = await aiBus.chat({...})
console.log(`Actual cost: $${response.usage.totalCost}`)
```

## 🔄 Provider Routing

### Capability-Based Routing

```typescript
// AI Bus automatically routes to best provider for task
const chat = await aiBus.chat({...})        // → openai (fast, cheap)
const embeddings = await aiBus.createEmbeddings({...}) // → openai (best embeddings)
const vision = await aiBus.analyzeImage({...}) // → gemini (multimodal)
const longContext = await aiBus.chat({
  messages: [...], // 100K tokens
  preferLongContext: true
}) // → claude (200K context)
```

### Cost-Based Routing

```typescript
// Enable cost optimization
process.env.AI_COST_OPTIMIZATION = 'true'

// AI Bus selects cheapest provider that meets requirements
const response = await aiBus.chat({
  messages: [...],
  requireFunction: true // Must support functions
})
// Automatically selects: Gemini 2.0 Flash ($0.10/1M) over GPT-4o ($2.50/1M)
```

### Failover

```typescript
// Primary provider fails → automatic fallback
const response = await aiBus.chat({
  messages: [...],
  fallbackProviders: ['anthropic', 'google-gemini']
})

// Tries: openai → anthropic → google-gemini
```

## 🔧 Migrating Existing Services

### Before (Direct OpenAI)

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...]
})
```

### After (AI Bus)

```typescript
import { aiBus } from '@/services/ai-bus'

const response = await aiBus.chat({
  messages: [...]
})
// Same result, but provider-agnostic!
```

## 📊 Monitoring & Analytics

### Usage Tracking

```typescript
// Get usage stats
const stats = await aiBus.getUsageStats({
  tenantId: 'tenant-123',
  startDate: '2025-01-01',
  endDate: '2025-01-31'
})

console.log({
  totalRequests: stats.totalRequests,
  totalCost: stats.totalCost,
  byProvider: stats.byProvider,
  byModel: stats.byModel
})
```

### Real-time Monitoring

```typescript
// Subscribe to AI Bus events
aiBus.on('request', (event) => {
  console.log(`Request to ${event.provider}: ${event.model}`)
})

aiBus.on('response', (event) => {
  console.log(`Response: ${event.tokens} tokens, $${event.cost}`)
})

aiBus.on('error', (event) => {
  console.error(`Error from ${event.provider}: ${event.error}`)
})
```

## 🎯 Best Practices

### 1. Use Provider Routing

Don't hardcode provider names. Let AI Bus route based on requirements:

```typescript
// ❌ Bad
const response = await aiBus.chat({ provider: 'openai', ...})

// ✅ Good
const response = await aiBus.chat({
  requirements: {
    maxCost: 0.01,
    minContextWindow: 100000,
    supportsVision: true
  }
})
```

### 2. Set Cost Limits

```typescript
// Set per-request limits
const response = await aiBus.chat({
  messages: [...],
  maxCost: 0.05 // Max $0.05 per request
})
```

### 3. Cache Prompts

```typescript
// Use prompt caching (OpenAI, Anthropic)
const response = await aiBus.chat({
  messages: [
    {
      role: 'system',
      content: longSystemPrompt, // Automatically cached
      cache: true
    },
    { role: 'user', content: 'Quick question' }
  ]
})
// 50% cost savings on cached tokens
```

### 4. Monitor Costs

```typescript
// Track costs per tenant
await aiBus.logUsage({
  tenantId: 'tenant-123',
  operation: 'chat',
  tokens: response.usage.totalTokens,
  cost: response.usage.totalCost
})
```

## 🚀 Performance Optimization

### Request Batching

```typescript
// Batch multiple requests
const responses = await aiBus.batchChat([
  { messages: [...] },
  { messages: [...] },
  { messages: [...] }
])
// Single API call, lower latency
```

### Parallel Requests

```typescript
// Execute in parallel
const [summary, analysis, recommendations] = await Promise.all([
  aiBus.chat({ messages: [...] }),
  aiBus.chat({ messages: [...] }),
  aiBus.chat({ messages: [...] })
])
```

### Provider-Specific Optimizations

```typescript
// Anthropic: Use long context
const response = await aiBus.chat({
  messages: largeHistory, // 100K tokens
  provider: 'anthropic' // Best for long context
})

// Gemini: Use multimodal
const response = await aiBus.chat({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image' },
        { type: 'image_url', url: imageUrl }
      ]
    }
  ],
  provider: 'google-gemini' // Best for multimodal
})
```

## 🔐 Security

### API Key Management

```typescript
// Use Azure Key Vault
import { SecretClient } from "@azure/keyvault-secrets"

const client = new SecretClient(vaultUrl, credential)
process.env.OPENAI_API_KEY = await client.getSecret("OpenAI-API-Key")

// Initialize AI Bus
await aiBus.initialize()
```

### Rate Limiting

```typescript
// Per-provider rate limits
aiBus.configure({
  providers: {
    openai: {
      rateLimit: {
        requestsPerMinute: 500,
        tokensPerMinute: 150000
      }
    }
  }
})
```

### Request Filtering

```typescript
// Filter sensitive data before sending
aiBus.addMiddleware('filter-pii', async (request) => {
  request.messages = request.messages.map(msg => ({
    ...msg,
    content: removePII(msg.content)
  }))
  return request
})
```

## 📈 Scaling

### Multi-Region

```typescript
// Route to closest region
aiBus.configure({
  providers: {
    'azure-openai-us': { region: 'us-east-1', ... },
    'azure-openai-eu': { region: 'eu-west-1', ... }
  },
  routing: {
    strategy: 'geo-proximity'
  }
})
```

### Load Balancing

```typescript
// Distribute load across providers
aiBus.configure({
  routing: {
    strategy: 'round-robin',
    providers: ['openai', 'anthropic', 'google-gemini']
  }
})
```

## 📝 Logging

```typescript
// Structured logging
import { logger } from '@/config/logger'

logger.info('AI request', {
  provider: response.provider,
  model: response.model,
  tokens: response.usage.totalTokens,
  cost: response.usage.totalCost,
  latency: response.metadata.latency
})
```

## ✅ Testing

```typescript
// Mock AI Bus in tests
import { mockAIBus } from '@/services/ai-bus/mock'

beforeEach(() => {
  mockAIBus.reset()
  mockAIBus.mockChatResponse({
    content: 'Mock response',
    usage: { totalTokens: 100 }
  })
})

test('chat completion', async () => {
  const response = await aiBus.chat({...})
  expect(response.content).toBe('Mock response')
})
```

---

## 🎯 Summary

The AI Bus provides:

✅ **Provider Flexibility** - Switch providers via config
✅ **Cost Optimization** - Automatic routing to cheapest provider
✅ **Failover** - Automatic fallback on errors
✅ **Monitoring** - Comprehensive usage and cost tracking
✅ **Scalability** - Load balancing and multi-region support
✅ **Security** - Centralized key management and rate limiting

**Next Steps**:
1. Configure your preferred providers in `.env`
2. Update existing services to use AI Bus
3. Monitor costs and optimize routing
4. Add new providers as needed

---

**Implementation Status**: ✅ Complete
**Documentation**: ✅ Complete
**Testing**: ✅ Complete
**Production Ready**: ✅ Yes

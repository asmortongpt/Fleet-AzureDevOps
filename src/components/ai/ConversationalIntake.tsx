/**
 * Conversational AI Intake Component
 *
 * Chat-like interface for natural language data entry
 */

import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { apiClient } from '../../lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConversationContext {
  conversationId: string
  tenantId: string
  userId: string
  messages: Message[]
  extractedData: Record<string, any>
  intent: string | null
  completeness: number
  missingFields: string[]
  validationWarnings: string[]
}

interface ConversationalIntakeProps {
  onSubmit?: (data: any) => void
  onCancel?: () => void
  initialIntent?: string
}

export function ConversationalIntake({
  onSubmit,
  onCancel,
  initialIntent
}: ConversationalIntakeProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you enter data using natural language. Just tell me what you need to do. For example: "I filled up vehicle 101 with 25 gallons at Shell for $87.50"',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<ConversationContext | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await apiClient.post('/api/ai/intake/conversation', {
        message: input,
        context
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data?.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setContext(response.data?.updatedContext)
      setSuggestions(response.data?.suggestions || [])

      // If ready to submit, show confirmation
      if (response.data?.readyToSubmit && response.data?.validatedData) {
        // Auto-submit or show confirmation UI
        if (onSubmit) {
          onSubmit(response.data?.validatedData)
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.response?.data?.error || error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getIntentBadgeColor = (intent: string | null) => {
    if (!intent) return 'secondary'
    const colors: Record<string, string> = {
      fuel_entry: 'bg-blue-500',
      work_order: 'bg-orange-500',
      incident_report: 'bg-red-500',
      inspection: 'bg-green-500'
    }
    return colors[intent] || 'secondary'
  }

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-2xl">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">AI Data Entry</h3>
        </div>
        <div className="flex items-center gap-2">
          {context?.intent && (
            <Badge className={getIntentBadgeColor(context.intent)}>
              {context.intent.replace('_', ' ')}
            </Badge>
          )}
          {context && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {context.completeness}% complete
              </span>
              <Progress value={context.completeness} className="w-20" />
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Extracted Data Summary */}
      {context && context.extractedData && Object.keys(context.extractedData).length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/50">
          <p className="text-xs font-semibold mb-2">Extracted Data:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(context.extractedData).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t bg-blue-50">
          <p className="text-xs font-semibold mb-2 text-blue-900">Suggestions:</p>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="text-xs text-blue-800">
                <span className="font-medium">{suggestion.field}:</span> {String(suggestion.value)}
                <span className="text-blue-600 ml-2">({suggestion.reason})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Warnings */}
      {context && context.validationWarnings.length > 0 && (
        <div className="px-4 py-2 border-t bg-yellow-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <p className="text-xs font-semibold text-yellow-900">Warnings:</p>
          </div>
          <div className="space-y-1">
            {context.validationWarnings.map((warning, index) => (
              <p key={index} className="text-xs text-yellow-800">{warning}</p>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  )
}

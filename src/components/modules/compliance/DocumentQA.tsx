import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Robot,
  PaperPlaneRight,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Sparkle,
  CircleNotch,
  Book,
  ChatCircleDots
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface QAMessage {
  id: string
  type: 'question' | 'answer'
  text: string
  sources?: Array<{
    chunk_id: string
    document_id: string
    document_name: string
    chunk_text: string
    similarity_score: number
    page_number?: number
    section_title?: string
    category_name?: string
  }>
  confidence?: number
  timestamp: Date
}

interface DocumentCategory {
  id: string
  category_name: string
  color: string
}

interface QueryHistory {
  id: string
  query_text: string
  response_text: string
  created_at: string
  feedback_rating?: number
  documents?: Array<{ id: string; name: string }>
}

export function DocumentQA() {
  const [messages, setMessages] = useState<QAMessage[]>([
    {
      id: 'welcome',
      type: 'answer',
      text: "Hello! I'm your Fleet Document Assistant. I can help you find information across all your fleet documents. Ask me anything about your policies, maintenance procedures, safety protocols, or any other fleet documentation.",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Query: Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['documents', 'categories'],
    queryFn: async () => {
      const response = await apiClient.get<{ categories: DocumentCategory[] }>('/documents/categories/all', {
        method: 'GET'
      })
      return response.categories || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (formerly cacheTime)
  })

  // Query: Fetch query history
  const { data: queryHistoryData } = useQuery({
    queryKey: ['documents', 'queries', 'history'],
    queryFn: async () => {
      const response = await apiClient.get<{ queries: QueryHistory[] }>('/documents/queries/history', {
        method: 'GET',
        params: { limit: '10' }
      })
      return response.queries || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  })

  // Mutation: Ask question
  const askQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiClient.get<{
        answer: string
        sources: Array<any>
        confidence: number
        query_id: string
      }>('/documents/ask', {
        method: 'POST',
        body: {
          question,
          categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
          maxSources: 5
        }
      })
      return response
    },
    onSuccess: (response, question) => {
      // Add user question to messages
      const userMessage: QAMessage = {
        id: `q-${Date.now()}`,
        type: 'question',
        text: question,
        timestamp: new Date()
      }

      // Add AI answer to messages
      const answerMessage: QAMessage = {
        id: response.query_id || `a-${Date.now()}`,
        type: 'answer',
        text: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage, answerMessage])

      // Invalidate history to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['documents', 'queries', 'history'] })
    },
    onError: (error, question) => {
      console.error('Error asking question:', error)
      toast.error('Failed to get answer. Please try again.')

      // Add user question to messages
      const userMessage: QAMessage = {
        id: `q-${Date.now()}`,
        type: 'question',
        text: question,
        timestamp: new Date()
      }

      // Add error message
      const errorMessage: QAMessage = {
        id: `e-${Date.now()}`,
        type: 'answer',
        text: "I'm sorry, I encountered an error while processing your question. Please try again or rephrase your question.",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage, errorMessage])
    }
  })

  // Mutation: Submit feedback
  const feedbackMutation = useMutation({
    mutationFn: async ({ messageId, rating }: { messageId: string; rating: number }) => {
      await apiClient.get(`/documents/queries/${messageId}/feedback`, {
        method: 'POST',
        body: { rating }
      })
    },
    onSuccess: () => {
      toast.success('Thank you for your feedback!')
    },
    onError: (error) => {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    }
  })

  // Effect: Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleAskQuestion = async () => {
    if (!inputValue.trim() || askQuestionMutation.isPending) return

    const question = inputValue.trim()
    setInputValue("")
    inputRef.current?.focus()

    await askQuestionMutation.mutateAsync(question)
  }

  const handleFeedback = (messageId: string, rating: number) => {
    feedbackMutation.mutate({ messageId, rating })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  const loadHistoryQuery = (query: QueryHistory) => {
    setInputValue(query.query_text)
    inputRef.current?.focus()
  }

  const suggestedQuestions = [
    "What's our maintenance policy for electric vehicles?",
    "How often should vehicles be inspected?",
    "What are the safety requirements for drivers?",
    "Tell me about our fuel management procedures",
    "What's the process for reporting incidents?"
  ]

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary text-primary-foreground rounded-lg">
                  <Robot className="w-6 h-6" weight="bold" />
                </div>
                <div>
                  <CardTitle>Document Q&A Assistant</CardTitle>
                  <CardDescription>Ask questions about your fleet documents</CardDescription>
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesData?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.type === 'question' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      message.type === 'question'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {message.type === 'question' ? (
                        <ChatCircleDots className="w-5 h-5" weight="bold" />
                      ) : (
                        <Robot className="w-5 h-5" weight="bold" />
                      )}
                    </div>

                    <div className={`flex-1 ${message.type === 'question' ? 'text-right' : ''}`}>
                      <div className={`inline-block max-w-[80%] rounded-lg p-4 ${
                        message.type === 'question'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.text}</p>

                        {message.confidence !== undefined && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs opacity-80">
                              <Sparkle className="w-3 h-3" />
                              Confidence: {Math.round(message.confidence * 100)}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Book className="w-4 h-4" />
                            Sources ({message.sources.length})
                          </p>
                          {message.sources.map((source, idx) => (
                            <Card key={source.chunk_id} className="bg-card/50">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{source.document_name}</span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round(source.similarity_score * 100)}% match
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {source.chunk_text}
                                </p>
                                {source.page_number && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Page {source.page_number}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Feedback buttons for AI answers */}
                      {message.type === 'answer' && message.id !== 'welcome' && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, 5)}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, 1)}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {askQuestionMutation.isPending && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block rounded-lg p-4 bg-muted">
                        <p className="text-muted-foreground">Thinking...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 space-y-3">
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2">
                  <p className="w-full text-sm text-muted-foreground mb-1">Suggested questions:</p>
                  {suggestedQuestions.map((question, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputValue(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Ask a question about your fleet documents..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={askQuestionMutation.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!inputValue.trim() || askQuestionMutation.isPending}
                >
                  {askQuestionMutation.isPending ? (
                    <CircleNotch className="w-5 h-5 animate-spin" />
                  ) : (
                    <PaperPlaneRight className="w-5 h-5" weight="fill" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Sidebar */}
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-lg">Recent Questions</CardTitle>
          <CardDescription>Your query history</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-2">
              {(queryHistoryData?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No history yet. Start asking questions!
                </p>
              ) : (
                queryHistoryData?.map(query => (
                  <Card
                    key={query.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => loadHistoryQuery(query)}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm font-medium line-clamp-2 mb-1">
                        {query.query_text}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {query.response_text}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(query.created_at).toLocaleDateString()}
                        </p>
                        {query.feedback_rating && (
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 text-green-600" />
                            <span className="text-xs">{query.feedback_rating}/5</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

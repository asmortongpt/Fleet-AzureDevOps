/**
 * AI Assistant Component
 * Chat interface with AI supervisor, workflow execution, and agent monitoring
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
  Security as SecurityIcon,
  AttachMoney as MoneyIcon,
  Route as RouteIcon,
  Description as DocumentIcon,
  Engineering as EngineeringIcon
} from '@mui/icons-material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentsUsed?: string[]
  tokensUsed?: number
  executionTimeMs?: number
}

interface Agent {
  id: string
  name: string
  role: string
  capabilities: string[]
  status?: 'active' | 'idle'
}

interface Workflow {
  id: string
  name: string
  description: string
  requiredParameters: string[]
  steps: string[]
  estimatedDuration: string
}

interface WorkflowExecution {
  workflowId: string
  status: 'running' | 'completed' | 'error'
  progress: number
  currentStep?: string
  result?: any
  error?: string
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [workflowParams, setWorkflowParams] = useState<Record<string, string>>({})
  const [workflowExecution, setWorkflowExecution] = useState<WorkflowExecution | null>(null)
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Helper function to get auth token
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('token')
    return { Authorization: `Bearer ${token}` }
  }, [])

  // Fetch agents using TanStack Query
  const { data: agents = [], isLoading: agentsLoading, error: agentsError } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await axios.get('/api/langchain/agents', {
        headers: getAuthHeader()
      })
      return response.data.agents
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Fetch workflows using TanStack Query
  const { data: workflows = [], isLoading: workflowsLoading, error: workflowsError } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await axios.get('/api/langchain/workflows', {
        headers: getAuthHeader()
      })
      return response.data.workflows
    },
    staleTime: 5 * 60 * 1000
  })

  // Fetch MCP servers using TanStack Query
  const { data: mcpServers = [], isLoading: mcpLoading, error: mcpError } = useQuery({
    queryKey: ['mcpServers'],
    queryFn: async () => {
      const response = await axios.get('/api/langchain/mcp/servers', {
        headers: getAuthHeader()
      })
      return response.data.servers
    },
    staleTime: 5 * 60 * 1000
  })

  // Update error state if any query fails
  useEffect(() => {
    const errors = [agentsError, workflowsError, mcpError].filter(Boolean)
    if (errors.length > 0) {
      const errorMessages = errors.map(e => (e as any)?.message || 'Failed to load data').join(', ')
      setDataLoadError(errorMessages)
    } else {
      setDataLoadError(null)
    }
  }, [agentsError, workflowsError, mcpError])

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your Fleet Management AI Assistant. I can help you with:

• Vehicle maintenance planning and scheduling
• Incident investigation and safety analysis
• Route optimization and dispatch planning
• Cost analysis and budget optimization
• Document search and compliance

You can chat with me naturally, or run structured workflows for complex tasks. How can I assist you today?`,
      timestamp: new Date()
    }])
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const response = await axios.post(
        '/api/langchain/chat',
        {
          message: inputMessage,
          sessionId
        },
        {
          headers: getAuthHeader()
        }
      )

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        agentsUsed: response.data.agentsUsed,
        tokensUsed: response.data.tokensUsed,
        executionTimeMs: response.data.executionTimeMs
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.response?.data?.error || error.message || 'Unknown error occurred'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = async () => {
    try {
      await axios.delete(`/api/langchain/sessions/${sessionId}`, {
        headers: getAuthHeader()
      })
      setMessages([])
      // Optionally refetch initial message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your Fleet Management AI Assistant. I can help you with:

• Vehicle maintenance planning and scheduling
• Incident investigation and safety analysis
• Route optimization and dispatch planning
• Cost analysis and budget optimization
• Document search and compliance

You can chat with me naturally, or run structured workflows for complex tasks. How can I assist you today?`,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Failed to clear session:', error)
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Failed to clear chat session. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const openWorkflowDialog = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setWorkflowParams({})
    setWorkflowDialogOpen(true)
  }

  const executeWorkflow = async () => {
    if (!selectedWorkflow) return

    setWorkflowDialogOpen(false)
    setWorkflowExecution({
      workflowId: selectedWorkflow.id,
      status: 'running',
      progress: 0
    })

    try {
      const response = await axios.post(
        '/api/langchain/execute',
        {
          workflowType: selectedWorkflow.id,
          parameters: workflowParams,
          sessionId
        },
        {
          headers: getAuthHeader()
        }
      )

      const result = response.data.result

      setWorkflowExecution({
        workflowId: selectedWorkflow.id,
        status: 'completed',
        progress: 100,
        result
      })

      // Add result to chat
      const resultMessage: Message = {
        id: `msg-${Date.now()}-workflow`,
        role: 'assistant',
        content: `Workflow "${selectedWorkflow.name}" completed successfully!\n\n${formatWorkflowResult(result)}`,
        timestamp: new Date(),
        tokensUsed: result.totalTokens,
        executionTimeMs: result.executionTimeMs
      }
      setMessages(prev => [...prev, resultMessage])
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error occurred'

      setWorkflowExecution({
        workflowId: selectedWorkflow.id,
        status: 'error',
        progress: 0,
        error: errorMsg
      })

      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Workflow execution failed: ${errorMsg}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      console.error('Workflow execution error:', error)
    }
  }

  const formatWorkflowResult = (result: any): string => {
    if (!result.finalResult) return 'No results available'

    const lines: string[] = []
    lines.push(`✓ Completed in ${result.executionTimeMs}ms`)
    lines.push(`✓ ${result.steps.length} steps executed`)
    lines.push(`✓ ${result.totalTokens} tokens used`)
    lines.push('')
    lines.push('**Key Results:**')

    if (result.finalResult) {
      Object.keys(result.finalResult).forEach(key => {
        lines.push(`• ${key}: Available`)
      })
    }

    return lines.join('\n')
  }

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'maintenance': return <BuildIcon />
      case 'safety': return <SecurityIcon />
      case 'cost': return <MoneyIcon />
      case 'route': return <RouteIcon />
      case 'document': return <DocumentIcon />
      default: return <EngineeringIcon />
    }
  }

  const getServerHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success'
      case 'degraded': return 'warning'
      case 'down': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Assistant
      </Typography>

      {/* Data Load Error Alert */}
      {dataLoadError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setDataLoadError(null)}>
          Failed to load some data: {dataLoadError}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ flexGrow: 1, height: 0 }}>
        {/* Main Chat Area */}
        <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Chat" />
              <Tab label="Workflows" />
            </Tabs>

            {/* Chat Tab */}
            {activeTab === 0 && (
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: 0 }}>
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                        mb: 2
                      }}
                    >
                      <Box sx={{ maxWidth: '80%', display: 'flex', gap: 1 }}>
                        {message.role === 'assistant' && (
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <BotIcon />
                          </Avatar>
                        )}
                        <Box>
                          <Paper
                            sx={{
                              p: 2,
                              bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                              color: message.role === 'user' ? 'white' : 'text.primary'
                            }}
                          >
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                              {message.content}
                            </Typography>
                          </Paper>
                          {message.agentsUsed && message.agentsUsed.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {message.agentsUsed.map(agent => (
                                <Chip
                                  key={agent}
                                  label={agent}
                                  size="small"
                                  icon={getAgentIcon(agent)}
                                />
                              ))}
                            </Box>
                          )}
                          {(message.tokensUsed || message.executionTimeMs) && (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                              {message.tokensUsed && (
                                <Chip label={`${message.tokensUsed} tokens`} size="small" variant="outlined" />
                              )}
                              {message.executionTimeMs && (
                                <Chip label={`${message.executionTimeMs}ms`} size="small" variant="outlined" />
                              )}
                            </Box>
                          )}
                        </Box>
                        {message.role === 'user' && (
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <PersonIcon />
                          </Avatar>
                        )}
                      </Box>
                    </Box>
                  ))}
                  {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <BotIcon />
                      </Avatar>
                      <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                          Thinking...
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                <Divider />

                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Ask me anything about fleet management..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                    />
                    <IconButton
                      color="primary"
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || loading}
                    >
                      <SendIcon />
                    </IconButton>
                    <IconButton onClick={clearChat}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Workflows Tab */}
            {activeTab === 1 && (
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Available Workflows
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Execute pre-built AI workflows for common fleet management tasks
                </Typography>

                <Grid container spacing={2}>
                  {workflows.map((workflow) => (
                    <Grid item xs={12} sm={6} key={workflow.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {workflow.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {workflow.description}
                          </Typography>
                          <Chip
                            icon={<SpeedIcon />}
                            label={workflow.estimatedDuration}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Steps:
                            </Typography>
                            <List dense>
                              {workflow.steps.map((step, idx) => (
                                <ListItem key={idx}>
                                  <ListItemText
                                    primary={step}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                          <Button
                            variant="contained"
                            startIcon={<PlayIcon />}
                            onClick={() => openWorkflowDialog(workflow)}
                            fullWidth
                          >
                            Execute Workflow
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {workflowExecution && (
                  <Box sx={{ mt: 3 }}>
                    <Alert
                      severity={
                        workflowExecution.status === 'completed'
                          ? 'success'
                          : workflowExecution.status === 'error'
                          ? 'error'
                          : 'info'
                      }
                    >
                      <Typography variant="body2">
                        {workflowExecution.status === 'running' && 'Workflow executing...'}
                        {workflowExecution.status === 'completed' && 'Workflow completed successfully!'}
                        {workflowExecution.status === 'error' && `Error: ${workflowExecution.error}`}
                      </Typography>
                      {workflowExecution.status === 'running' && (
                        <LinearProgress sx={{ mt: 1 }} />
                      )}
                    </Alert>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4} sx={{ height: '100%', overflow: 'auto' }}>
          {/* AI Agents */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              AI Agents
            </Typography>
            {agentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : agents.length > 0 ? (
              <List>
                {agents.map((agent) => (
                  <ListItem key={agent.id}>
                    <ListItemIcon>{getAgentIcon(agent.id)}</ListItemIcon>
                    <ListItemText
                      primary={agent.name}
                      secondary={agent.role}
                    />
                    <Chip label="Ready" size="small" color="success" />
                  </ListItem>
                ))}
              </List>
            ) : (
              <ListItem>
                <ListItemText
                  primary="No agents loaded"
                  secondary={agentsError ? 'Error loading agents' : 'Agents will appear when available'}
                />
              </ListItem>
            )}
          </Paper>

          {/* MCP Server Status */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              MCP Server Status
            </Typography>
            {mcpLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : mcpServers.length > 0 ? (
              <List>
                {mcpServers.map((server) => (
                  <ListItem key={server.serverId}>
                    <ListItemText
                      primary={server.serverName}
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            Response: {server.responseTime}ms
                          </Typography>
                          <Typography variant="caption" display="block">
                            Success Rate: {server.successRate.toFixed(1)}%
                          </Typography>
                        </>
                      }
                    />
                    <Chip
                      label={server.status}
                      size="small"
                      color={getServerHealthColor(server.status) as any}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <ListItem>
                <ListItemText
                  primary="No MCP servers"
                  secondary={mcpError ? 'Error loading servers' : 'Servers will appear when registered'}
                />
              </ListItem>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Workflow Execution Dialog */}
      <Dialog open={workflowDialogOpen} onClose={() => setWorkflowDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Execute {selectedWorkflow?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            {selectedWorkflow?.description}
          </Typography>

          {selectedWorkflow?.requiredParameters.map((param) => (
            <TextField
              key={param}
              fullWidth
              label={param}
              value={workflowParams[param] || ''}
              onChange={(e) => setWorkflowParams({ ...workflowParams, [param]: e.target.value })}
              margin="normal"
              required
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkflowDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={executeWorkflow}
            disabled={
              !selectedWorkflow ||
              selectedWorkflow.requiredParameters.some(param => !workflowParams[param])
            }
          >
            Execute
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AIAssistant

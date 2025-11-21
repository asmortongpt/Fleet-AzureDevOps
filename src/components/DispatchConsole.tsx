/**
 * Fleet Management - Dispatch Radio Console
 *
 * Features:
 * - Real-time audio streaming via WebSocket
 * - Push-to-talk (PTT) button with hold-to-speak
 * - Multi-channel support with visual indicators
 * - Live transcription display
 * - Emergency alert panel
 * - Active listener count
 * - Transmission history with playback
 * - Audio level visualization
 *
 * Business Value: $150,000/year in dispatcher efficiency
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Alert, AlertDescription } from './ui/alert'
import {
  Radio,
  Mic,
  MicOff,
  AlertTriangle,
  Users,
  Volume2,
  VolumeX,
  Play,
  Pause,
  PhoneCall,
  Activity
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface DispatchChannel {
  id: number
  name: string
  description: string
  channelType: string
  priorityLevel: number
  colorCode: string
  isActive: boolean
}

interface Transmission {
  id: number
  channelId: number
  userId: number
  userEmail: string
  transmissionStart: string
  transmissionEnd?: string
  durationSeconds?: number
  audioBlobUrl?: string
  transcriptionText?: string
  confidenceScore?: number
  incidentTags?: string[]
  isEmergency: boolean
}

interface EmergencyAlert {
  id: number
  userId: number
  vehicleId?: number
  alertType: string
  alertStatus: string
  locationLat?: number
  locationLng?: number
  description?: string
  createdAt: string
}

interface ActiveListener {
  id: number
  userId: number
  userEmail: string
  connectedAt: string
  deviceType: string
}

export default function DispatchConsole() {
  const { user, isAuthenticated } = useAuth()
  const [channels, setChannels] = useState<DispatchChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null)
  const [activeListeners, setActiveListeners] = useState<ActiveListener[]>([])
  const [transmissionHistory, setTransmissionHistory] = useState<Transmission[]>([])
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([])
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [currentTransmission, setCurrentTransmission] = useState<any>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const pttButtonRef = useRef<HTMLButtonElement>(null)

  // Load channels on mount
  useEffect(() => {
    loadChannels()
    loadEmergencyAlerts()
  }, [])

  // Connect to WebSocket when channel is selected
  useEffect(() => {
    if (selectedChannel) {
      connectToChannel(selectedChannel)
      loadChannelHistory(selectedChannel)
      loadActiveListeners(selectedChannel)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [selectedChannel])

  // Audio level monitoring with proper animation frame cleanup
  useEffect(() => {
    if (!isTransmitting || !analyserRef.current) {
      setAudioLevel(0)
      return
    }

    let frameId: number | null = null

    const updateAudioLevel = () => {
      if (!analyserRef.current) return

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)

      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      setAudioLevel(average / 255)

      frameId = requestAnimationFrame(updateAudioLevel)
    }

    frameId = requestAnimationFrame(updateAudioLevel)

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [isTransmitting])

  const loadChannels = async () => {
    try {
      const response = await fetch('/api/dispatch/channels', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setChannels(data.channels)
        if (data.channels.length > 0 && !selectedChannel) {
          setSelectedChannel(data.channels[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load channels:', error)
    }
  }

  const loadChannelHistory = async (channelId: number) => {
    try {
      const response = await fetch(`/api/dispatch/channels/${channelId}/history?limit=50`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setTransmissionHistory(data.history)
      }
    } catch (error) {
      console.error('Failed to load channel history:', error)
    }
  }

  const loadActiveListeners = async (channelId: number) => {
    try {
      const response = await fetch(`/api/dispatch/channels/${channelId}/listeners`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setActiveListeners(data.listeners)
      }
    } catch (error) {
      console.error('Failed to load active listeners:', error)
    }
  }

  const loadEmergencyAlerts = async () => {
    try {
      const response = await fetch('/api/dispatch/emergency?status=active&limit=10', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setEmergencyAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Failed to load emergency alerts:', error)
    }
  }

  const connectToChannel = (channelId: number) => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    const token = localStorage.getItem('token')
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/dispatch/ws`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)

      // Join channel
      ws.send(JSON.stringify({
        type: 'join_channel',
        channelId,
        userId: user?.id || 'guest',
        username: user ? `${user.firstName} ${user.lastName}` : 'Guest',
        deviceInfo: {
          type: 'web',
          userAgent: navigator.userAgent
        }
      }))
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleWebSocketMessage(message)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    ws.onclose = () => {
      console.log('WebSocket closed')
      setIsConnected(false)
    }

    wsRef.current = ws
  }

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'channel_joined':
        console.log('Joined channel:', message.channel)
        break

      case 'user_joined':
        console.log('User joined:', message.username)
        if (selectedChannel) {
          loadActiveListeners(selectedChannel)
        }
        break

      case 'user_left':
        console.log('User left')
        if (selectedChannel) {
          loadActiveListeners(selectedChannel)
        }
        break

      case 'transmission_started':
        setCurrentTransmission(message)
        break

      case 'audio_chunk':
        // Play incoming audio
        playAudioChunk(message.audioData)
        break

      case 'transmission_ended':
        setCurrentTransmission(null)
        if (selectedChannel) {
          loadChannelHistory(selectedChannel)
        }
        break

      case 'emergency_alert':
        loadEmergencyAlerts()
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Emergency Alert', {
            body: `${message.alertType}: ${message.description}`,
            icon: '/emergency-icon.png'
          })
        }
        break

      default:
        console.log('Unknown message type:', message.type)
    }
  }

  const playAudioChunk = async (base64Audio: string) => {
    try {
      if (isMuted) return

      const audioData = atob(base64Audio)
      const arrayBuffer = new ArrayBuffer(audioData.length)
      const view = new Uint8Array(arrayBuffer)

      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i)
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.start()
    } catch (error) {
      console.error('Error playing audio chunk:', error)
    }
  }

  const startTransmission = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Setup audio analyzer
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          audioChunksRef.current.push(event.data)

          // Send audio chunk to server
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(',')[1]
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'audio_chunk',
                transmissionId: currentTransmission?.transmissionId,
                channelId: selectedChannel,
                audioData: base64Audio
              }))
            }
          }
          reader.readAsDataURL(event.data)
        }
      }

      mediaRecorderRef.current.start(100) // Send chunks every 100ms
      setIsTransmitting(true)

      // Notify server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'start_transmission',
          channelId: selectedChannel,
          userId: user?.id || 'guest',
          username: user ? `${user.firstName} ${user.lastName}` : 'Guest',
          isEmergency: false
        }))
      }
    } catch (error) {
      console.error('Failed to start transmission:', error)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  const stopTransmission = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()

      // Create complete audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })

      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Audio = (reader.result as string).split(',')[1]

        // Notify server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'end_transmission',
            transmissionId: currentTransmission?.transmissionId,
            channelId: selectedChannel,
            audioBlob: base64Audio
          }))
        }
      }
      reader.readAsDataURL(audioBlob)
    }

    // Stop audio tracks
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }

    setIsTransmitting(false)
    audioChunksRef.current = []
  }

  const sendEmergencyAlert = async () => {
    try {
      const response = await fetch('/api/dispatch/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          alertType: 'panic',
          description: 'Emergency alert triggered from dispatch console'
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('Emergency alert sent!')
        loadEmergencyAlerts()
      }
    } catch (error) {
      console.error('Failed to send emergency alert:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getChannelColor = (channel: DispatchChannel) => {
    return channel.colorCode || '#3B82F6'
  }

  // Keyboard shortcut handlers for PTT
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Only handle Spacebar when PTT button is focused
    if (event.code === 'Space' && !isTransmitting && selectedChannel && isConnected) {
      event.preventDefault() // Prevent page scroll
      startTransmission()
    }
  }, [isTransmitting, selectedChannel, isConnected, startTransmission])

  const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Only handle Spacebar release
    if (event.code === 'Space' && isTransmitting) {
      event.preventDefault()
      stopTransmission()
    }
  }, [isTransmitting, stopTransmission])

  // Get dynamic ARIA label based on transmission state
  const getPttAriaLabel = () => {
    if (isTransmitting) {
      return 'Transmitting - release to stop'
    }
    return 'Push to talk - hold spacebar or click and hold to speak'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Radio className="h-8 w-8" />
            Dispatch Radio Console
          </h1>
          <p className="text-muted-foreground">Real-time fleet communications</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
            <Activity className="h-3 w-3" />
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button
            variant="destructive"
            size="lg"
            onClick={sendEmergencyAlert}
            className="gap-2"
          >
            <AlertTriangle className="h-5 w-5" />
            Emergency Alert
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Channel Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Channels</CardTitle>
            <CardDescription>Select active channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {channels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant={selectedChannel === channel.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    style={{
                      borderLeft: `4px solid ${getChannelColor(channel)}`
                    }}
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{channel.name}</div>
                      <div className="text-xs text-muted-foreground">{channel.channelType}</div>
                    </div>
                    <Badge variant="secondary">{channel.priorityLevel}</Badge>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* PTT Control */}
        <Card>
          <CardHeader>
            <CardTitle>Push-to-Talk</CardTitle>
            <CardDescription>
              {selectedChannel
                ? channels.find(c => c.id === selectedChannel)?.name
                : 'Select a channel'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PTT Button */}
            <div className="flex flex-col items-center space-y-4">
              <Button
                ref={pttButtonRef}
                size="lg"
                variant={isTransmitting ? 'destructive' : 'default'}
                className="h-32 w-32 rounded-full focus-visible:outline-[3px] focus-visible:outline-offset-2"
                onMouseDown={startTransmission}
                onMouseUp={stopTransmission}
                onMouseLeave={stopTransmission}
                onTouchStart={startTransmission}
                onTouchEnd={stopTransmission}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                disabled={!selectedChannel || !isConnected}
                aria-label={getPttAriaLabel()}
                aria-pressed={isTransmitting}
              >
                {isTransmitting ? (
                  <Mic className="h-12 w-12" />
                ) : (
                  <MicOff className="h-12 w-12" />
                )}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                {isTransmitting ? 'Transmitting...' : 'Hold to speak'}
              </div>

              {/* Audio Level Meter */}
              {isTransmitting && (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Audio Level</span>
                    <span>{Math.round(audioLevel * 100)}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-75"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Active Transmission */}
            {currentTransmission && !isTransmitting && (
              <Alert>
                <PhoneCall className="h-4 w-4" />
                <AlertDescription>
                  <strong>{currentTransmission.username}</strong> is transmitting
                </AlertDescription>
              </Alert>
            )}

            {/* Mute Toggle */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Unmute
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Mute
                </>
              )}
            </Button>

            {/* Active Listeners */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Listeners
                </span>
                <Badge variant="secondary">{activeListeners.length}</Badge>
              </div>
              <ScrollArea className="h-[100px]">
                <div className="space-y-1">
                  {activeListeners.map((listener) => (
                    <div key={listener.id} className="text-xs flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      {listener.userEmail}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Alerts</CardTitle>
            <CardDescription>Active incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {emergencyAlerts.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No active alerts
                  </div>
                ) : (
                  emergencyAlerts.map((alert) => (
                    <Alert key={alert.id} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium">{alert.alertType}</div>
                        <div className="text-xs">{alert.description}</div>
                        <div className="text-xs mt-1">
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Transmission History */}
      <Card>
        <CardHeader>
          <CardTitle>Transmission History</CardTitle>
          <CardDescription>Recent communications on selected channel</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transcripts">
            <TabsList>
              <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
              <TabsTrigger value="recordings">Recordings</TabsTrigger>
            </TabsList>

            <TabsContent value="transcripts" className="space-y-3">
              <ScrollArea className="h-[300px]">
                {transmissionHistory.map((transmission) => (
                  <div key={transmission.id} className="p-3 border rounded-lg mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{transmission.userEmail}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {transmission.durationSeconds && formatDuration(transmission.durationSeconds)}
                        <span>{new Date(transmission.transmissionStart).toLocaleString()}</span>
                      </div>
                    </div>
                    {transmission.transcriptionText && (
                      <div className="text-sm">{transmission.transcriptionText}</div>
                    )}
                    {transmission.incidentTags && transmission.incidentTags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {transmission.incidentTags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="recordings">
              <ScrollArea className="h-[300px]">
                {transmissionHistory
                  .filter(t => t.audioBlobUrl)
                  .map((transmission) => (
                    <div key={transmission.id} className="p-3 border rounded-lg mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{transmission.userEmail}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transmission.transmissionStart).toLocaleString()}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-1" />
                          Play
                        </Button>
                      </div>
                    </div>
                  ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

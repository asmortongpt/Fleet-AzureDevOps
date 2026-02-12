/**
 * Radio Popover - Compact Radio Communications Menu
 *
 * A compact, non-intrusive radio console that appears as a popover menu item
 * instead of taking over the full screen.
 *
 * Features:
 * - Quick access push-to-talk button
 * - Live transmission feed
 * - Emergency alerts notification
 * - Channel selector
 * - Compact transcript view
 * - Link to full Dispatch Console for detailed view
 */

import {
  Radio,
  Mic,
  MicOff,
  AlertTriangle,
  Volume2,
  ExternalLink,
  Circle
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDispatchSocket } from '@/hooks/useDispatchSocket'

interface RadioPopoverProps {
  className?: string
}

export function RadioPopover({ className }: RadioPopoverProps) {
  const navigate = useNavigate()
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false)
  const dispatch = useDispatchSocket()

  const recentTransmissions = useMemo(() => {
    return dispatch.recentTransmissions.map((t: any) => ({
      id: t.id,
      user: t.username || t.userId,
      message: t.isEmergency ? 'Emergency transmission' : 'Transmission received',
      time: t.startedAt,
      isEmergency: t.isEmergency
    }))
  }, [dispatch.recentTransmissions])

  const emergencyCount: number = recentTransmissions.filter((t: any) => t.isEmergency).length

  const handlePTT = (): void => {
    setIsTransmitting(true)
  }

  const openFullConsole = (): void => {
    navigate('/hubs/operations?module=dispatch')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`relative ${className ?? ''}`}
          size="sm"
        >
          <Radio className="w-4 h-4 mr-2" />
          Radio
          {emergencyCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
            >
              {emergencyCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-3 h-3" />
              <h3 className="font-semibold">Radio Console</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={openFullConsole}
              className="h-7"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Full View
            </Button>
          </div>

          {/* Channel Info */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Channel</label>
            <div className="flex items-center gap-2 text-sm">
              <Circle className={`w-2 h-2 ${dispatch.isConnected ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
              <span>{dispatch.currentChannel?.name || 'No channel connected'}</span>
            </div>
          </div>

          {/* PTT Button */}
          <Button
            className={`w-full h-9 ${isTransmitting ? 'bg-red-600 hover:bg-red-700' : ''}`}
            onMouseDown={handlePTT}
            onMouseUp={() => setIsTransmitting(false)}
            onMouseLeave={() => setIsTransmitting(false)}
          >
            {isTransmitting ? (
              <>
                <Mic className="w-3 h-3 mr-2 animate-pulse" />
                Transmitting...
              </>
            ) : (
              <>
                <MicOff className="w-3 h-3 mr-2" />
                Hold to Talk
              </>
            )}
          </Button>

          {/* Emergency Alerts */}
          {emergencyCount > 0 && (
            <div className="p-2 bg-destructive/10 border border-destructive/50 rounded-md">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {emergencyCount} Emergency Alert{emergencyCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Recent Transmissions */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Recent Transmissions</label>
            <ScrollArea className="h-48 w-full rounded-md border p-2">
              <div className="space-y-2">
                {recentTransmissions.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No transmissions available.</div>
                ) : (
                  recentTransmissions.map((transmission: any) => (
                    <div
                      key={transmission.id}
                      className={`p-2 rounded-md text-sm ${
                        transmission.isEmergency
                          ? 'bg-destructive/10 border border-destructive/50'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{transmission.user}</span>
                        <span className="text-xs text-muted-foreground">{transmission.time}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {transmission.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="flex-1">
              <Volume2 className="w-3 h-3 mr-1" />
              Audio
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Alerts
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

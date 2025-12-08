/**
 * AI Insights Panel
 * Displays AI-powered predictions, recommendations, and alerts
 */

import {
  Lightbulb,
  Warning,
  TrendUp,
  Bell,
  X,
  Sparkle,
  CheckCircle
} from "@phosphor-icons/react"
import React from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AIInsight } from '@/hooks/useSystemStatus'

interface AIInsightsPanelProps {
  insights: AIInsight[]
  onDismiss: (insightId: string) => void
}

export function AIInsightsPanel({ insights, onDismiss }: AIInsightsPanelProps) {
  const getInsightIcon = (type: AIInsight['type']) => {
    const iconClass = "w-4 h-4"
    switch (type) {
      case 'prediction':
        return <Sparkle className={iconClass} weight="fill" />
      case 'recommendation':
        return <Lightbulb className={iconClass} />
      case 'alert':
        return <Warning className={iconClass} weight="fill" />
      case 'optimization':
        return <TrendUp className={iconClass} />
      default:
        return <Bell className={iconClass} />
    }
  }

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
      case 'high':
        return 'border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
      case 'medium':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
      case 'low':
        return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
    }
  }

  const getPriorityBadgeColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    }
  }

  const getTypeColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'prediction':
        return 'text-purple-600 dark:text-purple-400'
      case 'recommendation':
        return 'text-blue-600 dark:text-blue-400'
      case 'alert':
        return 'text-red-600 dark:text-red-400'
      case 'optimization':
        return 'text-green-600 dark:text-green-400'
    }
  }

  // Sort by priority (critical first) and timestamp (newest first)
  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return b.timestamp.getTime() - a.timestamp.getTime()
  })

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="px-4 py-3 border-b border-border/50 bg-muted/30">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkle className="w-4 h-4 text-primary" weight="fill" />
          AI Insights & Predictions
          {insights.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {insights.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-3">
        {sortedInsights.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" weight="fill" />
            <p className="text-xs text-muted-foreground">
              No active insights
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              AI is monitoring your fleet
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {sortedInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-3 rounded-lg transition-all duration-200 hover:shadow-sm ${getPriorityColor(
                  insight.priority
                )}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className={getTypeColor(insight.type)}>
                      {getInsightIcon(insight.type)}
                    </span>
                    <span className="text-xs font-semibold truncate">
                      {insight.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge className={`${getPriorityBadgeColor(insight.priority)} h-4 px-1.5 text-[9px]`}>
                      {insight.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-muted"
                      onClick={() => onDismiss(insight.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-[11px] text-foreground/90 mb-2 leading-relaxed">
                  {insight.message}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">
                      {insight.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {insight.actionable && (
                    <Button variant="link" size="sm" className="h-5 text-[10px] p-0">
                      Take Action →
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AIInsightsPanel

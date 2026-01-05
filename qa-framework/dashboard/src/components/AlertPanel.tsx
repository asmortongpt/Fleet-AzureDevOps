import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'

import { Alert } from '../hooks/useWebSocket'

interface AlertPanelProps {
  alerts: Alert[]
  fullPage?: boolean
}

export function AlertPanel({ alerts, fullPage = false }: AlertPanelProps) {
  const getAlertIcon = (level: Alert['level']) => {
    switch (level) {
      case 'info':
        return InformationCircleIcon
      case 'warning':
        return ExclamationTriangleIcon
      case 'error':
        return XCircleIcon
      case 'success':
        return CheckCircleIcon
    }
  }

  const getAlertColor = (level: Alert['level']) => {
    switch (level) {
      case 'info':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'success':
        return 'text-green-400 bg-green-500/10 border-green-500/20'
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h2 className="text-xl font-bold mb-6">
        {fullPage ? 'All Alerts' : 'Recent Alerts'}
      </h2>

      <div className={clsx('space-y-3', fullPage ? 'max-h-none' : 'max-h-96 overflow-y-auto')}>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No alerts to display
          </div>
        ) : (
          alerts.map((alert, index) => {
            const AlertIcon = getAlertIcon(alert.level)

            return (
              <div
                key={`${alert.timestamp}-${index}`}
                className={clsx(
                  'rounded-lg p-4 border transition-all hover:scale-[1.01]',
                  getAlertColor(alert.level)
                )}
              >
                <div className="flex items-start space-x-3">
                  <AlertIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white break-words">{alert.message}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-75">
                      <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>

                      {alert.agentId && (
                        <span className="font-mono">Agent: {alert.agentId}</span>
                      )}

                      {alert.taskId && (
                        <span className="font-mono">Task: {alert.taskId}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

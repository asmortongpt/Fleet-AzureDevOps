import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

interface HeaderProps {
  connected: boolean
}

export function Header({ connected }: HeaderProps) {
  return (
    <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              QA Agent Monitoring
            </div>
            <div className="text-sm text-slate-400">
              30-Agent Distributed System
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {connected ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-400">Connected</span>
              </>
            ) : (
              <>
                <XCircleIcon className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-400">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

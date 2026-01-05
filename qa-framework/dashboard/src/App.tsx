import { useState } from 'react'

import { AgentGrid } from './components/AgentGrid'
import { AlertPanel } from './components/AlertPanel'
import { AnalysisReport } from './components/AnalysisReport'
import { Header } from './components/Header'
import { MetricsPanel } from './components/MetricsPanel'
import { TaskQueue } from './components/TaskQueue'
import { useWebSocket } from './hooks/useWebSocket'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'

function App() {
  const { agents, metrics, tasks, alerts, analysisReport, connected } = useWebSocket(WS_URL)
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'tasks' | 'alerts'>('overview')

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header connected={connected} />

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-slate-700">
          <nav className="flex space-x-8">
            {(['overview', 'agents', 'tasks', 'alerts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {metrics && <MetricsPanel metrics={metrics} />}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentGrid agents={Array.from(agents.values())} />
              <AlertPanel alerts={alerts.slice(0, 10)} />
            </div>
            {analysisReport && <AnalysisReport report={analysisReport} />}
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <AgentGrid agents={Array.from(agents.values())} detailed />
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <TaskQueue tasks={tasks} />
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <AlertPanel alerts={alerts} fullPage />
          </div>
        )}
      </main>
    </div>
  )
}

export default App

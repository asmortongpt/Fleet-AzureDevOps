import React from 'react';
import { X, ChevronRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DrilldownLevel {
  id: string;
  title: string;
  component: React.ReactNode;
  breadcrumb?: string;
}

interface DrilldownPanelProps {
  levels: DrilldownLevel[];
  onClose: () => void;
  onNavigateToLevel: (levelIndex: number) => void;
  className?: string;
}

export function DrilldownPanel({ levels, onClose, onNavigateToLevel, className = '' }: DrilldownPanelProps) {
  const currentLevel = levels[levels.length - 1];
  const showBreadcrumbs = levels.length > 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col backdrop-blur-2xl bg-slate-900/98 border-2 border-slate-700/60 rounded-2xl shadow-2xl ${className}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header with Breadcrumbs */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-slate-700/60 bg-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {showBreadcrumbs && (
                  <nav className="flex items-center gap-2 text-sm overflow-x-auto">
                    <button
                      onClick={() => onNavigateToLevel(0)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap"
                    >
                      <Home className="w-4 h-4" />
                      Home
                    </button>

                    {levels.map((level, index) => (
                      <React.Fragment key={level.id}>
                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        <button
                          onClick={() => onNavigateToLevel(index)}
                          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                            index === levels.length - 1
                              ? 'bg-blue-600 text-white font-medium'
                              : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {level.breadcrumb || level.title}
                        </button>
                      </React.Fragment>
                    ))}
                  </nav>
                )}

                {!showBreadcrumbs && (
                  <h2 className="text-2xl font-bold text-slate-100">{currentLevel.title}</h2>
                )}
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-all ml-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLevel.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {currentLevel.component}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-700/60 bg-slate-800/40">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <div>Level {levels.length} of drilldown</div>
              <div className="flex gap-2">
                {levels.length > 1 && (
                  <button
                    onClick={() => onNavigateToLevel(levels.length - 2)}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg transition-all"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

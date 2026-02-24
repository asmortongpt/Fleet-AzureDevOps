// motion removed - React 19 incompatible
import { X, ChevronRight, Home } from 'lucide-react';
import React from 'react';

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
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2"
        onClick={onClose}
      >
        <div
          className={`w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col backdrop-blur-2xl bg-[#111]/98 border-2 border-white/[0.08] rounded-lg shadow-sm ${className}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header with Breadcrumbs */}
          <div className="flex-shrink-0 px-3 py-2 border-b border-white/[0.08] bg-[#1a1a1a]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {showBreadcrumbs && (
                  <nav className="flex items-center gap-2 text-sm overflow-x-auto">
                    <button
                      onClick={() => onNavigateToLevel(0)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/90 transition-colors whitespace-nowrap"
                    >
                      <Home className="w-4 h-4" />
                      Home
                    </button>

                    {levels.map((level, index) => (
                      <React.Fragment key={level.id}>
                        <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />
                        <button
                          onClick={() => onNavigateToLevel(index)}
                          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                            index === levels.length - 1
                              ? 'bg-emerald-600 text-white font-medium'
                              : 'hover:bg-white/[0.06] text-white/40 hover:text-white/90'
                          }`}
                        >
                          {level.breadcrumb || level.title}
                        </button>
                      </React.Fragment>
                    ))}
                  </nav>
                )}

                {!showBreadcrumbs && (
                  <h2 className="text-sm font-bold text-white/90">{currentLevel.title}</h2>
                )}
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-white/[0.06] rounded-lg text-white/40 hover:text-white/90 transition-all ml-2"
                aria-label="Close drilldown panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-3">
              <div
                key={currentLevel.id}
                className="h-full"
              >
                {currentLevel.component}
              </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-3 py-2 border-t border-white/[0.08] bg-[#1a1a1a]/40">
            <div className="flex items-center justify-between text-sm text-white/40">
              <div>Level {levels.length} of drilldown</div>
              <div className="flex gap-2">
                {levels.length > 1 && (
                  <button
                    onClick={() => onNavigateToLevel(levels.length - 2)}
                    className="px-2 py-2 bg-white/[0.06] hover:bg-white/[0.08] text-white/90 rounded-lg transition-all"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

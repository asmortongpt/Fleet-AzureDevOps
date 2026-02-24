/**
 * SplitView Component
 *
 * A split-panel layout for operations pages with a list on the left
 * and detail view on the right.
 */

import { X } from '@phosphor-icons/react';
import React from 'react';

// motion removed - React 19 incompatible
import { cn } from '@/lib/utils';

export interface ListPanelProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  actions?: React.ReactNode;
}

export interface DetailPanelProps {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
}

export interface SplitViewProps {
  theme?: 'operations' | 'default';
  listPanel: ListPanelProps;
  detailPanel?: DetailPanelProps | null;
}

export function SplitView({ theme = 'default', listPanel, detailPanel }: SplitViewProps) {
  const isOperationsTheme = theme === 'operations';

  return (
    <div className="flex h-full bg-[#111]">
      {/* List Panel */}
      <div
        className={cn(
          'flex flex-col border-r border-white/[0.08] transition-all duration-300',
          detailPanel ? 'w-1/2 lg:w-2/5' : 'w-full'
        )}
      >
        {/* List Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#1a1a1a]/50">
          <div className="flex items-center gap-3">
            {listPanel.icon && (
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isOperationsTheme
                  ? 'bg-gradient-to-br from-cyan-400/20 to-emerald-500/20 border border-cyan-400/30'
                  : 'bg-white/[0.15]'
              )}>
                <span className={isOperationsTheme ? 'text-cyan-400' : 'text-white/60'}>
                  {listPanel.icon}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-white">{listPanel.title}</h2>
              {listPanel.description && (
                <p className="text-sm text-white/70">{listPanel.description}</p>
              )}
            </div>
          </div>
          {listPanel.actions && (
            <div className="flex items-center gap-2">
              {listPanel.actions}
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-hidden">
          {listPanel.content}
        </div>
      </div>

      {/* Detail Panel */}
        {detailPanel && (
          <div
            className="flex-1 flex flex-col bg-[#111]/50"
          >
            {/* Detail Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#1a1a1a]/30">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-white truncate">{detailPanel.title}</h3>
                {detailPanel.subtitle && (
                  <p className="text-sm text-white/70 truncate">{detailPanel.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {detailPanel.actions}
                <button
                  onClick={detailPanel.onClose}
                  className="p-2 rounded-lg hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
                  aria-label="Close detail panel"
                >
                  <X className="w-5 h-5" weight="bold" />
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {detailPanel.content}
            </div>
          </div>
        )}
    </div>
  );
}

export default SplitView;

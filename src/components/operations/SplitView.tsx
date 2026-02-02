/**
 * SplitView Component
 *
 * A split-panel layout for operations pages with a list on the left
 * and detail view on the right.
 */

import React from 'react';
import { X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="flex h-full bg-slate-900">
      {/* List Panel */}
      <div
        className={cn(
          'flex flex-col border-r border-slate-700/50 transition-all duration-300',
          detailPanel ? 'w-1/2 lg:w-2/5' : 'w-full'
        )}
      >
        {/* List Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-3">
            {listPanel.icon && (
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isOperationsTheme
                  ? 'bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30'
                  : 'bg-slate-700'
              )}>
                <span className={isOperationsTheme ? 'text-cyan-400' : 'text-slate-300'}>
                  {listPanel.icon}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-white">{listPanel.title}</h2>
              {listPanel.description && (
                <p className="text-sm text-slate-700">{listPanel.description}</p>
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
      <AnimatePresence mode="wait">
        {detailPanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col bg-slate-900/50"
          >
            {/* Detail Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/30">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-white truncate">{detailPanel.title}</h3>
                {detailPanel.subtitle && (
                  <p className="text-sm text-slate-700 truncate">{detailPanel.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {detailPanel.actions}
                <button
                  onClick={detailPanel.onClose}
                  className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-700 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" weight="bold" />
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {detailPanel.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SplitView;

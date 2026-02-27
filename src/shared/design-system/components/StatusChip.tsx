import React from 'react';

import { Status } from '../types';

const colorMap: Record<Status,string> = {
  good: 'var(--good)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  info: 'var(--accent)'
};

/**
 * StatusChip Component
 *
 * Consistent status indicator used throughout the application.
 * Provides color-coded visual feedback with optional custom label.
 *
 * Features:
 * - Semantic color coding (good/warn/bad/info)
 * - Pill-shaped design
 * - Optional custom label
 * - Subtle glassmorphic background
 */
export const StatusChip: React.FC<{status: Status; label?: string}> = ({status, label}) => (
  <span style={{
    display:'inline-flex',
    alignItems:'center',
    gap:8,
    padding:'6px 10px',
    borderRadius:999,
    border:'1px solid var(--border)',
    background:'hsl(var(--muted) / 0.2)',
    color: colorMap[status],
    fontSize:12
  }}>
    ● {label ?? status.toUpperCase()}
  </span>
);

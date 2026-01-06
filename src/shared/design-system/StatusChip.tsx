import React from 'react';
import { Status } from './types';

const colorMap: Record<Status,string> = {
  good: 'var(--good)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  info: 'var(--accent)'
};

export const StatusChip: React.FC<{status: Status; label?: string}> = ({status, label}) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'6px 10px', borderRadius:999,
    border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)',
    color: colorMap[status], fontSize:12
  }}>
    ● {label ?? status.toUpperCase()}
  </span>
);

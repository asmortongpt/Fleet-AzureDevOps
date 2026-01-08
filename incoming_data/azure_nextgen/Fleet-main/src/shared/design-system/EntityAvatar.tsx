import React from 'react';

import { EntityRef } from './types';

function ringColor(status: EntityRef['status']) {
  if (status === 'good') return 'var(--good)';
  if (status === 'warn') return 'var(--warn)';
  if (status === 'bad') return 'var(--bad)';
  return 'var(--accent)';
}

export const EntityAvatar: React.FC<{entity: EntityRef; size?: number}> = ({ entity, size = 38 }) => {
  const initials = entity.displayName.split(' ').slice(0,2).map(s=>s[0]).join('').toUpperCase();
  const ring = ringColor(entity.status);
  return (
    <div style={{
      width: size, height: size, borderRadius: 16, padding: 2,
      background: `conic-gradient(from 180deg, ${ring}, rgba(255,255,255,0.10))`
    }}>
      <div style={{
        width:'100%', height:'100%', borderRadius: 14,
        border:'1px solid var(--border)', background:'rgba(0,0,0,0.22)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontWeight: 900
      }}>
        {entity.imageUrl ? <img src={entity.imageUrl} alt={entity.displayName} style={{width:'100%',height:'100%',borderRadius:14,objectFit:'cover'}}/> : initials}
      </div>
    </div>
  );
};

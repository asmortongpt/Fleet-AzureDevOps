import React from 'react';

import { StatusChip } from './StatusChip';
import { RecordRow } from './types';

export const RowExpandPanel: React.FC<{
  anomalies: {status:'good'|'warn'|'bad'|'info'; label:string}[];
  records: Pick<RecordRow,'id'|'summary'|'timestamp'|'severity'>[];
  onOpenRecord?: (id:string)=>void;
}> = ({ anomalies, records, onOpenRecord }) => {
  return (
    <div style={{
      padding: 12, borderRadius: 16,
      border:'1px solid hsl(var(--border) / 0.2)',
      background:'hsl(var(--foreground) / 0.18)'
    }}>
      <div style={{display:'grid', gridTemplateColumns:'1.2fr .8fr', gap:12}}>
        <div style={{border:'1px solid hsl(var(--border) / 0.2)', borderRadius:16, padding:12, background:'hsl(var(--muted) / 0.2)'}}>
          <div style={{fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Telemetry Drilldown</div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:10}}>
            {anomalies.map((a)=><StatusChip key={a.label} status={a.status} label={a.label}/>)}
          </div>
          <div style={{height:54, borderRadius:16, border:'1px dashed hsl(var(--border) / 0.18)', background:'linear-gradient(180deg, hsl(var(--primary) / 0.1), hsl(var(--muted) / 0.2))'}}/>
          <div style={{marginTop:10, color:'var(--muted)', fontSize:12}}>Click points to open sub-records (wire later).</div>
        </div>

        <div style={{border:'1px solid hsl(var(--border) / 0.2)', borderRadius:16, padding:12, background:'hsl(var(--muted) / 0.2)'}}>
          <div style={{fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Recent Records</div>
          <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, border:'1px solid hsl(var(--border) / 0.15)', borderRadius:14, overflow:'hidden'}}>
            <thead>
              <tr>
                <th style={{padding:10, fontSize:12, color:'var(--muted)', textAlign:'left', background:'hsl(var(--muted) / 0.1)'}}>Event</th>
                <th style={{padding:10, fontSize:12, color:'var(--muted)', textAlign:'left', background:'hsl(var(--muted) / 0.1)'}}>Severity</th>
                <th style={{padding:10, fontSize:12, color:'var(--muted)', textAlign:'left', background:'hsl(var(--muted) / 0.1)'}}>When</th>
                <th style={{padding:10, fontSize:12, color:'var(--muted)', textAlign:'left', background:'hsl(var(--muted) / 0.1)'}}></th>
              </tr>
            </thead>
            <tbody>
              {records.map(r=>(
                <tr key={r.id}>
                  <td style={{padding:10, fontSize:12, borderBottom:'1px solid hsl(var(--border) / 0.15)'}}>{r.summary}</td>
                  <td style={{padding:10, fontSize:12, borderBottom:'1px solid hsl(var(--border) / 0.15)'}}><StatusChip status={r.severity} /></td>
                  <td style={{padding:10, fontSize:12, color:'var(--muted)', borderBottom:'1px solid hsl(var(--border) / 0.15)'}}>{r.timestamp}</td>
                  <td style={{padding:10, fontSize:12, borderBottom:'1px solid hsl(var(--border) / 0.15)'}}>
                    <button onClick={()=>onOpenRecord?.(r.id)} style={{padding:'8px 10px', borderRadius:12, border:'1px solid var(--border)', background:'hsl(var(--primary) / 0.15)', color:'var(--text)', cursor:'pointer'}}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

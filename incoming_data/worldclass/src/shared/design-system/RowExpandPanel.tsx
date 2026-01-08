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
      border:'1px solid rgba(255,255,255,0.08)',
      background:'rgba(0,0,0,0.18)'
    }}>
      <div style={{display:'grid', gridTemplateColumns:'1.2fr .8fr', gap:12}}>
        <div style={{border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:12, background:'rgba(255,255,255,0.03)'}}>
          <div style={{fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Telemetry Drilldown</div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:10}}>
            {anomalies.map((a,i)=><StatusChip key={i} status={a.status} label={a.label}/>)}
          </div>
          <div style={{height:54, borderRadius:16, border:'1px dashed rgba(255,255,255,0.18)', background:'linear-gradient(180deg, rgba(96,165,250,0.10), rgba(255,255,255,0.03))'}}/>
          <div style={{marginTop:10, color:'var(--muted)', fontSize:12}}>Click points to open sub-records (wire later).</div>
        </div>

        <div style={{border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:12, background:'rgba(255,255,255,0.03)'}}>
          <div style={{fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Recent Records</div>
          <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, overflow:'hidden'}}>
            <thead>
              <tr>
                <th style={{padding:10, fontSize:12, color:'var(--muted)', textAlign:'left', background:'rgba(255,255,255,0.02)'}}>Event</th>
                <th style={{padding:10, fontSize:12, color:'var(--muted)', textAlign:'left', background:'rgba(255,255,255,0.02)'}}>Severity</th>
                <th style={{padding:10, fontSize:12, color:'var(--muted)', textAlign:'left', background:'rgba(255,255,255,0.02)'}}>When</th>
                <th style={{padding:10, fontSize:12, color:'var(--muted)', textAlign:'left', background:'rgba(255,255,255,0.02)'}}></th>
              </tr>
            </thead>
            <tbody>
              {records.map(r=>(
                <tr key={r.id}>
                  <td style={{padding:10, fontSize:12, borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{r.summary}</td>
                  <td style={{padding:10, fontSize:12, borderBottom:'1px solid rgba(255,255,255,0.06)'}}><StatusChip status={r.severity} /></td>
                  <td style={{padding:10, fontSize:12, color:'var(--muted)', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{r.timestamp}</td>
                  <td style={{padding:10, fontSize:12, borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    <button onClick={()=>onOpenRecord?.(r.id)} style={{padding:'8px 10px', borderRadius:12, border:'1px solid var(--border)', background:'rgba(96,165,250,0.15)', color:'var(--text)', cursor:'pointer'}}>Open</button>
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

import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";

const RELAY_HTTP = import.meta.env.VITE_RELAY_HTTP || "http://localhost:4010";
const RELAY_WS = import.meta.env.VITE_RELAY_WS || "ws://localhost:4010/ws";
const MANAGER_HTTP = import.meta.env.VITE_MANAGER_HTTP || "http://localhost:4030";
const MOCK_HTTP = import.meta.env.VITE_MOCK_FLEET_HTTP || "http://localhost:4020";

function Chip({label, tone}) {
  const bg = tone==="good" ? "#e6ffed" : tone==="warn" ? "#fff7e6" : tone==="bad" ? "#ffe6e6" : "#f2f2f2";
  const bd = tone==="good" ? "#86efac" : tone==="warn" ? "#facc15" : tone==="bad" ? "#fca5a5" : "#ddd";
  return <span style={{padding:"2px 8px", border:`1px solid ${bd}`, background:bg, borderRadius:999, fontSize:12, marginRight:6}}>{label}</span>;
}

function Card({title, children}) {
  return <div style={{border:"1px solid #ddd", borderRadius:10, padding:12, marginBottom:12}}>
    <div style={{fontWeight:800, marginBottom:8}}>{title}</div>{children}
  </div>;
}

export default function App(){
  const [wsConnected,setWsConnected]=useState(false);
  const [relayState,setRelayState]=useState({vehicles:{},events:[]});
  const [vehicles,setVehicles]=useState([]);
  const [drivers,setDrivers]=useState([]);
  const [incidents,setIncidents]=useState([]);
  const [managerStatus,setManagerStatus]=useState({running:false});
  const [fleetStart,setFleetStart]=useState({count:100, scenario:"unauthorized_then_scan", seed:"demo", intervalSeconds:2});
  const [forward,setForward]=useState({baseUrl:MOCK_HTTP, token:""});
  const mapRef=useRef(null);
  const markersRef=useRef({});
  const mapDivRef=useRef(null);

  // WS
  useEffect(()=>{
    const ws=new WebSocket(RELAY_WS);
    ws.onopen=()=>setWsConnected(true);
    ws.onclose=()=>setWsConnected(false);
    ws.onmessage=(m)=>{
      try{
        const msg=JSON.parse(m.data);
        if(msg.kind==="state") setRelayState(msg.state);
        if(msg.kind==="event"){
          setRelayState(prev=>{
            const next={...prev, events:[...prev.events, msg.event]};
            if(next.events.length>2000) next.events.shift();
            const vid=msg.event.vehicleId;
            next.vehicles={...next.vehicles};
            next.vehicles[vid]=next.vehicles[vid]||{};
            next.vehicles[vid].lastEvent=msg.event;
            if(msg.event.type==="telemetry") next.vehicles[vid].telemetry=msg.event.payload;
            if(msg.event.type==="badge_scan") next.vehicles[vid].badge=msg.event.payload;
            if(msg.event.type==="control") next.vehicles[vid].control=msg.event.payload;
            if(msg.event.type==="incident") next.vehicles[vid].incident=msg.event.payload;
            if(msg.event.type==="error") next.vehicles[vid].error=msg.event.payload;
            return next;
          });
        }
      }catch{}
    };
    return ()=>ws.close();
  },[]);

  // Map init
  useEffect(()=>{
    if(mapRef.current) return;
    const map=L.map(mapDivRef.current).setView([40.7128,-74.0060], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    mapRef.current=map;
  },[]);

  // Update markers
  useEffect(()=>{
    if(!mapRef.current) return;
    for(const [vid,v] of Object.entries(relayState.vehicles||{})){
      const gps=v.telemetry?.gps;
      if(!gps) continue;
      const key=vid;
      const latlng=[gps.lat,gps.lng];
      let marker=markersRef.current[key];
      if(!marker){
        marker=L.circleMarker(latlng,{radius:6}).addTo(mapRef.current);
        marker.bindTooltip(`Vehicle ${vid}`);
        markersRef.current[key]=marker;
      } else {
        marker.setLatLng(latlng);
      }
    }
  },[relayState.vehicles]);

  // Load mock backend data
  async function refreshMock(){
    const [v,d,i] = await Promise.all([
      fetch(`${MOCK_HTTP}/api/vehicles`).then(r=>r.json()),
      fetch(`${MOCK_HTTP}/api/drivers`).then(r=>r.json()),
      fetch(`${MOCK_HTTP}/api/incidents`).then(r=>r.json())
    ]);
    setVehicles(v); setDrivers(d); setIncidents(i);
  }
  useEffect(()=>{ refreshMock(); const t=setInterval(refreshMock, 5000); return ()=>clearInterval(t); },[]);

  async function refreshManager(){
    const s=await fetch(`${MANAGER_HTTP}/status`).then(r=>r.json());
    setManagerStatus(s);
  }
  useEffect(()=>{ refreshManager(); const t=setInterval(refreshManager, 4000); return ()=>clearInterval(t); },[]);

  async function startFleet(){
    await fetch(`${MANAGER_HTTP}/configure-forward`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(forward)});
    await fetch(`${MANAGER_HTTP}/start-fleet`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(fleetStart)});
    await refreshManager();
  }
  async function stopFleet(){
    await fetch(`${MANAGER_HTTP}/stop-fleet`,{method:"POST"});
    await refreshManager();
  }

  async function sendBadgeScan(vehicleId, badgeUid){
    const ts=new Date().toISOString();
    await fetch(`${RELAY_HTTP}/ingest`,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ forward, event:{type:"badge_scan", ts, vehicleId:String(vehicleId), payload:{timestamp:ts,badgeUid,source:"ui"}} })});
  }

  const vehicleRows = useMemo(()=>{
    const ids = Object.keys(relayState.vehicles||{}).sort((a,b)=>Number(a)-Number(b));
    return ids.map(id=>{
      const v=relayState.vehicles[id]||{};
      const t=v.telemetry||{};
      const gps=t.gps||{};
      const veh=t.vehicle||{};
      const badge=v.badge||{};
      const ign=!!veh.ignition;
      const speed=Number(gps.speedKph||0);
      const auth = badge.badgeUid ? "Authorized" : (ign ? "Pending" : "Idle");
      return {id, ign, speed, auth, gps, veh, badge, err:v.error, incident:v.incident, control:v.control};
    });
  },[relayState.vehicles]);

  const lastEvents = useMemo(()=> (relayState.events||[]).slice(-50).reverse(), [relayState.events]);

  return (
    <div style={{fontFamily:"ui-sans-serif,system-ui", padding:16, maxWidth:1400, margin:"0 auto"}}>
      <h2 style={{marginTop:0}}>Fleet Demo Console</h2>
      <div style={{marginBottom:12}}>
        <Chip label={wsConnected ? "WS Connected" : "WS Disconnected"} tone={wsConnected ? "good" : "bad"} />
        <Chip label={managerStatus.running ? `Sim Running (${managerStatus.vehicles})` : "Sim Stopped"} tone={managerStatus.running ? "good" : "warn"} />
        <Chip label={`Forwarding: ${forward.baseUrl || "(none)"}`} tone={forward.baseUrl ? "good" : "warn"} />
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:12}}>
        <Card title="Live Map">
          <div ref={mapDivRef} style={{height:420, borderRadius:10, overflow:"hidden"}} />
        </Card>

        <Card title="Simulation Controls">
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <label>Count
              <input value={fleetStart.count} onChange={e=>setFleetStart({...fleetStart, count:Number(e.target.value)})} style={{width:"100%"}} />
            </label>
            <label>Interval (sec)
              <input value={fleetStart.intervalSeconds} onChange={e=>setFleetStart({...fleetStart, intervalSeconds:Number(e.target.value)})} style={{width:"100%"}} />
            </label>
            <label>Scenario
              <select value={fleetStart.scenario} onChange={e=>setFleetStart({...fleetStart, scenario:e.target.value})} style={{width:"100%"}}>
                <option value="normal_scan_then_drive">normal_scan_then_drive</option>
                <option value="unauthorized_then_scan">unauthorized_then_scan</option>
              </select>
            </label>
            <label>Seed
              <input value={fleetStart.seed} onChange={e=>setFleetStart({...fleetStart, seed:e.target.value})} style={{width:"100%"}} />
            </label>
            <label style={{gridColumn:"1 / span 2"}}>Forward Base URL
              <input value={forward.baseUrl} onChange={e=>setForward({...forward, baseUrl:e.target.value})} style={{width:"100%"}} />
            </label>
            <label style={{gridColumn:"1 / span 2"}}>Forward Token (optional)
              <input value={forward.token} onChange={e=>setForward({...forward, token:e.target.value})} style={{width:"100%"}} />
            </label>
          </div>
          <div style={{marginTop:10, display:"flex", gap:10}}>
            <button onClick={startFleet}>Start Fleet</button>
            <button onClick={stopFleet}>Stop Fleet</button>
            <button onClick={refreshMock}>Refresh Mock Data</button>
          </div>
          <div style={{marginTop:10, fontSize:12, opacity:0.8}}>
            Tip: Use <b>unauthorized_then_scan</b> to demonstrate incidents + immobilize behavior.
          </div>
        </Card>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
        <Card title="Vehicles (Live)">
          <div style={{maxHeight:420, overflow:"auto", border:"1px solid #eee", borderRadius:10}}>
            <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
              <thead>
                <tr style={{position:"sticky", top:0, background:"#fafafa"}}>
                  <th style={{textAlign:"left", padding:8, borderBottom:"1px solid #eee"}}>ID</th>
                  <th style={{textAlign:"left", padding:8, borderBottom:"1px solid #eee"}}>State</th>
                  <th style={{textAlign:"left", padding:8, borderBottom:"1px solid #eee"}}>Speed</th>
                  <th style={{textAlign:"left", padding:8, borderBottom:"1px solid #eee"}}>Badge</th>
                  <th style={{textAlign:"left", padding:8, borderBottom:"1px solid #eee"}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicleRows.slice(0, Math.min(vehicleRows.length, 200)).map(r=>(
                  <tr key={r.id}>
                    <td style={{padding:8, borderBottom:"1px solid #f2f2f2"}}>{r.id}</td>
                    <td style={{padding:8, borderBottom:"1px solid #f2f2f2"}}>
                      {r.ign ? <Chip label="Ignition On" tone="warn"/> : <Chip label="Ignition Off" tone="muted"/>}
                      {r.auth==="Authorized" ? <Chip label="Authorized" tone="good"/> : r.ign ? <Chip label="Pending" tone="warn"/> : <Chip label="Idle" tone="muted"/>}
                      {r.control?.immobilize ? <Chip label="Immobilized" tone="bad"/> : null}
                    </td>
                    <td style={{padding:8, borderBottom:"1px solid #f2f2f2"}}>{r.speed?.toFixed?.(1)}</td>
                    <td style={{padding:8, borderBottom:"1px solid #f2f2f2"}}>{r.badge?.badgeUid || "-"}</td>
                    <td style={{padding:8, borderBottom:"1px solid #f2f2f2"}}>
                      <button onClick={()=>sendBadgeScan(r.id, "04A1B2C301")}>Scan D1</button>{" "}
                      <button onClick={()=>sendBadgeScan(r.id, "04A1B2C302")}>Scan D2</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Incidents (Mock Fleet)">
          <div style={{maxHeight:420, overflow:"auto", fontFamily:"ui-monospace,monospace", fontSize:12}}>
            {incidents.slice(0,50).map(i=>(
              <div key={i.id} style={{padding:"6px 0", borderBottom:"1px solid #eee"}}>
                <div><b>{i.type}</b> vehicle={i.vehicleId} ts={i.ts}</div>
                <div>{JSON.stringify(i.detail)}</div>
              </div>
            ))}
            {incidents.length===0 && <div style={{opacity:0.7}}>No incidents yet.</div>}
          </div>
        </Card>
      </div>

      <Card title="Raw Event Inspector (last 50)">
        <div style={{maxHeight:320, overflow:"auto", fontFamily:"ui-monospace,monospace", fontSize:12}}>
          {lastEvents.map((e,idx)=>(
            <div key={idx} style={{padding:"6px 0", borderBottom:"1px solid #eee"}}>
              <div><b>{e.type}</b> vehicle={e.vehicleId} ts={e.ts}</div>
              <div style={{opacity:0.9}}>{JSON.stringify(e.payload)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

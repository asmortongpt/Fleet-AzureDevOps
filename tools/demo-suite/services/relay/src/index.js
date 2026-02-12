import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";
import axios from "axios";

const PORT = process.env.PORT || 4010;
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

const state = { vehicles: {}, events: [] };
function pushEvent(evt){
  state.events.push(evt);
  if(state.events.length>2000) state.events.shift();
  const vid = evt.vehicleId;
  if(vid){
    state.vehicles[vid] = state.vehicles[vid] || {};
    state.vehicles[vid].lastEvent = evt;
    if(evt.type==="telemetry") state.vehicles[vid].telemetry = evt.payload;
    if(evt.type==="badge_scan") state.vehicles[vid].badge = evt.payload;
    if(evt.type==="control") state.vehicles[vid].control = evt.payload;
    if(evt.type==="incident") state.vehicles[vid].incident = evt.payload;
    if(evt.type==="error") state.vehicles[vid].error = evt.payload;
  }
}
function broadcast(wss,data){
  for(const c of wss.clients){ if(c.readyState===1) c.send(data); }
}

app.get("/health",(req,res)=>res.json({ok:true,service:"relay"}));
app.get("/state",(req,res)=>res.json(state));

// Ingest events from emulators/UI, broadcast, optionally forward
app.post("/ingest", async (req,res)=>{
  const { forward, event } = req.body || {};
  if(!event) return res.status(400).json({ok:false,error:"event required"});
  pushEvent(event);
  broadcast(wss, JSON.stringify({kind:"event", event}));

  if(forward?.baseUrl){
    const headers = forward.token ? { Authorization: `Bearer ${forward.token}` } : {};
    try{
      if(event.type==="telemetry"){
        await axios.post(`${forward.baseUrl}/api/vehicles/${event.vehicleId}/telemetry`, event.payload, {headers});
      } else if(event.type==="badge_scan"){
        await axios.post(`${forward.baseUrl}/api/vehicles/${event.vehicleId}/badge-scan`, event.payload, {headers});
      }
    }catch(e){
      const msg = e?.response?.data || e.message;
      const errEvt = { type:"error", ts:new Date().toISOString(), vehicleId:event.vehicleId, payload:{message:String(msg)} };
      pushEvent(errEvt);
      broadcast(wss, JSON.stringify({kind:"event", event:errEvt}));
    }
  }

  res.json({ok:true});
});

const server = app.listen(PORT, ()=>console.log(`relay http://localhost:${PORT}`));
const wss = new WebSocketServer({ server, path:"/ws" });
wss.on("connection",(ws)=> ws.send(JSON.stringify({kind:"state", state})));

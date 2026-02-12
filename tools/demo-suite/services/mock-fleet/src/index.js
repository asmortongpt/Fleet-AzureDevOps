import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { v4 as uuid } from "uuid";

const PORT = process.env.PORT || 4020;
const app = express();
app.use(cors());
app.use(bodyParser.json({limit:"2mb"}));

const nowISO=()=>new Date().toISOString();

// In-memory DB
const db = {
  vehicles: {},
  drivers: {},
  sessions: {},
  telemetry: {},
  incidents: []
};

// Seed 100 vehicles + 20 drivers
function seed(){
  for(let i=1;i<=100;i++){
    db.vehicles[String(i)] = {
      id:String(i),
      name:`Vehicle ${i}`,
      require_badge_scan:true,
      badge_grace_seconds:20,
      immobilizer_mode:"simulate"
    };
    db.telemetry[String(i)] = null;
  }
  for(let d=1; d<=20; d++){
    const badge = `04A1B2C3${String(d).padStart(2,"0")}`;
    db.drivers[String(d)] = { id:String(d), name:`Driver ${d}`, badge_uid:badge };
  }
}
seed();

function activeSession(vehicleId){
  const s = Object.values(db.sessions).find(x=>x.vehicle_id===vehicleId && !x.ended_at);
  return s || null;
}

function createIncident(vehicleId, type, detail){
  const inc = { id:uuid(), ts:nowISO(), vehicleId, type, detail };
  db.incidents.push(inc);
  if(db.incidents.length>2000) db.incidents.shift();
  return inc;
}

app.get("/health",(req,res)=>res.json({ok:true,service:"mock-fleet"}));

// Vehicles
app.get("/api/vehicles",(req,res)=>res.json(Object.values(db.vehicles)));
app.get("/api/vehicles/:id",(req,res)=>res.json(db.vehicles[req.params.id]||null));
app.patch("/api/vehicles/:id",(req,res)=>{
  const v = db.vehicles[req.params.id]; if(!v) return res.status(404).json({error:"not found"});
  Object.assign(v, req.body||{});
  res.json(v);
});

// Drivers
app.get("/api/drivers",(req,res)=>res.json(Object.values(db.drivers)));
app.post("/api/drivers",(req,res)=>{
  const id = uuid();
  const driver = { id, name:req.body?.name||"Driver", badge_uid:req.body?.badge_uid||null };
  db.drivers[id]=driver;
  res.json(driver);
});
app.patch("/api/drivers/:id",(req,res)=>{
  const d=db.drivers[req.params.id]; if(!d) return res.status(404).json({error:"not found"});
  Object.assign(d, req.body||{});
  res.json(d);
});

// Badge scan
app.post("/api/vehicles/:id/badge-scan",(req,res)=>{
  const vehicleId=req.params.id;
  const badgeUid=req.body?.badgeUid;
  const driver = Object.values(db.drivers).find(d=>d.badge_uid===badgeUid);
  if(!driver) return res.status(404).json({error:"unknown badge"});
  // end existing
  const cur = activeSession(vehicleId);
  if(cur) cur.ended_at=nowISO();
  const session = { id:uuid(), vehicle_id:vehicleId, driver_id:driver.id, badge_uid:badgeUid, started_at:nowISO(), ended_at:null, authorized:true, last_seen_at:nowISO() };
  db.sessions[session.id]=session;
  res.json({ok:true, session, driver});
});

app.get("/api/vehicles/:id/driver-session",(req,res)=>{
  const s=activeSession(req.params.id);
  if(!s) return res.json({authorized:false, session:null, driver:null});
  const driver=db.drivers[s.driver_id];
  res.json({authorized:true, session:s, driver});
});

// Telemetry ingest + enforcement
app.post("/api/vehicles/:id/telemetry",(req,res)=>{
  const vehicleId=req.params.id;
  const v=db.vehicles[vehicleId]; if(!v) return res.status(404).json({error:"vehicle not found"});
  const t=req.body||{};
  db.telemetry[vehicleId]=t;

  const ignition = !!t?.vehicle?.ignition;
  const speed = Number(t?.gps?.speedKph||0);

  let session = activeSession(vehicleId);
  if(session) session.last_seen_at=nowISO();

  let control = {};
  if(v.require_badge_scan && ignition){
    const authorized = !!session?.authorized;
    if(!authorized && speed>0){
      const inc = createIncident(vehicleId,"unauthorized_drive",{speed, msg:"Vehicle moved without badge authorization"});
      if(v.immobilizer_mode==="simulate") control = { immobilize:true, reason:"unauthorized_drive" };
      return res.json({ok:true, control, incident:inc});
    }
  }
  res.json({ok:true, control});
});

// Query latest telemetry
app.get("/api/telemetry",(req,res)=>{
  const rows = Object.keys(db.vehicles).map(id=>({vehicleId:id, telemetry:db.telemetry[id]}));
  res.json(rows);
});

// Incidents
app.get("/api/incidents",(req,res)=>res.json(db.incidents.slice(-500).reverse()));

app.listen(PORT, ()=>console.log(`mock-fleet http://localhost:${PORT}`));

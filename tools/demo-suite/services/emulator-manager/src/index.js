import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import seedrandom from "seedrandom";

const PORT = process.env.PORT || 4030;
const RELAY_URL = process.env.RELAY_URL || "http://localhost:4010";
const MOCK_FLEET_URL = process.env.MOCK_FLEET_URL || "http://localhost:4020";

const app=express();
app.use(cors());
app.use(bodyParser.json({limit:"2mb"}));

const sims = {}; // vehicleId -> sim state
let timer = null;

const scenarios = {
  normal_scan_then_drive: {
    steps: [
      {t:0, a:"ign_on"},
      {t:3, a:"scan"},
      {t:6, a:"speed", v:35},
      {t:100, a:"speed", v:0},
      {t:110, a:"ign_off"}
    ],
    duration:120
  },
  unauthorized_then_scan: {
    steps: [
      {t:0, a:"ign_on"},
      {t:4, a:"speed", v:25},
      {t:20, a:"scan"},
      {t:30, a:"speed", v:40},
      {t:110, a:"ign_off"}
    ],
    duration:120
  }
};

function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }
function nowISO(){ return new Date().toISOString(); }

async function ingest(event, forward){
  await axios.post(`${RELAY_URL}/ingest`, { event, forward });
}

function initVehicle(vehicleId, rng, scenarioName){
  const baseLat=40.7128 + rng()*0.05;
  const baseLng=-74.0060 + rng()*0.05;
  const route = Array.from({length:30}).map((_,i)=>({
    lat: baseLat + Math.sin(i/5)*0.002,
    lng: baseLng + Math.cos(i/5)*0.002
  }));
  return {
    vehicleId,
    scenario: scenarioName,
    startTs: Date.now(),
    route,
    routeIndex:0,
    stepPtr:0,
    ignition:false,
    speedKph:0,
    heading:90,
    rpm:0,
    fuel: 60 + rng()*30,
    odo: 10000 + rng()*5000,
    engineHours: 200 + rng()*500,
    lat: route[0].lat,
    lng: route[0].lng,
    badgeUid: `04A1B2C3${String(1+Math.floor(rng()*20)).padStart(2,"0")}`
  };
}

function stepSim(sim, rng, dt){
  const sc = scenarios[sim.scenario];
  const t = (Date.now()-sim.startTs)/1000;
  const steps = sc.steps;
  while(sim.stepPtr < steps.length && steps[sim.stepPtr].t <= t){
    const s=steps[sim.stepPtr];
    if(s.a==="ign_on") sim.ignition=true;
    if(s.a==="ign_off") sim.ignition=false;
    if(s.a==="speed") sim.speedKph=clamp(s.v,0,120);
    if(s.a==="scan") sim._scan = true;
    sim.stepPtr++;
  }
  // physics
  if(!sim.ignition){
    sim.speedKph = clamp(sim.speedKph-10,0,120);
    sim.rpm = clamp(sim.rpm-500,0,4000);
  } else {
    sim.rpm = clamp(800 + sim.speedKph*35 + (rng()-0.5)*200, 700, 4500);
    sim.fuel = clamp(sim.fuel - 0.0008*sim.speedKph, 0, 100);
  }
  // route
  if(sim.speedKph>1){
    sim.routeIndex=(sim.routeIndex+1)%sim.route.length;
    const p=sim.route[sim.routeIndex];
    sim.lat=p.lat; sim.lng=p.lng;
    sim.odo += (sim.speedKph*dt)/3600;
    sim.engineHours += dt/3600;
  }
  return t;
}

let forwardConfig = { baseUrl: MOCK_FLEET_URL, token: "" };

app.get("/health",(req,res)=>res.json({ok:true,service:"emulator-manager"}));
app.get("/scenarios",(req,res)=>res.json(Object.keys(scenarios)));

app.post("/configure-forward",(req,res)=>{
  forwardConfig = { baseUrl: req.body?.baseUrl || "", token: req.body?.token || "" };
  res.json({ok:true, forwardConfig});
});

app.post("/start-fleet", async (req,res)=>{
  const count = Number(req.body?.count||100);
  const scenario = req.body?.scenario || "normal_scan_then_drive";
  const seed = req.body?.seed || "demo";
  const intervalSeconds = Number(req.body?.intervalSeconds||2);

  // init
  Object.keys(sims).forEach(k=>delete sims[k]);
  const rng = seedrandom(seed);
  for(let i=1;i<=count;i++){
    const vid=String(i);
    sims[vid]=initVehicle(vid, rng, scenario);
  }

  // start loop
  if(timer) clearInterval(timer);
  timer=setInterval(async ()=>{
    const rngLoop = seedrandom(seed + String(Date.now()/10000|0));
    for(const vid of Object.keys(sims)){
      const sim=sims[vid];
      const t=stepSim(sim, rngLoop, intervalSeconds);

      // send scan if scheduled
      if(sim._scan){
        sim._scan=false;
        await ingest({
          type:"badge_scan", ts: nowISO(), vehicleId: vid,
          payload:{ timestamp: nowISO(), badgeUid: sim.badgeUid, source:"manager" }
        }, forwardConfig);
      }

      await ingest({
        type:"telemetry", ts: nowISO(), vehicleId: vid,
        payload:{
          timestamp: nowISO(), source:"manager",
          gps:{ lat: sim.lat, lng: sim.lng, speedKph: sim.speedKph, heading: sim.heading },
          vehicle:{ ignition: sim.ignition, odometerKm: Number(sim.odo.toFixed(2)), engineRpm: Math.round(sim.rpm),
            fuelLevelPct: Number(sim.fuel.toFixed(1)), coolantTempC: 85, engineHours: Number(sim.engineHours.toFixed(2)), batteryVoltage: 12.6 }
        }
      }, forwardConfig);
    }
  }, intervalSeconds*1000);

  res.json({ok:true, count, scenario, seed, intervalSeconds});
});

app.post("/stop-fleet",(req,res)=>{
  if(timer) clearInterval(timer);
  timer=null;
  res.json({ok:true});
});

app.get("/status",(req,res)=>{
  res.json({running:!!timer, vehicles:Object.keys(sims).length, forwardConfig});
});

app.listen(PORT, ()=>console.log(`emulator-manager http://localhost:${PORT}`));

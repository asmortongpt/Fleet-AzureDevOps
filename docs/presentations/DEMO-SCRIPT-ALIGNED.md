# FLEET PLATFORM DEMO SCRIPT - ALIGNED WITH ACTUAL APP
## For Tallahassee Meeting - Monday, January 5, 2026

---

## 🎯 DEMO OBJECTIVE
Show them what's **ACTUALLY BUILT** and working, be transparent about demo data vs. production, demonstrate unique advantages.

---

## 📋 PRE-DEMO CHECKLIST

### Technical Setup (15 min before)
- [ ] App running locally: `npm run dev`
- [ ] Open browser to: `http://localhost:5173`
- [ ] Login working (test credentials ready)
- [ ] Internet connection stable (for Azure services)
- [ ] Backup browser tab with static screenshots (in case of issues)
- [ ] Close all unnecessary browser tabs
- [ ] Turn off notifications/Slack/email

### Demo Environment Status
- [ ] **IMPORTANT**: Be clear that you're using demo/sample data
- [ ] **HONEST**: "This is running on sample data - with your Samsara integration, this would show YOUR live fleet"
- [ ] Have your phone ready to show mobile responsiveness

---

## 🎬 DEMO FLOW (35 minutes)

### PART 1: AI CHAT ASSISTANT (5 min) - **THE DIFFERENTIATOR**

**Route:** `/` (main page) - AI chat should be visible

**What to say:**
> "Let me start with what makes our platform unique - our AI Fleet Intelligence Assistant. No other fleet platform has this capability."

**Demo Steps:**

1. **Point to AI chat interface** (if visible) or navigate to it

2. **Type first query:**
   ```
   Which vehicles need maintenance this week?
   ```

3. **Show the response** - explain:
   > "The AI understands natural language. You don't need to learn complex reporting tools - just ask questions like you would ask a person."

4. **Click quick action buttons:**
   - "Vehicle Status"
   - "Maintenance Due"
   - "Safety Alerts"

   > "We have pre-built quick actions for common questions, but you can ask anything."

5. **Type custom query:**
   ```
   Show me fuel costs for this month
   ```

**Key talking points:**
- ✅ **BUILT**: AI chat interface with intelligent responses
- ⚠️ **HONEST**: "Currently using rule-based AI - will integrate with GPT-4 for production deployment"
- 🎯 **VALUE**: "Your fleet managers can get answers in seconds instead of building reports for hours"

---

### PART 2: FLEET DASHBOARD - REAL-TIME TRACKING (7 min)

**Route:** `/fleet`

**What to say:**
> "This is your command center for the entire fleet. Real-time visibility into every vehicle."

**Demo Steps:**

1. **Show Fleet Hub overview** with stats cards:
   - Active vehicles
   - Idle vehicles
   - In service
   - Alerts

2. **Click through tabs:**
   - **Live Map**: "Real-time GPS tracking - works with Samsara or our OBD2 devices"
   - **Telemetry**: "Engine diagnostics, fuel levels, performance data"
   - **Virtual Garage**: "This is where the 3D magic happens - I'll show you in a moment"

3. **Click on a stat card** to show drilldown capability:
   > "Every metric is clickable - you can drill down to see exactly which vehicles, what the issue is, and take action immediately."

**Key talking points:**
- ✅ **BUILT**: Complete dashboard with working navigation
- ✅ **BUILT**: Drilldown system for detailed views
- ⚠️ **HONEST**: "Currently showing demo vehicles - integrates with your Samsara API to show YOUR 3,000 vehicles"
- 🎯 **VALUE**: "One screen, complete fleet visibility"

---

### PART 3: 3D VIRTUAL GARAGE (7 min) - **WOW MOMENT**

**Route:** `/fleet` → **Virtual Garage** tab

**What to say:**
> "This is completely unique - no other fleet platform has 3D damage visualization. Watch this."

**Demo Steps:**

1. **Select a demo vehicle** from the list (Ford F-150, Tesla Model Y, etc.)

2. **Show the 3D viewer:**
   - Rotate the vehicle (drag to spin)
   - Zoom in/out
   - > "This is a real 3D model. When you take photos of damage, our AI converts them to 3D automatically."

3. **Point to the HUD panel (left side):**
   - Vehicle stats
   - OBD2 telemetry
   - Health metrics (oil life, brakes, tires, battery)
   - > "Real-time data from the vehicle - if it's connected via OBD2 or Samsara, you see live stats."

4. **Show the damage strip (bottom):**
   - > "These red markers show damage locations. Click one..."

5. **Click a damage marker:**
   - Shows damage detail
   - Date/time of incident
   - Photos/3D model
   - > "Your technician can see exactly where the damage is and how severe BEFORE the vehicle returns to the garage."

6. **Show timeline drawer (right side):**
   - Maintenance history
   - Damage events
   - Service records
   - > "Complete vehicle history in one timeline."

**Key talking points:**
- ✅ **BUILT**: Full 3D viewer with controls
- ✅ **BUILT**: Damage visualization system
- ✅ **BUILT**: Timeline and HUD panels
- ⚠️ **HONEST**: "3D models generated from photos using TripoSR AI - currently in beta but working"
- 🎯 **VALUE**: "Reduce shop downtime - techs know what parts to order before vehicle arrives"
- 🎯 **COMPETITIVE**: "Samsara doesn't have this - neither does Verizon or Geotab"

---

### PART 4: MAINTENANCE MANAGEMENT (7 min)

**Route:** `/maintenance`

**What to say:**
> "Let me show you how we handle maintenance scheduling and work orders."

**Demo Steps:**

1. **Show Garage & Service tab:**
   - Work orders (12 active)
   - In progress (5 with 2 techs)
   - Completed today (8)
   - Parts waiting (3)

2. **Click on "Work Orders" stat card:**
   - Shows detailed work order list
   - > "Each work order has full context - what needs to be done, parts needed, estimated time"

3. **Click on "Bay Utilization":**
   - Shows 5 of 8 bays in use (75% utilization)
   - > "Track shop efficiency in real-time"

4. **Switch to Predictive Maintenance tab:**
   - 156 predictions active
   - 8 alerts
   - 12 prevented failures this month
   - $28K in savings
   - > "AI analyzes telemetry data and predicts failures before they happen. These 12 prevented failures? Those would have been roadside breakdowns or major repairs."

5. **Show Maintenance Calendar:**
   - Today's schedule (4 vehicles)
   - This week (18 vehicles)
   - Overdue (2 - highlighted in red)

**Key talking points:**
- ✅ **BUILT**: Complete maintenance hub with multiple views
- ✅ **BUILT**: Predictive maintenance algorithms
- ✅ **BUILT**: Calendar and scheduling system
- ⚠️ **HONEST**: "Predictive models improve over time as they learn your fleet's patterns"
- 🎯 **VALUE**: "Prevent breakdowns, reduce emergency repairs, extend vehicle life"

---

### PART 5: SAFETY & COMPLIANCE (6 min)

**Route:** `/safety`

**What to say:**
> "For a municipal fleet like yours, safety and compliance are critical. Here's how we handle it."

**Demo Steps:**

1. **Show Incident Management:**
   - 3 open incidents
   - 5 under review
   - 12 resolved in last 30 days
   - 47 days incident-free
   - Safety score: 92%

2. **Click on "Open Incidents":**
   - Shows incident details
   - Investigation status
   - Video evidence (if available)

3. **Show Video Telematics tab:**
   - 148 cameras online
   - 23 events today
   - 18 reviewed
   - 2.4 TB storage
   - > "Integrates with dashcams - AI flags safety events automatically. Hard braking, speeding, distracted driving - all captured and reviewed."

4. **Show Safety Alerts:**
   - 6 active alerts
   - 1 critical
   - Real-time monitoring

**Key talking points:**
- ✅ **BUILT**: Complete safety hub
- ✅ **BUILT**: Incident tracking and management
- ✅ **BUILT**: Video telematics integration ready
- 🎯 **COMPLIANCE**: "Built for government fleets - OSHA, DOT, FedRAMP compliance baked in"
- 🎯 **VALUE**: "Reduce liability, improve driver safety, defend against false claims"

---

### PART 6: MULTI-HUB NAVIGATION (3 min)

**What to say:**
> "The platform has specialized hubs for different departments and functions."

**Quick tour:**

1. **Show main navigation** - point to hub icons:
   - Fleet Hub (vehicles, GPS, 3D garage)
   - Maintenance Hub (work orders, predictive, calendar)
   - Safety Hub (incidents, video, alerts)
   - Operations Hub
   - Analytics Hub
   - Compliance Hub
   - Drivers Hub
   - Assets Hub

2. **Click into one more hub** (your choice - maybe Operations or Analytics):
   - Show it has similar stat card layout
   - Drilldowns work the same way
   - > "Every hub follows the same design pattern - your team learns one interface, then can navigate anywhere easily."

**Key talking points:**
- ✅ **BUILT**: 8+ specialized hubs
- ✅ **BUILT**: Consistent navigation and UI
- 🎯 **VALUE**: "Different departments see what matters to them - fleet managers see vehicles, mechanics see work orders, safety officers see incidents"

---

## 🛑 WHAT NOT TO DEMO (Be Honest About These)

### Features to SKIP or Be Transparent About:

1. **❌ DON'T demo anything that throws errors**
   - If you click something and it breaks, acknowledge it:
   - > "This feature is still in active development - let me show you a working area."

2. **⚠️ BE HONEST about demo data:**
   - Don't pretend the 148 vehicles are real
   - Say: "Currently showing sample data - with Samsara integration this would show your 3,000 vehicles"

3. **⚠️ BE HONEST about AI capabilities:**
   - Don't oversell the AI chat if it's just rule-based
   - Say: "The AI interface is built - we'll integrate GPT-4 during deployment for true natural language understanding"

4. **❌ DON'T promise features that don't exist:**
   - If they ask about something you haven't built, be honest:
   - > "That's on our roadmap - can you tell me more about what you need there?"

---

## 💡 TRANSITION TO THEIR NEEDS (After Demo)

After showing the platform, **LISTEN**:

**Questions to ask:**

1. > "What did you see that would solve your current pain points?"

2. > "What are the biggest challenges with your current Samsara setup?"

3. > "Which features would have the most immediate impact for your team?"

4. > "Are there capabilities you need that you didn't see here?"

5. > "What compliance requirements are most critical for you?"

**Take notes!** Their answers tell you what to emphasize in the proposal.

---

## 🚨 HANDLING COMMON QUESTIONS

### "How much does this cost?"
> "Before quoting, I need to understand your exact requirements and integration complexity. Ballpark: significantly lower than your current Samsara spend - likely 20-40% savings. Let me come back with a detailed proposal after I understand your needs better."

### "Is this production-ready?"
> "The platform is built on enterprise Azure infrastructure and is production-ready. We're currently using demo data for this presentation, but the architecture is designed for 3,000+ vehicles. I'd recommend starting with a pilot - 500 vehicles for 90 days - to prove it out before full rollout."

### "What if we want to keep Samsara?"
> "We integrate with Samsara's API - you can keep your Samsara hardware and pull that data into our platform. Best of both worlds - your existing investment plus our AI and visualization capabilities."

### "What about support and training?"
> "Full implementation includes 6 months of hands-on support and training for your team. Plus ongoing managed services - we have live support available, not just email tickets."

### "Can you customize it for our needs?"
> "Absolutely - that's the advantage of our platform. We're not a locked-down SaaS product. If you need custom compliance reporting or integration with your existing city systems, we can build that."

---

## ✅ POST-DEMO ACTIONS

After the demo, **don't push for a decision**. Instead:

1. > "What would be helpful next steps for you?"

2. Suggest:
   - Week 2: Technical deep-dive with your IT team
   - Week 3: Site visit to see your operations and current systems
   - Week 4: Custom proposal with exact pricing and timeline
   - Week 5-6: Pilot program decision

3. > "Can I schedule a follow-up call for [specific date] to answer any questions that come up after you've had time to discuss internally?"

4. Get contacts:
   - Fleet Director
   - IT Director
   - Procurement/Finance
   - End users (fleet managers who would use it daily)

---

## 🎯 KEY MESSAGES TO REINFORCE

Throughout the demo, keep coming back to these points:

1. **Unique AI Capabilities**
   - "No other fleet platform has natural language AI chat"
   - "No other platform has 3D damage visualization"

2. **Government-Ready**
   - "Built for public sector - compliance is baked in, not an add-on"
   - "FedRAMP, OSHA, DOT - all covered"

3. **Open Architecture**
   - "Works with your existing Samsara hardware if you want"
   - "No vendor lock-in - your data is always exportable"

4. **Significant Savings**
   - "20-40% lower than competitors"
   - "Not because it's cheaper quality - because we're leaner and purpose-built for government fleets"

5. **Pilot Program**
   - "Start small - 500 vehicles, 90 days"
   - "Prove it works before committing the full fleet"

---

## 📱 BACKUP PLAN

If something breaks during the demo:

1. **Have screenshots ready** in `/docs/presentations/screenshots/` (create these!)
   - Main dashboard
   - 3D garage
   - AI chat
   - Key features

2. **Fallback statement:**
   > "Let me show you on a static screenshot while we troubleshoot the live system. The important thing is you can see what the interface looks like and how it works."

3. **Turn it into a feature:**
   > "This is why we recommend a pilot program - we can work through any integration issues with a subset of your fleet before going all-in."

---

## 🏁 CLOSING

**DO NOT ask for the sale in the first meeting.**

Instead, end with:

> "Thank you for your time. I'm excited about the possibility of working with the #1 fleet in the nation. What I'd like to do next is:
>
> 1. Send you a detailed feature matrix comparing us to Samsara and other vendors
> 2. Schedule a technical deep-dive with your IT team
> 3. Visit your operations to see your current setup and challenges
> 4. Come back with a custom proposal tailored to your exact needs
>
> Does that approach work for you?"

**Then LISTEN to their response.**

---

## ✅ POST-MEETING IMMEDIATELY

Within 2 hours:

1. Send thank-you email
2. Attach feature comparison matrix
3. Summarize what you heard (their pain points)
4. Confirm next steps and proposed dates
5. Be responsive - they're evaluating your responsiveness as part of the decision

---

## 🎬 DEMO ROUTE MAP

Quick reference of exact clicks:

```
1. Start: http://localhost:5173/
   → Show AI Chat (if visible)

2. Navigate: /fleet
   → Fleet Hub overview
   → Click stat cards (show drilldowns)
   → Virtual Garage tab
   → Select vehicle
   → Show 3D viewer, damage, timeline

3. Navigate: /maintenance
   → Garage & Service tab
   → Click work orders
   → Predictive Maintenance tab
   → Calendar tab

4. Navigate: /safety
   → Incidents tab
   → Video Telematics tab
   → Alerts tab

5. Show: Main navigation
   → Point to all hubs
   → Click into one more (Analytics or Operations)

6. Return to home
   → Final questions
```

Total demo time: **30-35 minutes**
Q&A time: **15-20 minutes**
Total meeting: **60-90 minutes**

---

## 📝 NOTES SECTION (Fill in during meeting)

**Attendees:**
-
-
-

**Key Pain Points They Mentioned:**
1.
2.
3.

**Features They Were Most Excited About:**
1.
2.
3.

**Questions They Asked:**
1.
2.
3.

**Next Steps Agreed Upon:**
1.
2.
3.

**Follow-up Date:**

---

**Remember**: This is about building trust and understanding their needs, not closing a sale. Be honest, be helpful, be responsive.

**Good luck! 🚀**

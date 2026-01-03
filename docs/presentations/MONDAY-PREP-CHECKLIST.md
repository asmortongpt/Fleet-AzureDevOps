# MONDAY MEETING PREPARATION CHECKLIST
## Tallahassee Fleet Demo - Final Prep

---

## 🚨 CRITICAL - DO THESE FIRST (Saturday/Sunday)

### 1. Test the Demo Flow End-to-End

- [ ] Run `npm run dev` successfully
- [ ] Navigate through entire demo route:
  - [ ] `/` - Home page with AI chat
  - [ ] `/fleet` - Fleet Hub loads
  - [ ] `/fleet` → Virtual Garage tab opens
  - [ ] `/fleet` → Select a vehicle in Virtual Garage
  - [ ] `/maintenance` - Maintenance Hub loads
  - [ ] `/safety` - Safety Hub loads
  - [ ] All other hubs load without errors

- [ ] Test AI chat:
  - [ ] Type a query and get response
  - [ ] Click quick action buttons work
  - [ ] Chat interface is responsive

- [ ] Test 3D garage:
  - [ ] 3D viewer rotates smoothly
  - [ ] Damage markers are visible
  - [ ] Timeline drawer opens
  - [ ] HUD panel shows data

- [ ] Note ANY errors or broken features
  - [ ] List them here: _________________
  - [ ] Plan workarounds or what to skip

### 2. Prepare Backup Materials

- [ ] Take screenshots of key screens:
  - [ ] Main dashboard
  - [ ] AI chat interface with sample conversation
  - [ ] 3D virtual garage with vehicle
  - [ ] Maintenance hub
  - [ ] Safety hub
  - [ ] Save to: `/docs/presentations/screenshots/`

- [ ] Create PDF backup of demo script:
  - [ ] Print DEMO-SCRIPT-ALIGNED.md to PDF
  - [ ] Save to laptop desktop for quick access

### 3. Prepare Your Laptop

- [ ] Charge laptop fully
- [ ] Bring charger and adapter
- [ ] Clean desktop - close unnecessary apps
- [ ] Clear browser cache and cookies
- [ ] Disable browser extensions that might interfere
- [ ] Turn off all notifications:
  - [ ] Slack
  - [ ] Email
  - [ ] Messages
  - [ ] Calendar alerts

- [ ] Set up dual monitor (if they have one available):
  - [ ] Test screen mirroring/extending
  - [ ] Practice switching displays

### 4. Verify Internet Connectivity

- [ ] Test your mobile hotspot (backup if their WiFi fails)
- [ ] Ensure Azure services are accessible
- [ ] Test: Can you access Azure portal?
- [ ] Test: Can you access GitHub?
- [ ] Pre-download any files you might need offline

---

## 📋 SUNDAY NIGHT - FINAL PREP

### 5. Practice the Demo

- [ ] Run through the entire demo script 2-3 times
- [ ] Time yourself - aim for 30-35 minutes demo + 20 min Q&A
- [ ] Practice transitions between sections smoothly
- [ ] Practice key talking points out loud:
  - [ ] "No other platform has AI chat like this"
  - [ ] "3D damage visualization is unique to us"
  - [ ] "Built for government compliance - FedRAMP, OSHA, DOT"
  - [ ] "Works with your existing Samsara hardware"

### 6. Prepare Your Opening (First 60 seconds)

Practice saying this naturally:

> "Thank you for meeting with me. I'm Andrew from Capital Technology Alliance. Before I show you the platform, I'd love to understand your current challenges with fleet management. What are the top 3 pain points you're dealing with right now?"

**THEN LISTEN.** Take notes. Adjust your demo to focus on their pain points.

### 7. Prepare Your Questions

Memorize these discovery questions:

1. "What are your biggest challenges with your current system?"
2. "What features do you wish you had that you don't have now?"
3. "Who are the key stakeholders who would use this system daily?"
4. "What does your timeline look like for making a decision?"
5. "What compliance requirements are most critical for you?"

### 8. Prepare Materials to Bring

#### Digital Materials:
- [ ] DEMO-SCRIPT-ALIGNED.md on laptop
- [ ] MONDAY-MEETING-AGENDA.html bookmarked
- [ ] Screenshots folder ready
- [ ] Competitive comparison matrix ready
- [ ] Pricing summary (internal reference only)

#### Physical Materials:
- [ ] Business cards (bring 10)
- [ ] Laptop + charger
- [ ] Notepad + pen (for taking notes)
- [ ] Water bottle
- [ ] Breath mints 😅

---

## 🌅 MONDAY MORNING - DAY OF

### 9. Morning Routine

- [ ] Get good sleep Sunday night (critical!)
- [ ] Eat breakfast - you think better with fuel
- [ ] Dress professionally but comfortably
- [ ] Arrive 15-20 minutes early
- [ ] Find the meeting room ahead of time
- [ ] Test their WiFi (ask for guest access)
- [ ] Set up your laptop before they arrive

### 10. Technical Setup (15 min before meeting)

- [ ] Connect to power outlet
- [ ] Connect to WiFi or hotspot
- [ ] Run `npm run dev` and verify app loads
- [ ] Open demo route in browser: `http://localhost:5173/`
- [ ] Test one feature (AI chat) to confirm it's working
- [ ] Open DEMO-SCRIPT-ALIGNED.md in separate window (reference)
- [ ] Close all other apps and browser tabs
- [ ] Turn phone on silent (but keep nearby)
- [ ] Have backup screenshots folder open just in case

### 11. Mental Preparation

- [ ] Review your opening statement
- [ ] Review discovery questions
- [ ] Remind yourself:
  - **LISTEN more than talk**
  - **Ask questions before showing features**
  - **Be honest about demo data and capabilities**
  - **This is relationship-building, not closing**
  - **They're the #1 fleet in the nation - show respect**

---

## 🎯 DURING THE MEETING

### 12. Opening (5 min)

- [ ] Greet everyone warmly
- [ ] Ask each person to introduce themselves and their role
- [ ] Ask your discovery questions
- [ ] Take notes on what they say
- [ ] Tell them what you'll show them based on what you heard:
  > "Based on what you shared, let me focus on [specific features that solve their pain points]."

### 13. During Demo (30-35 min)

- [ ] Follow the demo script but adapt to their interests
- [ ] If they ask a question, answer it (don't defer to "later")
- [ ] If you see them losing interest in a section, move faster
- [ ] If you see them engaged, slow down and go deeper
- [ ] Watch their body language:
  - Leaning forward = interested, go deeper
  - Checking phones = losing them, speed up or change topics
  - Taking notes = very interested, slow down

### 14. Handling Technical Issues

If something breaks:

- [ ] Stay calm - say "Let me show you on a screenshot"
- [ ] Pull up backup screenshots
- [ ] Make it a selling point:
  > "This is exactly why we recommend a pilot program - we work through any issues with a small group first."

### 15. Q&A (15-20 min)

- [ ] Answer questions honestly
- [ ] If you don't know, say so:
  > "Great question - I don't want to guess. Let me research that and get back to you with the exact answer."
- [ ] Take notes on every question
- [ ] For pricing questions, defer but give ballpark:
  > "Significantly lower than your current Samsara costs - likely 20-40% savings. Let me come back with exact numbers after I understand your integration requirements."

### 16. Closing (5 min)

- [ ] DON'T ask for the sale
- [ ] DO propose next steps:
  - Week 2: Technical deep-dive with IT
  - Week 3: Site visit to see their operations
  - Week 4: Custom proposal
  - Week 5-6: Pilot decision

- [ ] Ask: "What would be most helpful for you as next steps?"
- [ ] Confirm who should be involved in next meetings
- [ ] Schedule follow-up call (get it on calendar NOW)

---

## 📝 IMMEDIATELY AFTER MEETING (Within 2 Hours)

### 17. Follow-Up Actions

- [ ] Send thank-you email to all attendees
- [ ] Summarize what you heard (their pain points)
- [ ] Attach competitive comparison matrix
- [ ] Confirm next meeting date/time
- [ ] Answer any questions that came up

Email template:
```
Subject: Thank You - Fleet Management Platform Demo

Hi [Name],

Thank you for taking the time to meet with me today. I appreciated learning about:

• [Pain point 1 they mentioned]
• [Pain point 2 they mentioned]
• [Pain point 3 they mentioned]

Based on our discussion, I believe our platform can help with [specific solutions].

Attached is a competitive comparison matrix showing how we compare to Samsara and other vendors.

Next steps we discussed:
• [Step 1]
• [Step 2]
• Follow-up call: [Date/Time]

Please don't hesitate to reach out if any questions come up.

Best regards,
Andrew Morton
Capital Technology Alliance
[Your contact info]
```

---

## 📊 EVALUATION - DID IT GO WELL?

After the meeting, reflect:

### Positive Signs:
- [ ] They asked lots of questions
- [ ] They talked about specific use cases
- [ ] They mentioned timeline for decision
- [ ] They introduced you to other stakeholders
- [ ] They scheduled next meeting before you left
- [ ] They said "This solves our problem with..."

### Warning Signs:
- [ ] Very few questions
- [ ] Lots of nodding but no engagement
- [ ] Vague about next steps
- [ ] No commitment to follow-up meeting
- [ ] Kept comparing to "what we already have"

---

## 🔄 CONTINUOUS IMPROVEMENT

### 18. Post-Meeting Notes

After the meeting, while it's fresh:

**What went well:**
1. _____________________
2. _____________________
3. _____________________

**What could improve:**
1. _____________________
2. _____________________
3. _____________________

**Questions I couldn't answer:**
1. _____________________
2. _____________________

**Features they want that we don't have:**
1. _____________________
2. _____________________

**Their decision timeline:**
_____________________

**Key stakeholders identified:**
1. _____________________ (Role: _______)
2. _____________________ (Role: _______)
3. _____________________ (Role: _______)

---

## ✅ FINAL CHECKLIST SUMMARY

**Saturday/Sunday:**
- [ ] Test entire demo flow
- [ ] Take backup screenshots
- [ ] Prepare laptop
- [ ] Practice demo 2-3 times

**Sunday Night:**
- [ ] Review demo script
- [ ] Practice opening and questions
- [ ] Check all materials ready
- [ ] Get good sleep!

**Monday Morning:**
- [ ] Arrive early
- [ ] Set up tech 15 min before
- [ ] Review opening statement
- [ ] Mental prep: Listen > Talk

**During Meeting:**
- [ ] LISTEN to their pain points
- [ ] Adapt demo to their needs
- [ ] Be honest about capabilities
- [ ] DON'T push for sale
- [ ] Propose next steps

**After Meeting:**
- [ ] Send thank-you within 2 hours
- [ ] Summarize what you heard
- [ ] Confirm next steps
- [ ] Be responsive to follow-ups

---

**You've got this! 🚀**

Remember: The #1 fleet in the nation is evaluating YOU as much as your platform. Show competence, honesty, and partnership - not just a sales pitch.

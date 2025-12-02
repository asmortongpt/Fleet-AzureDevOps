# PTT Feature Comparison

## Dashboard Layout with Mobile PTT

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   FLEET COMMAND CENTER HEADER                           │
│  Stats: Active: 210  |  Responding: 30  |  Idle: 60  |  Incidents: 5   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────────┬─────────────────────┐
│ LEFT SIDEBAR │          MAP AREA                │   RIGHT PANEL       │
│              │                                  │                     │
│ ┌──────────┐ │  ╔════════════════════════════╗  │ ┌─────────────────┐ │
│ │Vehicles  │ │  ║                            ║  │ │ Mobile App      │ │
│ │Incidents │ │  ║   🗺️ Interactive Map       ║  │ │ (When vehicle   │ │
│ │Tasks     │ │  ║                            ║  │ │  selected)      │ │
│ └──────────┘ │  ║   • 300 Vehicle Markers    ║  │ └─────────────────┘ │
│              │  ║   • Incident Markers        ║  │                     │
│ Vehicle List:│  ║   • Real-time Movement     ║  │  📱 COT-POL-0045    │
│              │  ║   • Tallahassee Boundary   ║  │  Police • Active    │
│ COT-POL-0045 │  ╚════════════════════════════╝  │  ─────────────────  │
│ COT-FIR-0012 │                                  │                     │
│ COT-PUB-0089 │                                  │  ┌────────────────┐ │
│ COT-TRA-0020 │                                  │  │ Speed │   RPM  │ │
│ COT-UTI-0005 │                                  │  │  35   │  2100  │ │
│      ...     │                                  │  ├────────────────┤ │
│              │                                  │  │ Fuel  │  Temp  │ │
│ (300 total)  │                                  │  │  78%  │  192°  │ │
│              │                                  │  └────────────────┘ │
│              │                                  │                     │
│              │                                  │    ┌───────────┐   │
│              │                                  │    │    🎤     │◄──┼─ PTT!
│              │                                  │    └───────────┘   │
│              │                                  │   Hold to speak    │
│              │                                  │                     │
│              │                                  │  ┌───────────────┐ │
│              │                                  │  │ Listening...  │ │
│              │                                  │  │ Create a fire │ │
│              │                                  │  └───────────────┘ │
└──────────────┴──────────────────────────────────┴─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         CHAT INPUT AREA                                 │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Type command... (e.g., "create a fire at Monroe St")          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│  [Send Command]                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Differences

### Main Chat Input (Bottom)
- **Location**: Bottom center of entire dashboard
- **Always visible**: Yes
- **Used by**: Dispatcher/Admin
- **Purpose**: Control entire simulation
- **Commands**: Global actions
- **Examples**:
  - "Create a fire at Monroe St" → Creates incident for any available unit
  - "Show status" → System-wide statistics
  - "Mass casualty incident downtown" → Creates multiple incidents

### Mobile PTT Button (Right Panel)
- **Location**: Inside mobile app simulator (right panel)
- **Visible when**: A vehicle is selected
- **Used by**: Individual driver/operator
- **Purpose**: Report from vehicle's perspective
- **Commands**: Contextual to selected vehicle
- **Examples**:
  - "Structure fire at Monroe St" → Report from this vehicle
  - "10-4, en route" → This vehicle acknowledging
  - "Arrived on scene" → This vehicle's status update

## Realistic Use Case Scenario

### Scenario: Structure Fire Response

**1. Dispatcher (Main Chat)**
```
Dispatcher types: "Create a structure fire at 100 N Monroe St"
Result:
  - Incident created in database
  - System finds nearest fire units
  - TFD-E1, TFD-L2, TFD-R1 dispatched automatically
  - Radio transmissions generated
```

**2. Driver TFD-E1 (Mobile PTT)**
```
User selects vehicle "TFD-E1" from sidebar
Mobile app opens in right panel
Driver holds PTT button
Driver says: "TFD-E1, 10-4, en route from Station 1"
Result:
  - Radio transmission logged
  - Unit status updated to "en_route"
  - ETA calculated
  - Dispatch notified
```

**3. Driver TFD-E1 Arrives (Mobile PTT)**
```
Mobile view still showing TFD-E1
Driver holds PTT
Driver says: "TFD-E1 on scene, working structure fire"
Result:
  - Incident status updated to "on_scene"
  - Time stamped
  - Other units notified
```

**4. Driver Reports Situation (Mobile PTT)**
```
Driver holds PTT
Driver says: "TFD-E1, requesting additional ambulance, possible injuries"
Result:
  - Medical incident created
  - Ambulance dispatched
  - Incident priority escalated
```

**5. Dispatcher Monitors (Main Dashboard)**
```
Sees all updates in real-time:
  - Incident markers on map
  - Radio feed shows all transmissions
  - Unit status indicators
  - Can issue additional commands via main chat
```

## Why This Approach?

### ✅ Realistic
- Separates dispatcher and driver roles
- Mimics real emergency services workflow
- Shows proper chain of command

### ✅ Intuitive
- Drivers use vehicle's mobile interface (PTT)
- Dispatchers use command center interface (chat)
- Clear separation of concerns

### ✅ Educational
- Demonstrates proper radio procedures
- Shows incident lifecycle
- Illustrates coordination between roles

### ✅ Interactive
- Multiple users can participate
- One person as dispatcher
- Others as drivers
- Realistic training scenarios

### ✅ Professional
- Matches real-world systems
- Appropriate for stakeholder demos
- Shows technical sophistication

## Summary

**Main Chat (Bottom)**: "God mode" - Create/control anything
**Mobile PTT (Right)**: "Driver mode" - Report from vehicle's perspective

Both work together to create a **complete emergency response simulation**! 🚒🚔

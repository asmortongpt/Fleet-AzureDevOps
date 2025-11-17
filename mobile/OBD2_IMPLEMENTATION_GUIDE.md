# OBD2 Live Metrics Dashboard - Implementation Guide

## Overview

A complete, production-ready OBD2 diagnostics and live metrics dashboard for the Fleet mobile app. This implementation provides real-time vehicle health monitoring, diagnostic trouble code (DTC) management, and comprehensive vehicle health scoring.

## Architecture

```
mobile/src/
├── components/
│   ├── OBD2Dashboard.tsx    # Main dashboard component
│   ├── Gauge.tsx             # Circular gauge visualization
│   └── DTCCard.tsx           # DTC code display card
├── services/
│   └── VehicleHealthScore.ts # Health scoring algorithm
└── types/
    └── obd2.ts               # Complete type definitions
```

## Components

### 1. OBD2Dashboard Component

**Location**: `/home/user/Fleet/mobile/src/components/OBD2Dashboard.tsx`

The main dashboard component that orchestrates all OBD2 functionality.

#### Features:
- Real-time connection status indicator
- Vehicle health score display (0-100)
- Live gauge displays (RPM, Speed, Coolant Temp, Fuel Level)
- Additional metrics grid (Battery, Engine Load, Throttle, MAF)
- DTC code list with full details
- Readiness monitors status grid
- Pull-to-refresh functionality
- Clear codes functionality
- Work order creation integration

#### Props:
```typescript
interface OBD2DashboardProps {
  vehicleId: string;
  diagnostics: VehicleDiagnostics | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onClearCodes?: (codes: string[]) => void;
  onCreateWorkOrder?: (dtcCode: string) => void;
}
```

#### Usage Example:
```tsx
import OBD2Dashboard from './components/OBD2Dashboard';

function VehicleDiagnosticsScreen({ vehicleId }) {
  const [diagnostics, setDiagnostics] = useState(null);

  const handleRefresh = async () => {
    // Fetch latest diagnostics data
    const data = await fetchVehicleDiagnostics(vehicleId);
    setDiagnostics(data);
  };

  const handleConnect = async () => {
    // Connect to OBD2 adapter
    await connectToAdapter(vehicleId);
  };

  const handleClearCodes = async (codes: string[]) => {
    // Clear specified DTC codes
    await clearDTCCodes(vehicleId, codes);
    handleRefresh();
  };

  return (
    <OBD2Dashboard
      vehicleId={vehicleId}
      diagnostics={diagnostics}
      onRefresh={handleRefresh}
      onConnect={handleConnect}
      onClearCodes={handleClearCodes}
      onCreateWorkOrder={(code) => {
        navigation.navigate('CreateWorkOrder', { dtcCode: code });
      }}
    />
  );
}
```

---

### 2. Gauge Component

**Location**: `/home/user/Fleet/mobile/src/components/Gauge.tsx`

A highly customizable circular gauge visualization with animated needle.

#### Features:
- Smooth spring animations using react-native-reanimated
- Color zones (green/yellow/red)
- Configurable min/max values
- Tick marks for easy reading
- Status indicator dot
- Value display with units
- Responsive sizing

#### Props:
```typescript
interface GaugeProps {
  config: GaugeConfig;
  value: number;
  size?: number;          // Default: 180
  animated?: boolean;     // Default: true
  showValue?: boolean;    // Default: true
  showLabel?: boolean;    // Default: true
}
```

#### Usage Example:
```tsx
import Gauge from './components/Gauge';
import { GAUGE_CONFIGS } from './types/obd2';

function LiveMetrics({ rpm, speed }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Gauge
        config={GAUGE_CONFIGS.rpm}
        value={rpm}
        size={160}
      />
      <Gauge
        config={GAUGE_CONFIGS.speed}
        value={speed}
        size={160}
      />
    </View>
  );
}
```

#### Predefined Gauge Configurations:
- `GAUGE_CONFIGS.rpm` - Engine RPM (0-8000)
- `GAUGE_CONFIGS.speed` - Vehicle Speed (0-140 mph)
- `GAUGE_CONFIGS.coolantTemp` - Coolant Temperature (0-300°F)
- `GAUGE_CONFIGS.fuelLevel` - Fuel Level (0-100%)
- `GAUGE_CONFIGS.oilPressure` - Oil Pressure (0-100 PSI)
- `GAUGE_CONFIGS.batteryVoltage` - Battery Voltage (0-16V)

---

### 3. DTCCard Component

**Location**: `/home/user/Fleet/mobile/src/components/DTCCard.tsx`

Displays diagnostic trouble codes with full details and actionable items.

#### Features:
- Severity-based color coding (Critical/Warning/Info)
- Timestamp display with relative formatting
- Possible causes list
- Recommended actions
- Freeze frame data display
- Create work order button
- Clear code action
- Online search integration

#### Props:
```typescript
interface DTCCardProps {
  dtc: DTCCode;
  onCreateWorkOrder?: (dtcCode: string) => void;
  onClearCode?: (dtcCode: string) => void;
  onViewDetails?: (dtcCode: string) => void;
  showActions?: boolean;
}
```

#### Usage Example:
```tsx
import DTCCard from './components/DTCCard';

function DTCList({ dtcCodes }) {
  return (
    <ScrollView>
      {dtcCodes.map(dtc => (
        <DTCCard
          key={dtc.code}
          dtc={dtc}
          onCreateWorkOrder={(code) => {
            navigation.navigate('CreateWorkOrder', { dtcCode: code });
          }}
          onClearCode={async (code) => {
            await clearDTCCode(vehicleId, code);
          }}
        />
      ))}
    </ScrollView>
  );
}
```

---

### 4. VehicleHealthScore Service

**Location**: `/home/user/Fleet/mobile/src/services/VehicleHealthScore.ts`

Calculates comprehensive vehicle health score based on multiple factors.

#### Health Score Algorithm:

**Weighted Components:**
- **DTC Codes (35%)**: Critical DTCs = -30 points, Warning = -15, Info = -5
- **Live Metrics (30%)**: Evaluates coolant temp, oil pressure, battery voltage, engine load, fuel trim
- **Readiness Monitors (20%)**: Percentage of monitors complete
- **Maintenance Schedule (15%)**: Time and mileage since last service

**Score Ranges:**
- **80-100**: Low Risk (Green) - Vehicle in excellent condition
- **60-79**: Moderate Risk (Yellow) - Some attention needed
- **40-59**: High Risk (Orange) - Service recommended soon
- **0-39**: Critical Risk (Red) - Immediate attention required

#### Features:
- Automatic recommendation generation
- Priority-based action items
- Cost estimates for repairs
- Integration with freeze frame data
- Metric threshold monitoring
- Service interval tracking

#### Usage Example:
```tsx
import { calculateVehicleHealth } from './services/VehicleHealthScore';

function calculateHealth(vehicle) {
  const healthScore = calculateVehicleHealth(
    vehicle.dtcCodes,
    vehicle.liveData,
    vehicle.readinessMonitors,
    vehicle.vehicleInfo
  );

  console.log('Total Score:', healthScore.totalScore);
  console.log('Risk Level:', healthScore.riskLevel);
  console.log('Recommendations:', healthScore.recommendations);

  return healthScore;
}
```

---

### 5. Type Definitions

**Location**: `/home/user/Fleet/mobile/src/types/obd2.ts`

Complete TypeScript type definitions for OBD2 data.

#### Key Types:

**DTC Types:**
- `DTCCode` - Complete DTC information
- `DTCSeverity` - Critical, Warning, Informational
- `DTCStatus` - Active, Pending, Permanent, Cleared
- `DTCCategory` - Powertrain (P), Chassis (C), Body (B), Network (U)

**Live Data:**
- `LivePIDData` - Complete set of OBD2 PIDs
- `FreezeFrameData` - Snapshot when DTC occurred
- `O2SensorData` - Oxygen sensor readings

**Connection:**
- `OBD2Adapter` - Adapter information
- `AdapterConnection` - Connection state
- `ConnectionStatus` - Disconnected, Connecting, Connected, Error
- `AdapterType` - Bluetooth, WiFi, USB

**Readiness:**
- `ReadinessMonitors` - All emission system monitors
- `MonitorStatus` - Complete, Incomplete, Not Supported

**Vehicle:**
- `VehicleInfo` - Make, model, year, VIN, etc.
- `VehicleDiagnostics` - Complete diagnostic state

#### Common DTC Descriptions:

The types file includes descriptions and causes for common DTCs:
- P0300 - Random/Multiple Cylinder Misfire
- P0301-P0304 - Cylinder 1-4 Misfire
- P0420/P0430 - Catalyst System Efficiency Below Threshold
- P0171/P0174 - System Too Lean
- P0442/P0455 - EVAP System Leak
- P0128 - Coolant Thermostat Issue
- P0340/P0335 - Cam/Crank Position Sensor
- And many more...

---

## Installation & Dependencies

### Required Dependencies:

```bash
npm install react-native-svg react-native-reanimated
```

### Dependency Details:

1. **react-native-svg** (v13.0+)
   - Used for gauge rendering
   - Provides Circle, Path, Line, G components
   - Lightweight and performant

2. **react-native-reanimated** (v3.0+)
   - Powers smooth gauge animations
   - Spring-based needle movement
   - Runs on UI thread for 60fps

### Setup:

1. **iOS Configuration** (ios/Podfile):
```ruby
pod 'react-native-reanimated', :path => '../node_modules/react-native-reanimated'
```

Then run:
```bash
cd ios && pod install
```

2. **Android Configuration** (android/app/build.gradle):
```gradle
// Already included with react-native-reanimated
```

3. **Babel Configuration** (babel.config.js):
```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['react-native-reanimated/plugin'], // Must be last
};
```

---

## Color Standards

The implementation follows consistent color coding:

### Status Colors:
- **Green (#10b981)**: Normal operation
- **Yellow (#f59e0b)**: Warning condition
- **Orange (#fb923c)**: High risk
- **Red (#ef4444)**: Critical condition
- **Blue (#3b82f6)**: Informational
- **Gray (#6b7280)**: Neutral/Disabled

### Severity Levels:
- **Critical**: Red background (#fee2e2), Red text (#ef4444)
- **Warning**: Amber background (#fef3c7), Amber text (#f59e0b)
- **Info**: Blue background (#dbeafe), Blue text (#3b82f6)

---

## Data Flow

```
┌─────────────────────┐
│  OBD2 Adapter       │
│  (Bluetooth/WiFi)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Backend API        │
│  /api/vehicles/:id/ │
│  diagnostics        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Mobile App         │
│  - Fetch Data       │
│  - Calculate Health │
│  - Render Dashboard │
└─────────────────────┘
```

### Real-time Updates:

For live streaming data, implement WebSocket or polling:

```typescript
// WebSocket example
const ws = new WebSocket('wss://api.fleet.com/vehicles/123/live');

ws.onmessage = (event) => {
  const liveData = JSON.parse(event.data);
  setDiagnostics(prev => ({
    ...prev,
    liveData: {
      isStreaming: true,
      frequency: 1, // 1 Hz
      lastUpdate: new Date(),
      data: liveData,
    }
  }));
};

// Polling example
useEffect(() => {
  const interval = setInterval(async () => {
    const data = await fetchLiveData(vehicleId);
    updateLiveData(data);
  }, 1000); // Update every second

  return () => clearInterval(interval);
}, [vehicleId]);
```

---

## Health Score Examples

### Example 1: Healthy Vehicle
```typescript
Input:
- DTCs: [] (no codes)
- Coolant Temp: 195°F (normal)
- Battery: 14.2V (good)
- Oil Pressure: 45 PSI (good)
- Readiness: 100% complete
- Last Service: 2 months ago

Output:
{
  totalScore: 95,
  riskLevel: RiskLevel.LOW,
  recommendations: [
    "Continue regular maintenance schedule"
  ]
}
```

### Example 2: Multiple Issues
```typescript
Input:
- DTCs: [P0301 (Critical), P0420 (Warning)]
- Coolant Temp: 240°F (high)
- Battery: 12.2V (low)
- Oil Pressure: 15 PSI (critical)
- Readiness: 60% complete
- Last Service: 8 months ago

Output:
{
  totalScore: 35,
  riskLevel: RiskLevel.CRITICAL,
  recommendations: [
    "Critical Low Oil Pressure - Stop engine",
    "Critical: P0301 - Cylinder 1 Misfire",
    "High Coolant Temperature",
    "Low Battery Voltage",
    "Warning: P0420 - Catalyst Efficiency",
    "Scheduled Maintenance Overdue"
  ]
}
```

---

## Testing

### Unit Tests:

```typescript
// VehicleHealthScore.test.ts
import { calculateVehicleHealth } from './services/VehicleHealthScore';

describe('VehicleHealthScore', () => {
  it('should return 100 for healthy vehicle', () => {
    const result = calculateVehicleHealth(
      [], // No DTCs
      mockHealthyLiveData,
      mockCompleteReadiness,
      mockRecentlyServicedVehicle
    );

    expect(result.totalScore).toBeGreaterThanOrEqual(90);
    expect(result.riskLevel).toBe(RiskLevel.LOW);
  });

  it('should deduct points for critical DTCs', () => {
    const result = calculateVehicleHealth(
      [mockCriticalDTC],
      mockHealthyLiveData,
      mockCompleteReadiness,
      mockRecentlyServicedVehicle
    );

    expect(result.totalScore).toBeLessThan(90);
    expect(result.dtcScore).toBe(70); // -30 for critical
  });
});
```

### Component Tests:

```typescript
// Gauge.test.tsx
import { render } from '@testing-library/react-native';
import Gauge from './components/Gauge';
import { GAUGE_CONFIGS } from './types/obd2';

describe('Gauge', () => {
  it('should render with correct value', () => {
    const { getByText } = render(
      <Gauge config={GAUGE_CONFIGS.rpm} value={3000} />
    );

    expect(getByText('3000')).toBeTruthy();
    expect(getByText('RPM')).toBeTruthy();
  });

  it('should use correct color for value', () => {
    const { container } = render(
      <Gauge config={GAUGE_CONFIGS.rpm} value={7500} />
    );

    // Should be red for critical RPM
    expect(container).toMatchSnapshot();
  });
});
```

---

## Performance Considerations

### Optimization Tips:

1. **Gauge Rendering**:
   - Gauges use native thread animations (reanimated)
   - No re-renders during animation
   - 60fps smooth needle movement

2. **DTC List**:
   - Use FlatList for long lists (>10 items)
   - Implement virtualization
   - Memoize DTC cards

3. **Live Data Updates**:
   - Throttle updates to 1-2 Hz for smooth UI
   - Use WebSocket for real-time streaming
   - Implement connection timeout handling

4. **Health Score Calculation**:
   - Memoize calculation results
   - Only recalculate when data changes
   - Cache recommendations

### Example Optimization:

```typescript
import { useMemo } from 'react';

function OptimizedDashboard({ diagnostics }) {
  // Memoize health score calculation
  const healthScore = useMemo(() => {
    return calculateVehicleHealth(
      diagnostics.dtcCodes,
      diagnostics.liveData?.data,
      diagnostics.readinessMonitors,
      diagnostics.vehicleInfo
    );
  }, [diagnostics.dtcCodes, diagnostics.liveData, diagnostics.readinessMonitors]);

  // Memoize sorted DTCs
  const sortedDTCs = useMemo(() => {
    return [...diagnostics.dtcCodes].sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, informational: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [diagnostics.dtcCodes]);

  return <OBD2Dashboard healthScore={healthScore} dtcCodes={sortedDTCs} />;
}
```

---

## Future Enhancements

1. **Advanced Analytics**:
   - Historical trend charts
   - Predictive maintenance alerts
   - Comparison with fleet averages

2. **Enhanced Visualizations**:
   - 3D engine visualization
   - Heat maps for problem areas
   - Animation for active issues

3. **Additional Features**:
   - Export diagnostic reports (PDF)
   - Share codes with mechanics
   - Integration with repair databases
   - Voice alerts for critical issues
   - Augmented reality for under-hood diagnostics

4. **Machine Learning**:
   - Anomaly detection
   - Failure prediction
   - Personalized maintenance schedules

---

## Troubleshooting

### Common Issues:

**Issue**: Gauge animations not smooth
- **Solution**: Ensure react-native-reanimated plugin is last in babel.config.js
- **Solution**: Clear metro cache: `npx react-native start --reset-cache`

**Issue**: SVG components not rendering
- **Solution**: Install react-native-svg: `npm install react-native-svg`
- **Solution**: Run pod install for iOS

**Issue**: Health score always showing 0
- **Solution**: Check that vehicle data is properly formatted
- **Solution**: Verify all required fields are present

**Issue**: Connection status not updating
- **Solution**: Implement proper WebSocket reconnection logic
- **Solution**: Add timeout handling for connection attempts

---

## API Integration

### Expected Backend Endpoints:

```typescript
// GET /api/vehicles/:id/diagnostics
// Returns current diagnostic state
interface DiagnosticsResponse {
  connection: AdapterConnection;
  vehicleInfo: VehicleInfo;
  dtcCodes: DTCCode[];
  readinessMonitors: ReadinessMonitors;
  liveData?: LiveDataStream;
  lastDiagnosticTime: Date;
  milStatus: boolean;
  dtcCount: number;
}

// POST /api/vehicles/:id/connect
// Connect to OBD2 adapter
interface ConnectRequest {
  adapterId: string;
}

// DELETE /api/vehicles/:id/dtc-codes
// Clear DTC codes
interface ClearCodesRequest {
  codes: string[];
  confirmedBy: string;
  reason?: string;
}

// WebSocket: wss://api.fleet.com/vehicles/:id/live
// Real-time live data streaming
interface LiveDataMessage {
  timestamp: Date;
  rpm: number;
  speed: number;
  coolantTemp: number;
  // ... other PIDs
}
```

---

## License

Part of the Fleet Management System. All rights reserved.

---

## Support

For questions or issues:
- GitHub Issues: [Fleet Mobile Issues]
- Documentation: [Fleet Docs]
- Email: support@fleet.com

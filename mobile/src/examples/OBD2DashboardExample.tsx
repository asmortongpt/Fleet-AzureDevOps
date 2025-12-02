/**
 * OBD2 Dashboard Example
 * Complete working example showing how to integrate the OBD2 dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import OBD2Dashboard from '../components/OBD2Dashboard';
import {
  VehicleDiagnostics,
  DTCCode,
  DTCSeverity,
  DTCStatus,
  DTCCategory,
  ConnectionStatus,
  AdapterType,
  OBD2Protocol,
  MonitorStatus,
  FuelSystemStatus,
  EngineType,
  FuelType,
  TransmissionType,
  COMMON_DTC_DESCRIPTIONS,
} from '../types/obd2';

// ============================================================================
// Mock Data for Demo
// ============================================================================

const mockVehicleInfo = {
  vin: '1HGBH41JXMN109186',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  engineType: EngineType.SPARK_IGNITION,
  fuelType: FuelType.GASOLINE,
  transmission: TransmissionType.AUTOMATIC,
  odometer: 35420,
  lastServiceDate: new Date('2024-09-15'),
  lastServiceOdometer: 32500,
};

const mockAdapter = {
  id: 'obd-adapter-001',
  name: 'ELM327 Bluetooth',
  type: AdapterType.BLUETOOTH,
  macAddress: '00:1B:DC:0F:22:33',
  protocol: OBD2Protocol.ISO_15765_4_CAN,
  firmwareVersion: '2.1',
};

const mockLiveData = {
  timestamp: new Date(),
  rpm: 2450,
  speed: 55,
  coolantTemp: 88, // Celsius
  engineLoad: 42,
  throttlePosition: 35,
  fuelLevel: 68,
  fuelPressure: 350,
  intakeAirTemp: 32,
  maf: 18.5,
  oilTemp: 95,
  oilPressure: 275, // kPa (converted to PSI in display)
  batteryVoltage: 14.2,
  ambientAirTemp: 24,
  shortTermFuelTrim: -2.5,
  longTermFuelTrim: 1.8,
  fuelSystemStatus: FuelSystemStatus.CLOSED_LOOP,
  timingAdvance: 12.5,
  barometricPressure: 101.3,
  intakeManifoldPressure: 35,
  o2Sensor1: {
    voltage: 0.45,
    shortTermFuelTrim: -2.5,
  },
  distanceSinceClear: 1250,
  runtimeSinceStart: 1825,
};

const mockDTCCodes: DTCCode[] = [
  {
    code: 'P0420',
    description: COMMON_DTC_DESCRIPTIONS.P0420.description,
    severity: DTCSeverity.WARNING,
    status: DTCStatus.ACTIVE,
    category: DTCCategory.POWERTRAIN,
    detectedAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
    possibleCauses: COMMON_DTC_DESCRIPTIONS.P0420.causes,
    recommendedActions: [
      'Inspect catalytic converter',
      'Check oxygen sensors',
      'Verify exhaust system for leaks',
    ],
    freezeFrameData: {
      code: 'P0420',
      timestamp: new Date(Date.now() - 86400000 * 3),
      rpm: 2200,
      speed: 62,
      coolantTemp: 190,
      engineLoad: 45,
      throttlePosition: 28,
      fuelPressure: 340,
      intakeAirTemp: 85,
      maf: 16.8,
      shortTermFuelTrim: -3.2,
      longTermFuelTrim: 2.1,
    },
  },
  {
    code: 'P0442',
    description: COMMON_DTC_DESCRIPTIONS.P0442.description,
    severity: DTCSeverity.INFORMATIONAL,
    status: DTCStatus.ACTIVE,
    category: DTCCategory.POWERTRAIN,
    detectedAt: new Date(Date.now() - 86400000), // 1 day ago
    possibleCauses: COMMON_DTC_DESCRIPTIONS.P0442.causes,
    recommendedActions: [
      'Check gas cap for proper seal',
      'Inspect EVAP hoses for cracks',
      'Test purge valve operation',
    ],
  },
];

const mockReadinessMonitors = {
  misfire: MonitorStatus.COMPLETE,
  fuelSystem: MonitorStatus.COMPLETE,
  components: MonitorStatus.COMPLETE,
  catalyst: MonitorStatus.INCOMPLETE,
  heatedCatalyst: MonitorStatus.COMPLETE,
  evaporativeSystem: MonitorStatus.COMPLETE,
  secondaryAirSystem: MonitorStatus.NOT_SUPPORTED,
  acRefrigerant: MonitorStatus.NOT_SUPPORTED,
  oxygenSensor: MonitorStatus.COMPLETE,
  oxygenSensorHeater: MonitorStatus.COMPLETE,
  egrSystem: MonitorStatus.COMPLETE,
};

// ============================================================================
// Example Component
// ============================================================================

export default function OBD2DashboardExample() {
  const [diagnostics, setDiagnostics] = useState<VehicleDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize with mock data
   */
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setDiagnostics({
        connection: {
          adapter: mockAdapter,
          status: ConnectionStatus.CONNECTED,
          connectedAt: new Date(Date.now() - 3600000), // 1 hour ago
          lastDataReceived: new Date(),
          signalStrength: 95,
        },
        vehicleInfo: mockVehicleInfo,
        dtcCodes: mockDTCCodes,
        readinessMonitors: mockReadinessMonitors,
        liveData: {
          isStreaming: true,
          frequency: 1,
          pids: ['0C', '0D', '05', '04', '11', '2F'],
          lastUpdate: new Date(),
          data: mockLiveData,
        },
        healthScore: 0, // Will be calculated by dashboard
        lastDiagnosticTime: new Date(),
        milStatus: true,
        dtcCount: mockDTCCodes.length,
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  /**
   * Simulate live data updates
   */
  useEffect(() => {
    if (!diagnostics || diagnostics.connection.status !== ConnectionStatus.CONNECTED) {
      return;
    }

    const interval = setInterval(() => {
      setDiagnostics((prev) => {
        if (!prev) return prev;

        // Simulate realistic data changes
        const baseRpm = 2000;
        const rpmVariation = Math.sin(Date.now() / 1000) * 500;
        const newRpm = Math.round(baseRpm + rpmVariation);

        const baseSpeed = 55;
        const speedVariation = Math.sin(Date.now() / 1500) * 10;
        const newSpeed = Math.round(Math.max(0, baseSpeed + speedVariation));

        return {
          ...prev,
          liveData: prev.liveData
            ? {
                ...prev.liveData,
                lastUpdate: new Date(),
                data: {
                  ...prev.liveData.data,
                  rpm: newRpm,
                  speed: newSpeed,
                  throttlePosition: Math.round(
                    30 + Math.sin(Date.now() / 2000) * 20
                  ),
                  engineLoad: Math.round(
                    40 + Math.sin(Date.now() / 1800) * 15
                  ),
                  runtimeSinceStart: prev.liveData.data.runtimeSinceStart + 1,
                },
              }
            : undefined,
        };
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [diagnostics?.connection.status]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    console.log('Refreshing diagnostics data...');

    // In a real app, this would fetch from API
    // await fetchVehicleDiagnostics(vehicleId);

    // For demo, just update timestamp
    setDiagnostics((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lastDiagnosticTime: new Date(),
        connection: {
          ...prev.connection,
          lastDataReceived: new Date(),
        },
      };
    });
  }, []);

  /**
   * Handle connect to adapter
   */
  const handleConnect = useCallback(async () => {
    console.log('Connecting to OBD2 adapter...');

    // Simulate connection process
    setDiagnostics((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        connection: {
          ...prev.connection,
          status: ConnectionStatus.CONNECTING,
        },
      };
    });

    // In a real app, this would connect to the adapter
    // await connectToAdapter(adapterId);

    setTimeout(() => {
      setDiagnostics((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          connection: {
            ...prev.connection,
            status: ConnectionStatus.CONNECTED,
            connectedAt: new Date(),
            lastDataReceived: new Date(),
          },
        };
      });
    }, 2000);
  }, []);

  /**
   * Handle disconnect from adapter
   */
  const handleDisconnect = useCallback(async () => {
    console.log('Disconnecting from OBD2 adapter...');

    // In a real app, this would disconnect from the adapter
    // await disconnectFromAdapter();

    setDiagnostics((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        connection: {
          ...prev.connection,
          status: ConnectionStatus.DISCONNECTED,
        },
        liveData: undefined,
      };
    });
  }, []);

  /**
   * Handle clear DTC codes
   */
  const handleClearCodes = useCallback(async (codes: string[]) => {
    console.log('Clearing DTC codes:', codes);

    // In a real app, this would send request to backend
    // await clearDTCCodes(vehicleId, codes);

    // For demo, remove from local state
    setDiagnostics((prev) => {
      if (!prev) return prev;

      const remainingCodes = prev.dtcCodes.filter(
        (dtc) => !codes.includes(dtc.code)
      );

      return {
        ...prev,
        dtcCodes: remainingCodes,
        dtcCount: remainingCodes.length,
        milStatus: remainingCodes.length > 0,
      };
    });

    console.log(`Successfully cleared ${codes.length} code(s)`);
  }, []);

  /**
   * Handle create work order
   */
  const handleCreateWorkOrder = useCallback((dtcCode: string) => {
    console.log('Creating work order for DTC:', dtcCode);

    // In a real app, navigate to work order creation screen
    // navigation.navigate('CreateWorkOrder', {
    //   vehicleId: mockVehicleInfo.vin,
    //   dtcCode: dtcCode,
    //   description: 'Diagnostic trouble code detected',
    // });

    // For demo, just log
    alert(`Work Order Creation\n\nDTC: ${dtcCode}\nVehicle: ${mockVehicleInfo.year} ${mockVehicleInfo.make} ${mockVehicleInfo.model}`);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <OBD2Dashboard
        vehicleId={mockVehicleInfo.vin}
        diagnostics={diagnostics}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onClearCodes={handleClearCodes}
        onCreateWorkOrder={handleCreateWorkOrder}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});

// ============================================================================
// API Integration Example (Real Implementation)
// ============================================================================

/**
 * Real implementation would use actual API calls
 */

/*
// services/obd2-api.ts
import axios from 'axios';

const API_BASE_URL = 'https://api.fleet.com';

export const fetchVehicleDiagnostics = async (
  vehicleId: string
): Promise<VehicleDiagnostics> => {
  const response = await axios.get(
    `${API_BASE_URL}/vehicles/${vehicleId}/diagnostics`
  );
  return response.data;
};

export const connectToAdapter = async (
  vehicleId: string,
  adapterId: string
): Promise<void> => {
  await axios.post(`${API_BASE_URL}/vehicles/${vehicleId}/connect`, {
    adapterId,
  });
};

export const disconnectFromAdapter = async (
  vehicleId: string
): Promise<void> => {
  await axios.post(`${API_BASE_URL}/vehicles/${vehicleId}/disconnect`);
};

export const clearDTCCodes = async (
  vehicleId: string,
  codes: string[],
  userId: string
): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/vehicles/${vehicleId}/dtc-codes`, {
    data: {
      codes,
      confirmedBy: userId,
    },
  });
};

// WebSocket for live data
export const connectLiveData = (
  vehicleId: string,
  onData: (data: LivePIDData) => void,
  onError: (error: Error) => void
): WebSocket => {
  const ws = new WebSocket(`wss://api.fleet.com/vehicles/${vehicleId}/live`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onData(data);
  };

  ws.onerror = (error) => {
    onError(new Error('WebSocket error'));
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };

  return ws;
};
*/

# Hardware Configuration Panel

A comprehensive React component for managing vehicle hardware provider configurations in the Fleet Management System.

## Overview

The `HardwareConfigurationPanel` allows fleet managers to configure, manage, and monitor which hardware providers (Smartcar, Samsara, OBD2, Teltonika) each vehicle uses for telemetry data collection.

## Features

### 1. Provider Management
- **Add Providers**: Configure new hardware providers with provider-specific settings
- **Remove Providers**: Safely remove providers with confirmation dialog
- **Test Connections**: Verify provider connectivity in real-time
- **Configure Settings**: Edit provider-specific configurations

### 2. Supported Providers

#### Smartcar
- OAuth-based connection
- OEM telematics integration
- One-click authorization flow

#### Samsara
- API token authentication
- External vehicle ID mapping
- Fleet management platform integration

#### Teltonika
- GPS tracking device support
- Multiple device models (FM1120, FM3200, FM4200, FM5300)
- RFID reader support
- Starter disable capability
- IMEI-based device identification

#### OBD2 Mobile
- Mobile app pairing
- Step-by-step setup instructions
- Vehicle-specific pairing codes

### 3. Visual Features
- **Status Indicators**: Real-time connection status (online/offline/error)
- **Capability Badges**: Visual display of provider capabilities
- **Provider Icons**: Color-coded icons for each provider type
- **Expandable Details**: View detailed configuration and diagnostics
- **Last Sync Time**: Track when data was last synchronized

### 4. User Experience
- Loading states with spinners
- Error handling with retry capability
- Confirmation dialogs for destructive actions
- Responsive design (mobile-friendly)
- Accessible UI components (ARIA labels, keyboard navigation)

## Usage

### Basic Implementation

```tsx
import { HardwareConfigurationPanel } from '@/components/vehicle/HardwareConfigurationPanel'

function VehicleDetailsPage({ vehicleId }: { vehicleId: number }) {
  return (
    <div className="p-6">
      <HardwareConfigurationPanel
        vehicleId={vehicleId}
        onProviderAdded={(provider) => {
          console.log(`Provider added: ${provider}`)
        }}
        onProviderRemoved={(provider) => {
          console.log(`Provider removed: ${provider}`)
        }}
      />
    </div>
  )
}
```

### With Event Handlers

```tsx
import { HardwareConfigurationPanel } from '@/components/vehicle/HardwareConfigurationPanel'
import { toast } from 'sonner'

function VehicleHardwareTab({ vehicleId }: { vehicleId: number }) {
  const handleProviderAdded = (provider: string) => {
    toast.success(`${provider} provider added successfully!`)
    // Refresh vehicle data or update analytics
  }

  const handleProviderRemoved = (provider: string) => {
    toast.info(`${provider} provider removed`)
    // Update fleet statistics
  }

  return (
    <HardwareConfigurationPanel
      vehicleId={vehicleId}
      onProviderAdded={handleProviderAdded}
      onProviderRemoved={handleProviderRemoved}
    />
  )
}
```

## Props

### HardwareConfigurationPanelProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `vehicleId` | `number` | Yes | The ID of the vehicle to configure |
| `onProviderAdded` | `(provider: string) => void` | No | Callback fired when a provider is added |
| `onProviderRemoved` | `(provider: string) => void` | No | Callback fired when a provider is removed |

## API Endpoints

The component expects the following API endpoints:

### GET `/api/vehicles/:id/hardware-config`
Fetch all configured providers for a vehicle.

**Response:**
```json
{
  "providers": [
    {
      "id": "prov_123",
      "type": "teltonika",
      "status": "online",
      "capabilities": ["GPS", "RFID", "Starter Disable"],
      "configuration": {
        "imei": "123456789012345",
        "deviceModel": "FM3200",
        "enableRfid": true
      },
      "lastSyncTime": "2025-01-08T12:00:00Z",
      "deviceModel": "FM3200",
      "externalId": "TLT-001"
    }
  ]
}
```

### POST `/api/vehicles/:id/hardware-config/providers`
Add a new provider to the vehicle.

**Request:**
```json
{
  "type": "samsara",
  "configuration": {
    "samsaraApiToken": "token_abc123",
    "samsaraExternalVehicleId": "281832"
  }
}
```

**Response:**
```json
{
  "provider": {
    "id": "prov_456",
    "type": "samsara",
    "status": "connected",
    "capabilities": ["GPS", "Engine Hours", "Fuel Level"],
    "configuration": { ... }
  }
}
```

### DELETE `/api/vehicles/:id/hardware-config/providers/:provider`
Remove a provider from the vehicle.

**Response:**
```json
{
  "success": true,
  "message": "Provider removed successfully"
}
```

### POST `/api/vehicles/:id/hardware-config/providers/:provider/test`
Test the connection to a provider.

**Response:**
```json
{
  "success": true,
  "message": "Connection successful",
  "latency": 142
}
```

## Component Architecture

### Main Components

1. **HardwareConfigurationPanel** (Parent)
   - Manages state for all providers
   - Handles API calls
   - Coordinates dialogs and confirmations

2. **ProviderCard**
   - Displays individual provider information
   - Handles test/remove/configure actions
   - Expandable configuration details

3. **AddProviderDialog**
   - Dynamic form based on provider type
   - Validates configuration before submission
   - Provider-specific UI elements

### State Management

- Uses React hooks (`useState`, `useEffect`)
- Local state for UI interactions
- Optimistic UI updates where appropriate
- Error boundaries for graceful failure

## Styling

The component uses:
- Tailwind CSS for utility classes
- Shadcn/ui component library
- Framer Motion for animations
- Custom color tokens from theme
- Responsive breakpoints
- Dark mode support

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus management in dialogs
- Screen reader announcements
- High contrast mode support

## Error Handling

- Network error recovery
- Invalid configuration detection
- User-friendly error messages
- Retry mechanisms
- Fallback UI states

## Performance Considerations

- Lazy loading of provider forms
- Debounced API calls
- Memoized components where beneficial
- Optimized re-renders
- Efficient state updates

## Future Enhancements

- [ ] Bulk provider operations
- [ ] Provider health monitoring dashboard
- [ ] Historical sync logs
- [ ] Advanced diagnostics panel
- [ ] Provider recommendation engine
- [ ] Multi-vehicle provider management
- [ ] Webhook configuration
- [ ] Real-time status updates via WebSocket

## Troubleshooting

### Provider Won't Connect
1. Verify API credentials are correct
2. Check network connectivity
3. Ensure vehicle is powered on
4. Test connection using the "Test Connection" button

### Configuration Not Saving
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Ensure all required fields are filled
4. Check for validation errors

### Status Not Updating
1. Refresh the page
2. Check the last sync time
3. Verify the provider service is operational
4. Test connection manually

## Related Components

- `VehicleDetailPanel` - Parent component containing hardware config
- `TelemetryDashboard` - Displays data from hardware providers
- `FleetMap` - Shows real-time location from GPS providers

## License

Copyright 2025 Capital Tech Alliance. All rights reserved.

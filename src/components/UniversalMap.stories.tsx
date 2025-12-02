import type { Meta, StoryObj } from "@storybook/react"
import { UniversalMap } from "./UniversalMap"
import { generateMockVehicles, generateMockFacilities, generateMockCameras, generateLargeVehicleDataset } from "../../.storybook/mockData"
import { withMapContainer } from "../../.storybook/decorators"

const meta = {
  title: "Maps/UniversalMap",
  component: UniversalMap,
  decorators: [withMapContainer],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
# UniversalMap Component

A robust dual map provider system with automatic fallback support. This component intelligently switches between Google Maps and Leaflet based on API key availability and can recover from errors gracefully.

## Features

- **Dual Provider Support**: Google Maps (when API key available) or Leaflet (always available)
- **Automatic Fallback**: Falls back from Google to Leaflet on errors
- **Error Boundaries**: Comprehensive error handling with user-friendly messages
- **Loading States**: Beautiful loading indicators during initialization
- **Marker Clustering**: Automatic clustering for large datasets (configurable)
- **TypeScript Support**: Full type safety with strict null checks
- **React 19 Compatible**: Proper cleanup and effect management

## Provider Selection

The map automatically selects the best provider:
1. If \`forceProvider\` prop is set, uses that provider
2. If Google Maps API key is available and was previously selected, uses Google Maps
3. Otherwise, defaults to Leaflet (free, no API key required)

## Performance

- Clustering is automatically enabled when marker count exceeds threshold (default: 100)
- Debounced marker updates to prevent excessive re-renders
- Efficient memory management with proper cleanup
        `,
      },
    },
  },
  argTypes: {
    vehicles: {
      description: "Array of vehicles to display on the map",
      control: { type: "object" },
    },
    facilities: {
      description: "Array of GIS facilities to display on the map",
      control: { type: "object" },
    },
    cameras: {
      description: "Array of traffic cameras to display on the map",
      control: { type: "object" },
    },
    showVehicles: {
      description: "Whether to show vehicle markers",
      control: { type: "boolean" },
    },
    showFacilities: {
      description: "Whether to show facility markers",
      control: { type: "boolean" },
    },
    showCameras: {
      description: "Whether to show camera markers",
      control: { type: "boolean" },
    },
    center: {
      description: "Map center coordinates [latitude, longitude]",
      control: { type: "object" },
    },
    zoom: {
      description: "Initial zoom level (1-20)",
      control: { type: "range", min: 1, max: 20, step: 1 },
    },
    forceProvider: {
      description: "Force a specific map provider",
      control: { type: "select" },
      options: ["leaflet", "google"],
    },
    enableClustering: {
      description: "Enable marker clustering for performance",
      control: { type: "boolean" },
    },
    clusterThreshold: {
      description: "Minimum markers before clustering activates",
      control: { type: "number" },
    },
    onMapReady: { action: "map-ready" },
    onMapError: { action: "map-error" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof UniversalMap>

export default meta
type Story = StoryObj<typeof meta>

// Default story with all marker types
export const Default: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    center: [30.4383, -84.2807],
    zoom: 13,
    enableClustering: false,
  },
}

// Vehicles only
export const VehiclesOnly: Story = {
  args: {
    vehicles: generateMockVehicles(15),
    facilities: [],
    cameras: [],
    showVehicles: true,
    showFacilities: false,
    showCameras: false,
    center: [30.4383, -84.2807],
    zoom: 13,
  },
  parameters: {
    docs: {
      description: {
        story: "Display only vehicle markers without facilities or cameras.",
      },
    },
  },
}

// Facilities only
export const FacilitiesOnly: Story = {
  args: {
    vehicles: [],
    facilities: generateMockFacilities(8),
    cameras: [],
    showVehicles: false,
    showFacilities: true,
    showCameras: false,
    center: [30.4383, -84.2807],
    zoom: 12,
  },
  parameters: {
    docs: {
      description: {
        story: "Display only facility markers without vehicles or cameras.",
      },
    },
  },
}

// All markers displayed
export const AllMarkers: Story = {
  args: {
    vehicles: generateMockVehicles(20),
    facilities: generateMockFacilities(10),
    cameras: generateMockCameras(15),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    center: [30.4383, -84.2807],
    zoom: 12,
  },
  parameters: {
    docs: {
      description: {
        story: "Display all marker types together: vehicles, facilities, and traffic cameras.",
      },
    },
  },
}

// Force Leaflet provider
export const LeafletProvider: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    forceProvider: "leaflet",
    center: [30.4383, -84.2807],
    zoom: 13,
  },
  parameters: {
    docs: {
      description: {
        story: "Force Leaflet/OpenStreetMap provider. This is the fallback provider that always works without API keys.",
      },
    },
  },
}

// Force Google Maps provider (will show error if no API key)
export const GoogleProvider: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    forceProvider: "google",
    center: [30.4383, -84.2807],
    zoom: 13,
  },
  parameters: {
    docs: {
      description: {
        story: "Force Google Maps provider. Requires VITE_GOOGLE_MAPS_API_KEY environment variable. Will fallback to Leaflet if unavailable or errors occur.",
      },
    },
  },
}

// Large dataset with clustering
export const WithClustering: Story = {
  args: {
    vehicles: generateLargeVehicleDataset(100),
    facilities: generateMockFacilities(20),
    cameras: generateMockCameras(30),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    enableClustering: true,
    clusterThreshold: 50,
    center: [30.4383, -84.2807],
    zoom: 11,
  },
  parameters: {
    docs: {
      description: {
        story: "Large dataset (150+ markers) with clustering enabled for optimal performance. Markers are grouped together and expand when zoomed in.",
      },
    },
  },
}

// Custom center and zoom
export const CustomLocation: Story = {
  args: {
    vehicles: generateMockVehicles(5),
    facilities: generateMockFacilities(2),
    cameras: [],
    showVehicles: true,
    showFacilities: true,
    showCameras: false,
    center: [40.7128, -74.0060], // New York City
    zoom: 11,
  },
  parameters: {
    docs: {
      description: {
        story: "Map centered on a custom location (New York City) with custom zoom level.",
      },
    },
  },
}

// Empty state
export const EmptyMap: Story = {
  args: {
    vehicles: [],
    facilities: [],
    cameras: [],
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    center: [30.4383, -84.2807],
    zoom: 10,
  },
  parameters: {
    docs: {
      description: {
        story: "Map with no markers. Useful for testing initial state or error conditions.",
      },
    },
  },
}

// Loading state (simulated)
export const LoadingState: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    center: [30.4383, -84.2807],
    zoom: 13,
  },
  parameters: {
    docs: {
      description: {
        story: "The map shows a loading indicator while initializing. This happens automatically during map startup.",
      },
    },
  },
}

// Toggled visibility
export const ToggledVisibility: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: false,
    showCameras: false,
    center: [30.4383, -84.2807],
    zoom: 13,
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates selective marker visibility. Toggle showVehicles, showFacilities, and showCameras to control which markers appear.",
      },
    },
  },
}

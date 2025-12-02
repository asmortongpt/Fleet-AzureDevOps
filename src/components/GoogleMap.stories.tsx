import type { Meta, StoryObj } from "@storybook/react"
import { GoogleMap } from "./GoogleMap"
import { generateMockVehicles, generateMockFacilities, generateMockCameras } from "../../.storybook/mockData"
import { withMapContainer } from "../../.storybook/decorators"

const meta = {
  title: "Maps/GoogleMap",
  component: GoogleMap,
  decorators: [withMapContainer],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
# GoogleMap Component

Production-ready Google Maps implementation with comprehensive error handling and React 19 compatibility.

## Features

- **Google Maps Platform**: Full-featured Google Maps integration
- **React 19 Compatible**: Proper cleanup and lifecycle management
- **TypeScript**: Complete type safety with Google Maps types
- **Error Recovery**: Graceful handling of API key issues and network errors
- **Loading States**: Beautiful loading indicators
- **Retry Logic**: Automatic retry on failed loads
- **Memory Safe**: Comprehensive cleanup prevents memory leaks
- **Performance**: Optimized marker management with batching

## API Key Setup

To use Google Maps, you need an API key:

1. Visit [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Enable Maps JavaScript API
3. Create an API key
4. Add to \`.env\`: \`VITE_GOOGLE_MAPS_API_KEY=your_key_here\`
5. Restart dev server

**Free Tier**: $200/month credit (~28,000 map loads for free)

## Map Types

- \`roadmap\`: Standard road map view (default)
- \`satellite\`: Satellite imagery
- \`hybrid\`: Satellite imagery with road overlay
- \`terrain\`: Terrain and vegetation map

## Markers

Markers are displayed using Google Maps' optimized rendering:
- Vehicles: Color-coded circles based on status
- Facilities: Arrow icons with status colors
- Cameras: Circles with operational status colors

## Error States

The component gracefully handles several error states:
- **Missing API Key**: Shows setup instructions
- **Network Errors**: Displays error with retry button
- **Loading Timeout**: Automatic timeout after 30 seconds
        `,
      },
    },
  },
  argTypes: {
    vehicles: {
      description: "Array of vehicles to display",
      control: { type: "object" },
    },
    facilities: {
      description: "Array of facilities to display",
      control: { type: "object" },
    },
    cameras: {
      description: "Array of traffic cameras to display",
      control: { type: "object" },
    },
    showVehicles: {
      description: "Show vehicle markers",
      control: { type: "boolean" },
    },
    showFacilities: {
      description: "Show facility markers",
      control: { type: "boolean" },
    },
    showCameras: {
      description: "Show camera markers",
      control: { type: "boolean" },
    },
    mapStyle: {
      description: "Google Maps type",
      control: { type: "select" },
      options: ["roadmap", "satellite", "hybrid", "terrain"],
    },
    center: {
      description: "Map center [longitude, latitude]",
      control: { type: "object" },
    },
    zoom: {
      description: "Zoom level (0-20)",
      control: { type: "range", min: 0, max: 20, step: 1 },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof GoogleMap>

export default meta
type Story = StoryObj<typeof meta>

// Default - Roadmap style
export const Default: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "roadmap",
    center: [-84.2807, 30.4383],
    zoom: 13,
  },
}

// Roadmap view
export const RoadmapView: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "roadmap",
    center: [-84.2807, 30.4383],
    zoom: 13,
  },
  parameters: {
    docs: {
      description: {
        story: "Standard Google Maps road view showing streets, labels, and landmarks.",
      },
    },
  },
}

// Satellite view
export const SatelliteView: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "satellite",
    center: [-84.2807, 30.4383],
    zoom: 14,
  },
  parameters: {
    docs: {
      description: {
        story: "Satellite imagery view without road overlay. Shows actual aerial photography.",
      },
    },
  },
}

// Hybrid view
export const HybridView: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "hybrid",
    center: [-84.2807, 30.4383],
    zoom: 14,
  },
  parameters: {
    docs: {
      description: {
        story: "Hybrid view combines satellite imagery with road overlay for the best of both worlds.",
      },
    },
  },
}

// Terrain view
export const TerrainView: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: [],
    showVehicles: true,
    showFacilities: true,
    showCameras: false,
    mapStyle: "terrain",
    center: [-84.2807, 30.4383],
    zoom: 12,
  },
  parameters: {
    docs: {
      description: {
        story: "Terrain view shows topographic features, vegetation, and elevation. Great for route planning.",
      },
    },
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
    mapStyle: "roadmap",
    center: [-84.2807, 30.4383],
    zoom: 13,
  },
  parameters: {
    docs: {
      description: {
        story: "Display only vehicle markers. Vehicles are color-coded by status.",
      },
    },
  },
}

// Facilities only
export const FacilitiesOnly: Story = {
  args: {
    vehicles: [],
    facilities: generateMockFacilities(12),
    cameras: [],
    showVehicles: false,
    showFacilities: true,
    showCameras: false,
    mapStyle: "roadmap",
    center: [-84.2807, 30.4383],
    zoom: 12,
  },
  parameters: {
    docs: {
      description: {
        story: "Display only facility markers. Each facility type has distinct styling.",
      },
    },
  },
}

// Traffic cameras only
export const CamerasOnly: Story = {
  args: {
    vehicles: [],
    facilities: [],
    cameras: generateMockCameras(15),
    showVehicles: false,
    showFacilities: false,
    showCameras: true,
    mapStyle: "roadmap",
    center: [-84.2807, 30.4383],
    zoom: 13,
  },
  parameters: {
    docs: {
      description: {
        story: "Display only traffic camera markers showing operational status.",
      },
    },
  },
}

// All markers
export const AllMarkers: Story = {
  args: {
    vehicles: generateMockVehicles(20),
    facilities: generateMockFacilities(10),
    cameras: generateMockCameras(15),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "roadmap",
    center: [-84.2807, 30.4383],
    zoom: 12,
  },
  parameters: {
    docs: {
      description: {
        story: "Display all marker types together: vehicles, facilities, and cameras.",
      },
    },
  },
}

// Custom location
export const CustomLocation: Story = {
  args: {
    vehicles: generateMockVehicles(8),
    facilities: generateMockFacilities(4),
    cameras: [],
    showVehicles: true,
    showFacilities: true,
    showCameras: false,
    mapStyle: "roadmap",
    center: [-122.4194, 37.7749], // San Francisco
    zoom: 12,
  },
  parameters: {
    docs: {
      description: {
        story: "Map centered on San Francisco, demonstrating custom location support.",
      },
    },
  },
}

// Zoomed out view
export const ZoomedOut: Story = {
  args: {
    vehicles: generateMockVehicles(30),
    facilities: generateMockFacilities(10),
    cameras: [],
    showVehicles: true,
    showFacilities: true,
    showCameras: false,
    mapStyle: "roadmap",
    center: [-84.2807, 30.4383],
    zoom: 10,
  },
  parameters: {
    docs: {
      description: {
        story: "Wide area view at low zoom level showing regional coverage.",
      },
    },
  },
}

// Zoomed in view
export const ZoomedIn: Story = {
  args: {
    vehicles: generateMockVehicles(5),
    facilities: generateMockFacilities(2),
    cameras: generateMockCameras(3),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "roadmap",
    center: [-84.2807, 30.4383],
    zoom: 16,
  },
  parameters: {
    docs: {
      description: {
        story: "Street-level detail at high zoom level.",
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
    mapStyle: "roadmap",
    center: [-84.2807, 30.4383],
    zoom: 10,
  },
  parameters: {
    docs: {
      description: {
        story: "Map with no markers showing the base view.",
      },
    },
  },
}

// Missing API key state (simulated in docs)
export const MissingAPIKey: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: [],
    showVehicles: true,
    showFacilities: true,
    showCameras: false,
    mapStyle: "roadmap",
    center: [-84.2807, 30.4383],
    zoom: 13,
  },
  parameters: {
    docs: {
      description: {
        story: `
### Missing API Key Error

When \`VITE_GOOGLE_MAPS_API_KEY\` is not configured, the component displays user-friendly setup instructions:

- Link to Google Cloud Console
- Step-by-step setup guide
- Information about free tier ($200/month credit)
- Clear error messaging

This ensures developers can quickly resolve the issue without confusion.
        `,
      },
    },
  },
}

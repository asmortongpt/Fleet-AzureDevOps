import type { Meta, StoryObj } from "@storybook/react"
import { LeafletMap } from "./LeafletMap"
import { generateMockVehicles, generateMockFacilities, generateMockCameras, generateLargeVehicleDataset } from "../../.storybook/mockData"
import { withMapContainer } from "../../.storybook/decorators"

const meta = {
  title: "Maps/LeafletMap",
  component: LeafletMap,
  decorators: [withMapContainer],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
# LeafletMap Component

Production-ready Leaflet/OpenStreetMap implementation with comprehensive features and robust error handling.

## Key Features

- **100% Free**: No API keys required, uses OpenStreetMap
- **Multiple Map Styles**: OpenStreetMap, Dark, Topographic, Satellite
- **React 19 Compatible**: Proper cleanup and effect management
- **TypeScript Strict**: Full type safety with null checks
- **WCAG 2.2 AA**: Accessibility compliant with ARIA labels
- **Performance Optimized**: Debouncing, lazy loading, efficient rendering
- **Memory Safe**: Comprehensive cleanup prevents memory leaks
- **Error Boundaries**: Graceful error handling and recovery

## Map Styles

- \`osm\`: Standard OpenStreetMap (default) - clear, detailed street maps
- \`dark\`: Dark mode theme by CartoDB - great for night viewing
- \`topo\`: Topographic maps - shows terrain and elevation
- \`satellite\`: Satellite imagery by Esri - aerial photography

## Marker Types

- **Vehicles**: Color-coded by status (active, idle, charging, service, emergency, offline)
- **Facilities**: Different icons for offices, depots, service centers, fueling stations
- **Traffic Cameras**: Shows operational status and live feed links

## Performance

The component includes several performance optimizations:
- Debounced marker updates (150ms)
- Lazy loading of Leaflet library
- Efficient marker clustering (optional)
- Canvas rendering mode for large datasets
- Proper cleanup prevents memory leaks
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
    mapStyle: {
      description: "Visual style of the map",
      control: { type: "select" },
      options: ["osm", "dark", "topo", "satellite"],
    },
    center: {
      description: "Map center coordinates [latitude, longitude]",
      control: { type: "object" },
    },
    zoom: {
      description: "Initial zoom level (2-19)",
      control: { type: "range", min: 2, max: 19, step: 1 },
    },
    enableClustering: {
      description: "Enable marker clustering for better performance",
      control: { type: "boolean" },
    },
    autoFitBounds: {
      description: "Automatically fit map to show all markers",
      control: { type: "boolean" },
    },
    minHeight: {
      description: "Minimum height in pixels",
      control: { type: "number" },
    },
    onMarkerClick: { action: "marker-clicked" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LeafletMap>

export default meta
type Story = StoryObj<typeof meta>

// Default - OpenStreetMap style
export const Default: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "osm",
    center: [30.4383, -84.2807],
    zoom: 13,
    autoFitBounds: true,
    minHeight: 600,
  },
}

// Dark theme
export const DarkTheme: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "dark",
    center: [30.4383, -84.2807],
    zoom: 13,
    autoFitBounds: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Dark mode map style using CartoDB dark theme. Perfect for night viewing or dark UI themes.",
      },
    },
    backgrounds: { default: "dark" },
  },
}

// Topographic style
export const TopographicMap: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: [],
    showVehicles: true,
    showFacilities: true,
    showCameras: false,
    mapStyle: "topo",
    center: [30.4383, -84.2807],
    zoom: 12,
    autoFitBounds: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Topographic map showing terrain, elevation, and natural features. Useful for route planning in varied terrain.",
      },
    },
  },
}

// Satellite imagery
export const SatelliteView: Story = {
  args: {
    vehicles: generateMockVehicles(10),
    facilities: generateMockFacilities(5),
    cameras: generateMockCameras(8),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "satellite",
    center: [30.4383, -84.2807],
    zoom: 14,
    autoFitBounds: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Satellite imagery view using Esri World Imagery. Shows actual aerial photography of the area.",
      },
    },
  },
}

// With clustering enabled
export const WithClustering: Story = {
  args: {
    vehicles: generateLargeVehicleDataset(500),
    facilities: generateMockFacilities(30),
    cameras: generateMockCameras(50),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "osm",
    center: [30.4383, -84.2807],
    zoom: 11,
    enableClustering: true,
    autoFitBounds: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Large dataset (500+ markers) with clustering enabled. Markers are grouped and displayed as clusters with counts, expanding when zoomed.",
      },
    },
  },
}

// Large dataset without clustering
export const LargeDatasetNoClustering: Story = {
  args: {
    vehicles: generateLargeVehicleDataset(100),
    facilities: generateMockFacilities(20),
    cameras: generateMockCameras(30),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "osm",
    center: [30.4383, -84.2807],
    zoom: 11,
    enableClustering: false,
    autoFitBounds: true,
  },
  parameters: {
    docs: {
      description: {
        story: "150 markers without clustering. Tests rendering performance. Notice potential overlap at low zoom levels.",
      },
    },
  },
}

// Interactive markers demo
export const InteractiveMarkers: Story = {
  args: {
    vehicles: generateMockVehicles(5),
    facilities: generateMockFacilities(3),
    cameras: generateMockCameras(4),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "osm",
    center: [30.4383, -84.2807],
    zoom: 14,
    autoFitBounds: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Click on any marker to see detailed information in a popup. Markers have hover effects and keyboard navigation support.",
      },
    },
  },
}

// Custom center and zoom
export const CustomLocation: Story = {
  args: {
    vehicles: generateMockVehicles(8),
    facilities: generateMockFacilities(4),
    cameras: [],
    showVehicles: true,
    showFacilities: true,
    showCameras: false,
    mapStyle: "osm",
    center: [37.7749, -122.4194], // San Francisco
    zoom: 12,
    autoFitBounds: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Map centered on San Francisco with autoFitBounds disabled to maintain the specified center and zoom.",
      },
    },
  },
}

// Vehicles only
export const VehiclesOnly: Story = {
  args: {
    vehicles: generateMockVehicles(20),
    facilities: [],
    cameras: [],
    showVehicles: true,
    showFacilities: false,
    showCameras: false,
    mapStyle: "osm",
    center: [30.4383, -84.2807],
    zoom: 13,
    autoFitBounds: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Display only vehicles without facilities or cameras. Vehicle markers are color-coded by status.",
      },
    },
  },
}

// Facilities only
export const FacilitiesOnly: Story = {
  args: {
    vehicles: [],
    facilities: generateMockFacilities(15),
    cameras: [],
    showVehicles: false,
    showFacilities: true,
    showCameras: false,
    mapStyle: "osm",
    center: [30.4383, -84.2807],
    zoom: 12,
    autoFitBounds: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Display only facilities. Each facility type has a distinct icon and color coding.",
      },
    },
  },
}

// Traffic cameras only
export const CamerasOnly: Story = {
  args: {
    vehicles: [],
    facilities: [],
    cameras: generateMockCameras(20),
    showVehicles: false,
    showFacilities: false,
    showCameras: true,
    mapStyle: "osm",
    center: [30.4383, -84.2807],
    zoom: 13,
    autoFitBounds: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Display only traffic cameras. Cameras show operational status and some have live feed links.",
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
    mapStyle: "osm",
    center: [30.4383, -84.2807],
    zoom: 10,
    autoFitBounds: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Map with no markers. Shows the default view without any data.",
      },
    },
  },
}

// Different zoom levels
export const ZoomedOut: Story = {
  args: {
    vehicles: generateMockVehicles(50),
    facilities: generateMockFacilities(10),
    cameras: [],
    showVehicles: true,
    showFacilities: true,
    showCameras: false,
    mapStyle: "osm",
    center: [30.4383, -84.2807],
    zoom: 8,
    autoFitBounds: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Wide view at low zoom level showing a larger geographic area with many markers.",
      },
    },
  },
}

export const ZoomedIn: Story = {
  args: {
    vehicles: generateMockVehicles(5),
    facilities: generateMockFacilities(2),
    cameras: generateMockCameras(3),
    showVehicles: true,
    showFacilities: true,
    showCameras: true,
    mapStyle: "osm",
    center: [30.4383, -84.2807],
    zoom: 16,
    autoFitBounds: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Street-level view at high zoom level showing detailed map features.",
      },
    },
  },
}

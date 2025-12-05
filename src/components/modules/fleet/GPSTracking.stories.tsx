import type { Meta, StoryObj } from "@storybook/react"
import GPSTracking from "./GPSTracking"
import { generateMockVehicles, generateMockFacilities, getVehiclesByStatus, getActiveVehicles } from "../../../.storybook/mockData"
import { withFullPage } from "../../../.storybook/decorators"

const meta = {
  title: "Pages/GPSTracking",
  component: GPSTracking,
  decorators: [withFullPage],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
# GPS Tracking Page

A comprehensive GPS tracking interface for real-time fleet monitoring and management.

## Features

- **Interactive Map**: Full-featured map showing vehicle locations in real-time
- **Status Filtering**: Filter vehicles by status (all, active, idle, charging, service, emergency, offline)
- **Vehicle List**: Scrollable list of all vehicles with key information
- **Activity Feed**: Recent vehicle movements and status changes
- **Real-time Updates**: Live data synchronization
- **Error Handling**: Graceful error states with retry options
- **Loading States**: Skeleton screens during data fetching
- **Responsive**: Works on desktop, tablet, and mobile

## Components

The page integrates several key components:
- UniversalMap for map visualization
- Vehicle status filters
- Vehicle information cards
- Activity timeline
- Search and sorting controls

## Usage

This is a full-page component typically used as a route in your application:

\`\`\`tsx
<Route path="/gps-tracking" element={<GPSTracking vehicles={vehicles} facilities={facilities} />} />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    vehicles: {
      description: "Array of vehicles to track",
      control: { type: "object" },
    },
    facilities: {
      description: "Array of facilities to display",
      control: { type: "object" },
    },
    onVehicleSelect: { action: "vehicle-selected" },
    isLoading: {
      description: "Loading state",
      control: { type: "boolean" },
    },
    error: {
      description: "Error message",
      control: { type: "text" },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof GPSTracking>

export default meta
type Story = StoryObj<typeof meta>

// Default state
export const Default: Story = {
  args: {
    vehicles: generateMockVehicles(20),
    facilities: generateMockFacilities(8),
    isLoading: false,
    error: null,
  },
}

// With active vehicles
export const ActiveVehicles: Story = {
  args: {
    vehicles: getActiveVehicles(generateMockVehicles(30)),
    facilities: generateMockFacilities(5),
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows only active vehicles that are currently in operation.",
      },
    },
  },
}

// Large fleet
export const LargeFleet: Story = {
  args: {
    vehicles: generateMockVehicles(100),
    facilities: generateMockFacilities(15),
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: "Large fleet with 100 vehicles. Tests performance and UI scalability.",
      },
    },
  },
}

// Small fleet
export const SmallFleet: Story = {
  args: {
    vehicles: generateMockVehicles(5),
    facilities: generateMockFacilities(2),
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: "Small fleet with just a few vehicles.",
      },
    },
  },
}

// Emergency vehicles
export const EmergencyStatus: Story = {
  args: {
    vehicles: [
      ...getVehiclesByStatus(generateMockVehicles(20), "emergency"),
      ...getVehiclesByStatus(generateMockVehicles(20), "active"),
    ],
    facilities: generateMockFacilities(5),
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: "Fleet with some vehicles in emergency status requiring immediate attention.",
      },
    },
  },
}

// Service vehicles
export const ServiceStatus: Story = {
  args: {
    vehicles: [
      ...getVehiclesByStatus(generateMockVehicles(15), "service"),
      ...getVehiclesByStatus(generateMockVehicles(15), "active"),
    ],
    facilities: generateMockFacilities(5),
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: "Fleet with vehicles currently under service or maintenance.",
      },
    },
  },
}

// Loading state
export const LoadingState: Story = {
  args: {
    vehicles: [],
    facilities: [],
    isLoading: true,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: "Loading state with skeleton screens while fetching data.",
      },
    },
  },
}

// Error state
export const ErrorState: Story = {
  args: {
    vehicles: [],
    facilities: [],
    isLoading: false,
    error: "Failed to load vehicle data. Please check your connection and try again.",
  },
  parameters: {
    docs: {
      description: {
        story: "Error state when data fetching fails. Shows user-friendly error message with retry option.",
      },
    },
  },
}

// Empty state
export const EmptyState: Story = {
  args: {
    vehicles: [],
    facilities: [],
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when no vehicles are in the system.",
      },
    },
  },
}

// Mixed statuses
export const MixedStatuses: Story = {
  args: {
    vehicles: generateMockVehicles(30),
    facilities: generateMockFacilities(8),
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: "Fleet with vehicles in various statuses: active, idle, charging, service, emergency, and offline.",
      },
    },
  },
}

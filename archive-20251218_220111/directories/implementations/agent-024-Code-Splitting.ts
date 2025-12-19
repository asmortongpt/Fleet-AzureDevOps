// src/components/CTAFleetAgent.tsx
import React, { lazy, Suspense } from 'react';
import { CTAFleetAgentProps } from '../types';

// Lazy load heavy components for performance optimization
const FleetDashboard = lazy(() => import('./FleetDashboard'));
const AgentControls = lazy(() => import('./AgentControls'));

const CTAFleetAgent: React.FC<CTAFleetAgentProps> = ({ agentId, fleetData }) => {
  return (
    <div className="cta-fleet-agent" data-testid="cta-fleet-agent">
      <h1>CTA Fleet Agent 24</h1>
      <Suspense fallback={<div data-testid="loading">Loading...</div>}>
        <FleetDashboard fleetData={fleetData} />
        <AgentControls agentId={agentId} />
      </Suspense>
    </div>
  );
};

export default CTAFleetAgent;

// src/components/FleetDashboard.tsx
import React from 'react';
import { FleetData } from '../types';

interface FleetDashboardProps {
  fleetData: FleetData;
}

const FleetDashboard: React.FC<FleetDashboardProps> = ({ fleetData }) => {
  return (
    <div className="fleet-dashboard" data-testid="fleet-dashboard">
      <h2>Fleet Dashboard</h2>
      <p>Vehicles: {fleetData.vehicleCount}</p>
      <p>Active Routes: {fleetData.activeRoutes}</p>
    </div>
  );
};

export default FleetDashboard;

// src/components/AgentControls.tsx
import React from 'react';

interface AgentControlsProps {
  agentId: string;
}

const AgentControls: React.FC<AgentControlsProps> = ({ agentId }) => {
  return (
    <div className="agent-controls" data-testid="agent-controls">
      <h2>Agent Controls</h2>
      <p>Agent ID: {agentId}</p>
      <button>Dispatch Vehicle</button>
    </div>
  );
};

export default AgentControls;

// src/types/index.ts
export interface FleetData {
  vehicleCount: number;
  activeRoutes: number;
}

export interface CTAFleetAgentProps {
  agentId: string;
  fleetData: FleetData;
}

// src/tests/CTAFleetAgent.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CTAFleetAgent from '../components/CTAFleetAgent';
import { FleetData } from '../types';

const mockFleetData: FleetData = {
  vehicleCount: 10,
  activeRoutes: 5,
};

describe('CTAFleetAgent', () => {
  test('renders CTAFleetAgent component with loading state', () => {
    render(<CTAFleetAgent agentId="AGENT123" fleetData={mockFleetData} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  test('renders FleetDashboard and AgentControls after loading', async () => {
    render(<CTAFleetAgent agentId="AGENT123" fleetData={mockFleetData} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('fleet-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('agent-controls')).toBeInTheDocument();
    });
  });

  test('displays correct fleet data in FleetDashboard', async () => {
    render(<CTAFleetAgent agentId="AGENT123" fleetData={mockFleetData} />);
    
    await waitFor(() => {
      expect(screen.getByText('Vehicles: 10')).toBeInTheDocument();
      expect(screen.getByText('Active Routes: 5')).toBeInTheDocument();
    });
  });

  test('displays correct agent ID in AgentControls', async () => {
    render(<CTAFleetAgent agentId="AGENT123" fleetData={mockFleetData} />);
    
    await waitFor(() => {
      expect(screen.getByText('Agent ID: AGENT123')).toBeInTheDocument();
    });
  });
});

// src/tests/FleetDashboard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import FleetDashboard from '../components/FleetDashboard';
import { FleetData } from '../types';

const mockFleetData: FleetData = {
  vehicleCount: 10,
  activeRoutes: 5,
};

describe('FleetDashboard', () => {
  test('renders fleet data correctly', () => {
    render(<FleetDashboard fleetData={mockFleetData} />);
    expect(screen.getByText('Fleet Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Vehicles: 10')).toBeInTheDocument();
    expect(screen.getByText('Active Routes: 5')).toBeInTheDocument();
  });
});

// src/tests/AgentControls.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import AgentControls from '../components/AgentControls';

describe('AgentControls', () => {
  test('renders agent controls with correct agent ID', () => {
    render(<AgentControls agentId="AGENT123" />);
    expect(screen.getByText('Agent Controls')).toBeInTheDocument();
    expect(screen.getByText('Agent ID: AGENT123')).toBeInTheDocument();
    expect(screen.getByText('Dispatch Vehicle')).toBeInTheDocument();
  });
});

// Fleet Application - Route Configuration
// Defines all hub routes and navigation

import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { AnalyticsHub } from '@/components/hubs/analytics/AnalyticsHub';
import { FleetHub } from '@/components/hubs/fleet/FleetHub';
import { ReservationsHub } from '@/components/hubs/reservations/ReservationsHub';
import { ConfigurationHub } from '@/pages/ConfigurationHub';
import DocumentsHub from '@/pages/DocumentsHub';
import { PolicyHub } from '@/pages/PolicyHub';

// Grok-generated "Definitive Correct UI Vision" components
import DashboardCommand from '@/pages/DashboardCommand';
import OperationsCommand from '@/pages/OperationsCommand';
import AnalyticsViz from '@/pages/AnalyticsViz';
import AdminControl from '@/pages/AdminControl';
import IntegrationsTruth from '@/pages/IntegrationsTruth';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Grok-generated "Definitive Correct UI Vision" routes */}
      <Route path="/" element={<DashboardCommand />} />
      <Route path="/dashboard" element={<DashboardCommand />} />
      <Route path="/operations" element={<OperationsCommand />} />
      <Route path="/analytics-viz" element={<AnalyticsViz />} />
      <Route path="/admin" element={<AdminControl />} />
      <Route path="/integrations" element={<IntegrationsTruth />} />

      {/* Legacy routes */}
      <Route path="/fleet" element={<FleetHub />} />
      <Route path="/analytics" element={<AnalyticsHub />} />
      <Route path="/reservations" element={<ReservationsHub />} />
      <Route path="/policy-hub" element={<PolicyHub />} />
      <Route path="/documents" element={<DocumentsHub />} />
      <Route path="/documents-hub" element={<DocumentsHub />} />
      <Route path="/configuration" element={<ConfigurationHub />} />
      <Route path="/cta-configuration-hub" element={<ConfigurationHub />} />
    </Routes>
  );
};

// Navigation configuration for sidebar/menu
export const navigationLinks = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    description: 'Is Fleet working, and what matters right now?',
    new: true
  },
  {
    name: 'Operations',
    path: '/operations',
    icon: 'Activity',
    description: 'What actions can I take right now?',
    new: true
  },
  {
    name: 'Analytics Viz',
    path: '/analytics-viz',
    icon: 'LineChart',
    description: 'What changed, when, and why should I care?',
    new: true
  },
  {
    name: 'Admin Control',
    path: '/admin',
    icon: 'Settings',
    description: 'How do I change the system without breaking it?',
    new: true
  },
  {
    name: 'Integrations',
    path: '/integrations',
    icon: 'Plug',
    description: 'Why is something not working?',
    new: true
  },
  // Legacy navigation
  {
    name: 'Fleet (Legacy)',
    path: '/fleet',
    icon: 'Car',
    description: 'Manage vehicles and fleet operations'
  },
  {
    name: 'Analytics (Legacy)',
    path: '/analytics',
    icon: 'BarChart3',
    description: 'Data analysis and reporting'
  },
  {
    name: 'Reservations',
    path: '/reservations',
    icon: 'Calendar',
    description: 'Book vehicles and manage reservations'
  },
  {
    name: 'Policy Hub',
    path: '/policy-hub',
    icon: 'BookOpen',
    description: 'AI-powered policy, compliance, and governance management'
  }
];

export default AppRoutes;

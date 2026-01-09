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

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<FleetHub />} />
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
    name: 'Fleet',
    path: '/fleet',
    icon: 'Car',
    description: 'Manage vehicles and fleet operations'
  },
  {
    name: 'Analytics',
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
    description: 'AI-powered policy, compliance, and governance management',
    new: true // Highlight as new feature
  }
];

export default AppRoutes;

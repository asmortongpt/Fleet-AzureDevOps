// Analytics Hub - Data Analysis & Reporting Dashboard
// Displays: Excel-style DataWorkbench, charts, reports

import { BarChart3, TrendingUp, Database } from 'lucide-react';
import React from 'react';

import { DataWorkbench } from './DataWorkbench';

export const AnalyticsHub: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyze fleet data, generate reports, and export insights
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold">1,247</p>
            </div>
            <Database className="w-8 h-8 text-blue-800" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Cost/Vehicle</p>
              <p className="text-2xl font-bold">$4,235</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Data Points</p>
              <p className="text-2xl font-bold">12,450</p>
            </div>
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* DataWorkbench */}
      <DataWorkbench />
    </div>
  );
};

export default AnalyticsHub;

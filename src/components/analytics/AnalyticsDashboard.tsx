import {
  TrendingUp,
  TrendingDown,
  Download,
  Share2,
  Settings,
  MapPin,
  Route,
  Gauge,
  Fuel,
  DollarSign,
  Clock,
  Activity
} from 'lucide-react';
import { useState } from 'react';

import { AnalyticsMapView } from './AnalyticsMapView';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVehicles } from '@/hooks/use-api';

type AnalyticsType = 'heatmap' | 'routes' | 'performance' | 'fuel';

interface KPICard {
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
}

export function AnalyticsDashboard() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const [analyticsType, setAnalyticsType] = useState<AnalyticsType>('heatmap');
  const [_selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState('pdf');

  // Calculate KPIs from vehicle data
  const totalMiles = vehicles?.reduce((sum: number, v: { odometer?: number }) => sum + (v.odometer || 0), 0) || 0;
  const avgMPG = 24.5; // Demo - calculate from real data
  const totalFuelCost = (totalMiles / avgMPG) * 3.45;
  const avgIdleTime = 12.3; // Demo - calculate from telemetry

  const kpis: KPICard[] = [
    {
      title: 'Total Miles',
      value: totalMiles.toLocaleString(),
      trend: '+8.2%',
      isPositive: true,
      icon: <Activity className="h-5 w-5" />
    },
    {
      title: 'Avg MPG',
      value: avgMPG.toFixed(1),
      trend: '+5.3%',
      isPositive: true,
      icon: <Gauge className="h-5 w-5" />
    },
    {
      title: 'Fuel Cost',
      value: `$${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trend: '-2.1%',
      isPositive: true,
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      title: 'Idle Time',
      value: `${avgIdleTime}%`,
      trend: '-3.5%',
      isPositive: true,
      icon: <Clock className="h-5 w-5" />
    }
  ];

  const handleExport = () => {
    // Implement export functionality
    console.log(`Exporting analytics report as ${exportFormat}`);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Sharing analytics report');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" data-testid="analytics-dashboard">
      {/* Header with KPIs */}
      <div className="border-b bg-background">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Real-time fleet analytics with map visualization
              </p>
            </div>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="analytics-kpi-cards">
            {kpis.map((kpi, index) => (
              <Card key={index} data-testid={`analytics-kpi-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{kpi.title}</span>
                    <div className="text-muted-foreground">{kpi.icon}</div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{kpi.value}</span>
                    {kpi.trend && (
                      <Badge variant={kpi.isPositive ? 'default' : 'destructive'} className="text-xs">
                        {kpi.isPositive ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {kpi.trend}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Type Selector & Export Panel */}
      <div className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <Tabs value={analyticsType} onValueChange={(v) => setAnalyticsType(v as AnalyticsType)}>
            <TabsList data-testid="analytics-type-tabs">
              <TabsTrigger value="heatmap" data-testid="analytics-tab-heatmap">
                <MapPin className="h-4 w-4 mr-2" />
                Heatmap
              </TabsTrigger>
              <TabsTrigger value="routes" data-testid="analytics-tab-routes">
                <Route className="h-4 w-4 mr-2" />
                Routes
              </TabsTrigger>
              <TabsTrigger value="performance" data-testid="analytics-tab-performance">
                <Gauge className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="fuel" data-testid="analytics-tab-fuel">
                <Fuel className="h-4 w-4 mr-2" />
                Fuel
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Export Controls */}
          <div className="flex items-center gap-2">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-32" data-testid="export-format-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              data-testid="export-report-btn"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              data-testid="share-report-btn"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Map View - Takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <AnalyticsMapView
          analyticsType={analyticsType}
          onVehicleSelect={setSelectedVehicleId}
        />
      </div>
    </div>
  );
}
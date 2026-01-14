/**
 * AnimationShowcase - Demo component showcasing all Phase 4 animations
 *
 * This component demonstrates all the new animation components:
 * - AnimatedMarker with pulse and hover effects
 * - LoadingSkeleton for all UI sections
 * - InteractiveTooltip with rich vehicle data
 * - GradientOverlay for data visualization
 * - ProgressIndicator for async operations
 */

import { motion } from "framer-motion";
import { useState } from "react";


// Import all new components
import {
  AnimatedMarker,
  AnimatedMarkerCluster,
  AnimatedMarkerRoute,
} from "@/components/ui/AnimatedMarker";
import {
  HeatmapGradient,
  ZoneOverlay,
  PerformanceGradient,
  AnimatedBackground,
} from "@/components/ui/GradientOverlay";
import {
  InteractiveTooltip,
  SimpleTooltip,
  DataTooltip,
} from "@/components/ui/InteractiveTooltip";
import {
  MapLoadingSkeleton,
  VehicleListLoadingSkeleton,
  DashboardCardsLoadingSkeleton,
  TableLoadingSkeleton,
  DetailPanelLoadingSkeleton,
  ChartLoadingSkeleton,
} from "@/components/ui/LoadingSkeleton";
import {
  LinearProgress,
  CircularProgress,
  StepProgress,
  UploadProgress,
  LoadingSpinner,
  PulsingDots,
} from "@/components/ui/ProgressIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AnimationShowcase() {
  const [activeTab, setActiveTab] = useState("markers");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLoading, setShowLoading] = useState(false);

  // Demo data for interactive tooltip
  const vehicleData = {
    id: "v-001",
    name: "Fleet Truck #42",
    type: "Delivery Van",
    status: "active" as const,
    speed: 45,
    fuel: 68,
    location: "1234 Main St, Springfield",
    driver: "John Smith",
    lastUpdate: new Date(),
    alerts: [
      { type: "warning" as const, message: "Maintenance due in 500 miles" },
      { type: "info" as const, message: "Next delivery in 15 minutes" },
    ],
  };

  // Demo steps for step progress
  const [steps] = useState([
    { id: "1", label: "Upload", status: "completed" as const },
    { id: "2", label: "Process", status: "active" as const },
    { id: "3", label: "Verify", status: "pending" as const },
    { id: "4", label: "Complete", status: "pending" as const },
  ]);

  // Simulate upload progress
  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-sm font-bold text-gray-900">
            Phase 4: Animation Showcase
          </h1>
          <p className="text-slate-700">
            Visual polish with Framer Motion animations and loading states
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="markers">Markers</TabsTrigger>
            <TabsTrigger value="skeletons">Skeletons</TabsTrigger>
            <TabsTrigger value="tooltips">Tooltips</TabsTrigger>
            <TabsTrigger value="gradients">Gradients</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Animated Markers */}
          <TabsContent value="markers">
            <Card className="p-3">
              <h2 className="text-sm font-bold mb-3">Animated Markers</h2>
              <div className="space-y-2">
                {/* Vehicle Status Markers */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Vehicle Status Markers</h3>
                  <div className="flex gap-2 flex-wrap">
                    <div className="text-center">
                      <AnimatedMarker status="active" showPulse>
                        42
                      </AnimatedMarker>
                      <p className="text-xs mt-2 text-slate-700">Active</p>
                    </div>
                    <div className="text-center">
                      <AnimatedMarker status="idle">
                        15
                      </AnimatedMarker>
                      <p className="text-xs mt-2 text-slate-700">Idle</p>
                    </div>
                    <div className="text-center">
                      <AnimatedMarker status="maintenance">
                        8
                      </AnimatedMarker>
                      <p className="text-xs mt-2 text-slate-700">Maintenance</p>
                    </div>
                    <div className="text-center">
                      <AnimatedMarker status="offline">
                        3
                      </AnimatedMarker>
                      <p className="text-xs mt-2 text-slate-700">Offline</p>
                    </div>
                    <div className="text-center">
                      <AnimatedMarker isActive showPulse status="active">
                        99
                      </AnimatedMarker>
                      <p className="text-xs mt-2 text-slate-700">Selected</p>
                    </div>
                  </div>
                </div>

                {/* Cluster Markers */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Cluster Markers</h3>
                  <div className="flex gap-2">
                    <AnimatedMarkerCluster count={5} />
                    <AnimatedMarkerCluster count={12} size="md" />
                    <AnimatedMarkerCluster count={25} size="lg" isActive />
                  </div>
                </div>

                {/* Route Markers */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Route Markers</h3>
                  <div className="flex gap-2">
                    <AnimatedMarkerRoute type="start" label="Warehouse" />
                    <AnimatedMarkerRoute type="waypoint" label="Stop 1" />
                    <AnimatedMarkerRoute type="waypoint" label="Stop 2" />
                    <AnimatedMarkerRoute type="end" label="Destination" />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Loading Skeletons */}
          <TabsContent value="skeletons">
            <div className="space-y-2">
              <Card className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold">Loading Skeletons</h2>
                  <Button
                    onClick={() => {
                      setShowLoading(!showLoading);
                      setTimeout(() => setShowLoading(false), 3000);
                    }}
                  >
                    {showLoading ? "Loading..." : "Toggle Skeletons"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-slate-700">Map Loading</h3>
                    <div className="h-64 border rounded-lg overflow-hidden">
                      {showLoading && <MapLoadingSkeleton />}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-slate-700">Vehicle List</h3>
                    <div className="h-64 border rounded-lg overflow-hidden">
                      {showLoading && <VehicleListLoadingSkeleton />}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <h3 className="text-sm font-semibold mb-3 text-slate-700">Dashboard Cards</h3>
                    {showLoading && <DashboardCardsLoadingSkeleton />}
                  </div>

                  <div className="lg:col-span-2">
                    <h3 className="text-sm font-semibold mb-3 text-slate-700">Data Table</h3>
                    {showLoading && <TableLoadingSkeleton rows={5} columns={4} />}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-slate-700">Detail Panel</h3>
                    <div className="border rounded-lg">
                      {showLoading && <DetailPanelLoadingSkeleton />}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-slate-700">Chart</h3>
                    {showLoading && <ChartLoadingSkeleton />}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Interactive Tooltips */}
          <TabsContent value="tooltips">
            <Card className="p-3">
              <h2 className="text-sm font-bold mb-3">Interactive Tooltips</h2>
              <div className="space-y-2">
                {/* Vehicle Tooltip */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Vehicle Data Tooltip</h3>
                  <div className="flex gap-2">
                    <InteractiveTooltip
                      data={vehicleData}
                      onViewDetails={(id) => console.log("View details:", id)}
                      onTrack={(id) => console.log("Track:", id)}
                    >
                      <Button>Hover for Vehicle Info</Button>
                    </InteractiveTooltip>

                    <InteractiveTooltip
                      data={{ ...vehicleData, status: "maintenance", fuel: 15 }}
                      showDetails
                    >
                      <Button variant="outline">Low Fuel Vehicle</Button>
                    </InteractiveTooltip>
                  </div>
                </div>

                {/* Simple Tooltips */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Simple Tooltips</h3>
                  <div className="flex gap-2">
                    <SimpleTooltip content="This is a simple tooltip">
                      <Button variant="outline">Basic Tooltip</Button>
                    </SimpleTooltip>

                    <SimpleTooltip
                      content="Positioned on the right"
                      side="right"
                    >
                      <Button variant="outline">Right Side</Button>
                    </SimpleTooltip>
                  </div>
                </div>

                {/* Data Tooltips */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Data Visualization Tooltips</h3>
                  <div className="flex gap-2">
                    <DataTooltip label="Revenue" value={12500} unit="USD" change={15}>
                      <div className="w-12 h-9 bg-blue-500 rounded-lg cursor-pointer" />
                    </DataTooltip>

                    <DataTooltip label="Efficiency" value="94.5" unit="%" change={-3}>
                      <div className="w-12 h-9 bg-green-500 rounded-lg cursor-pointer" />
                    </DataTooltip>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Gradient Overlays */}
          <TabsContent value="gradients">
            <Card className="p-3">
              <h2 className="text-sm font-bold mb-3">Gradient Overlays</h2>
              <div className="space-y-2">
                {/* Heatmaps */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Heatmap Gradients</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 95].map((intensity) => (
                      <div key={intensity} className="relative h-32 border rounded-lg overflow-hidden">
                        <HeatmapGradient
                          intensity={intensity}
                          colorScheme="traffic"
                          showLabel
                          className="w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Zone Overlays */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Zone Overlays</h3>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="h-32 rounded-lg overflow-hidden">
                      <ZoneOverlay
                        status="safe"
                        label="Safe Zone"
                        showBorder
                        showPattern
                        className="w-full h-full"
                      />
                    </div>
                    <div className="h-32 rounded-lg overflow-hidden">
                      <ZoneOverlay
                        status="caution"
                        label="Caution"
                        showBorder
                        showPattern
                        className="w-full h-full"
                      />
                    </div>
                    <div className="h-32 rounded-lg overflow-hidden">
                      <ZoneOverlay
                        status="danger"
                        label="Danger"
                        showBorder
                        showPattern
                        className="w-full h-full"
                      />
                    </div>
                    <div className="h-32 rounded-lg overflow-hidden">
                      <ZoneOverlay
                        status="restricted"
                        label="Restricted"
                        showBorder
                        showPattern
                        className="w-full h-full"
                      />
                    </div>
                    <div className="h-32 rounded-lg overflow-hidden">
                      <ZoneOverlay
                        status="maintenance"
                        label="Maintenance"
                        showBorder
                        showPattern
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Performance Gradients */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Performance Metrics</h3>
                  <div className="space-y-2">
                    <PerformanceGradient value={85} max={100} variant="success" />
                    <PerformanceGradient value={65} max={100} variant="warning" />
                    <PerformanceGradient value={35} max={100} variant="danger" />
                    <PerformanceGradient value={90} max={100} variant="info" />
                  </div>
                </div>

                {/* Animated Background */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Animated Background</h3>
                  <div className="h-64 rounded-lg overflow-hidden">
                    <AnimatedBackground className="w-full h-full flex items-center justify-center">
                      <div className="text-white text-sm font-bold bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg">
                        Animated Gradient Background
                      </div>
                    </AnimatedBackground>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Progress Indicators */}
          <TabsContent value="progress">
            <Card className="p-3">
              <h2 className="text-sm font-bold mb-3">Progress Indicators</h2>
              <div className="space-y-2">
                {/* Linear Progress */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Linear Progress</h3>
                  <div className="space-y-2">
                    <LinearProgress value={25} variant="primary" showLabel />
                    <LinearProgress value={50} variant="success" showLabel />
                    <LinearProgress value={75} variant="warning" showLabel />
                    <LinearProgress value={90} variant="danger" showLabel />
                    <LinearProgress indeterminate variant="primary" />
                  </div>
                </div>

                {/* Circular Progress */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Circular Progress</h3>
                  <div className="flex gap-2">
                    <CircularProgress value={25} variant="primary" />
                    <CircularProgress value={50} variant="success" />
                    <CircularProgress value={75} variant="warning" />
                    <CircularProgress value={90} variant="danger" />
                    <CircularProgress indeterminate />
                  </div>
                </div>

                {/* Step Progress */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Step Progress (Horizontal)</h3>
                  <StepProgress steps={steps} orientation="horizontal" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Step Progress (Vertical)</h3>
                  <StepProgress steps={steps} orientation="vertical" />
                </div>

                {/* Upload Progress */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Upload Progress</h3>
                  <div className="space-y-2">
                    <Button onClick={simulateUpload}>Simulate Upload</Button>
                    <UploadProgress
                      fileName="fleet-report-2025.pdf"
                      fileSize={2500000}
                      progress={uploadProgress}
                      status={uploadProgress === 100 ? "success" : "uploading"}
                      speed={uploadProgress < 100 ? 125000 : undefined}
                      onCancel={() => setUploadProgress(0)}
                    />
                  </div>
                </div>

                {/* Spinners */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Loading Spinners</h3>
                  <div className="flex gap-2">
                    <LoadingSpinner size={24} label="Small" />
                    <LoadingSpinner size={48} label="Medium" />
                    <LoadingSpinner size={64} label="Large" />
                    <PulsingDots />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

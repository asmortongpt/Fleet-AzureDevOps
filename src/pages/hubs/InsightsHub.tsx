import {
  Brain,
  ChartLine,
  CurrencyDollar,
  Database,
  FileText,
  Lightning,
  TrendUp,
} from "@phosphor-icons/react";
import React, { Suspense, useMemo, useState } from "react";
import useSWR from "swr";

import { HubLayout } from "../../components/layout/HubLayout";
import { CostAnalysisCenter } from "../../components/modules/analytics/CostAnalysisCenter";
import { CustomReportBuilder } from "../../components/modules/analytics/CustomReportBuilder";
import { DataWorkbench } from "../../components/modules/analytics/DataWorkbench";
import { ExecutiveDashboard } from "../../components/modules/analytics/ExecutiveDashboard";
import { FleetAnalytics } from "../../components/modules/fleet/FleetAnalytics";
import { PredictiveMaintenance } from "../../components/modules/maintenance/PredictiveMaintenance";
import { Button } from "../../components/ui/button";

type InsightsModule =
  | "overview"
  | "executive"
  | "analytics"
  | "reports"
  | "workbench"
  | "cost-analysis"
  | "predictive";

interface FleetSummaryResponse {
  summary?: {
    vehicles?: {
      total?: number;
      active?: number;
    };
    drivers?: {
      total?: number;
      active?: number;
    };
  };
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((res) => res.json())
    .then((data) => data?.data ?? data);

const ModuleLoader = () => (
  <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
    Loading analytics module...
  </div>
);

const InsightsHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<InsightsModule>("overview");

  const { data: fleetSummary } = useSWR<FleetSummaryResponse>(
    "/api/analytics/fleet-summary",
    fetcher,
    { refreshInterval: 60000, shouldRetryOnError: false }
  );

  const quickMetrics = useMemo(() => {
    const vehiclesTotal = fleetSummary?.summary?.vehicles?.total ?? 0;
    const vehiclesActive = fleetSummary?.summary?.vehicles?.active ?? 0;
    const driversTotal = fleetSummary?.summary?.drivers?.total ?? 0;
    const driversActive = fleetSummary?.summary?.drivers?.active ?? 0;

    return [
      {
        label: "Vehicles Active",
        value: `${vehiclesActive}/${vehiclesTotal}`,
      },
      {
        label: "Drivers Active",
        value: `${driversActive}/${driversTotal}`,
      },
    ];
  }, [fleetSummary]);

  const renderModule = () => {
    switch (activeModule) {
      case "executive":
        return (
          <Suspense fallback={<ModuleLoader />}>
            <ExecutiveDashboard />
          </Suspense>
        );
      case "analytics":
        return (
          <Suspense fallback={<ModuleLoader />}>
            <FleetAnalytics />
          </Suspense>
        );
      case "reports":
        return (
          <Suspense fallback={<ModuleLoader />}>
            <CustomReportBuilder />
          </Suspense>
        );
      case "workbench":
        return (
          <Suspense fallback={<ModuleLoader />}>
            <DataWorkbench />
          </Suspense>
        );
      case "cost-analysis":
        return (
          <Suspense fallback={<ModuleLoader />}>
            <CostAnalysisCenter />
          </Suspense>
        );
      case "predictive":
        return (
          <Suspense fallback={<ModuleLoader />}>
            <PredictiveMaintenance />
          </Suspense>
        );
      case "overview":
      default:
        return (
          <div className="space-y-6 p-4">
            <Suspense fallback={<ModuleLoader />}>
              <ExecutiveDashboard />
            </Suspense>
            <Suspense fallback={<ModuleLoader />}>
              <FleetAnalytics />
            </Suspense>
          </div>
        );
    }
  };

  return (
    <HubLayout title="Insights">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", height: "100%", gap: 0 }}>
        <div style={{ minHeight: 0, overflow: "auto" }}>{renderModule()}</div>

        <div style={{ borderLeft: "1px solid #1e232a", minHeight: 0, overflow: "auto", background: "#0b0f14" }}>
          <div style={{ padding: "16px" }}>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Analytics Modules</h3>

              <Button variant={activeModule === "overview" ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setActiveModule("overview")}>
                <ChartLine className="w-4 h-4 mr-2" />Overview
              </Button>

              <Button variant={activeModule === "executive" ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setActiveModule("executive")}>
                <Lightning className="w-4 h-4 mr-2" />Executive Dashboard
              </Button>

              <Button variant={activeModule === "analytics" ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setActiveModule("analytics")}>
                <TrendUp className="w-4 h-4 mr-2" />Fleet Analytics
              </Button>

              <Button variant={activeModule === "reports" ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setActiveModule("reports")}>
                <FileText className="w-4 h-4 mr-2" />Custom Reports
              </Button>

              <Button variant={activeModule === "workbench" ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setActiveModule("workbench")}>
                <Database className="w-4 h-4 mr-2" />Data Workbench
              </Button>

              <Button variant={activeModule === "cost-analysis" ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setActiveModule("cost-analysis")}>
                <CurrencyDollar className="w-4 h-4 mr-2" />Cost Analysis
              </Button>

              <Button variant={activeModule === "predictive" ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setActiveModule("predictive")}>
                <Brain className="w-4 h-4 mr-2" />Predictive AI
              </Button>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Metrics</h3>
              <div className="space-y-3">
                {quickMetrics.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                    <span className="text-sm">{metric.label}</span>
                    <span className="font-bold">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </HubLayout>
  );
};

export default InsightsHub;

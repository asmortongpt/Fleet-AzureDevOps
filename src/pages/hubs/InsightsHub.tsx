import React, { useState } from "react";
import { HubLayout } from "../../components/layout/HubLayout";
import { ExecutiveDashboard } from "../../components/modules/ExecutiveDashboard";
import { FleetAnalytics } from "../../components/modules/FleetAnalytics";
import { CustomReportBuilder } from "../../components/modules/CustomReportBuilder";
import { DataWorkbench } from "../../components/modules/DataWorkbench";
import { CostAnalysisCenter } from "../../components/modules/CostAnalysisCenter";
import { PredictiveMaintenance } from "../../components/modules/PredictiveMaintenance";
import { useFleetData } from "../../hooks/use-fleet-data";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  ChartLine,
  TrendUp,
  FileText,
  Database,
  CurrencyDollar,
  Brain,
  Download,
  Lightning,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";

type InsightsModule =
  | "overview"
  | "executive"
  | "analytics"
  | "reports"
  | "workbench"
  | "cost-analysis"
  | "predictive";

const InsightsHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<InsightsModule>("overview");
  const fleetData = useFleetData();

  const renderModule = () => {
    switch (activeModule) {
      case "executive":
        return <ExecutiveDashboard />;
      case "analytics":
        return <FleetAnalytics data={fleetData} />;
      case "reports":
        return <CustomReportBuilder />;
      case "workbench":
        return <DataWorkbench />;
      case "cost-analysis":
        return <CostAnalysisCenter />;
      case "predictive":
        return <PredictiveMaintenance />;
      case "overview":
      default:
        return (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartLine className="w-5 h-5 text-blue-500" />
                    Total Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">1,247</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Reports generated this month
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendUp className="w-5 h-5 text-green-500" />
                    Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">+18%</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Efficiency improvement YoY
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CurrencyDollar className="w-5 h-5 text-orange-500" />
                    Cost Savings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$45K</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Identified this quarter
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    AI Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">92%</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Prediction accuracy rate
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Fleet Utilization",
                        value: 87,
                        change: "+5%",
                        positive: true,
                      },
                      {
                        label: "Fuel Efficiency",
                        value: 92,
                        change: "+12%",
                        positive: true,
                      },
                      {
                        label: "Maintenance Costs",
                        value: 78,
                        change: "-8%",
                        positive: true,
                      },
                      {
                        label: "Driver Safety Score",
                        value: 94,
                        change: "+3%",
                        positive: true,
                      },
                      {
                        label: "On-Time Delivery",
                        value: 96,
                        change: "+2%",
                        positive: true,
                      },
                    ].map((kpi, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{kpi.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{kpi.value}%</span>
                            <Badge
                              variant={kpi.positive ? "default" : "destructive"}
                            >
                              {kpi.change}
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-accent/20 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${kpi.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        title: "Cost optimization opportunity identified",
                        description: "Fuel purchasing pattern analysis",
                        time: "2 hours ago",
                        type: "cost",
                      },
                      {
                        title: "Maintenance prediction alert",
                        description: "3 vehicles require attention",
                        time: "4 hours ago",
                        type: "maintenance",
                      },
                      {
                        title: "Performance benchmark exceeded",
                        description: "Fleet efficiency up 8%",
                        time: "6 hours ago",
                        type: "performance",
                      },
                      {
                        title: "Quarterly report generated",
                        description: "Q4 analytics summary",
                        time: "8 hours ago",
                        type: "report",
                      },
                      {
                        title: "AI model updated",
                        description: "Predictive accuracy improved",
                        time: "1 day ago",
                        type: "ai",
                      },
                    ].map((insight, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
                      >
                        <div className="mt-1">
                          {insight.type === "cost" && (
                            <CurrencyDollar className="w-4 h-4 text-orange-500" />
                          )}
                          {insight.type === "maintenance" && (
                            <Warning className="w-4 h-4 text-yellow-500" />
                          )}
                          {insight.type === "performance" && (
                            <TrendUp className="w-4 h-4 text-green-500" />
                          )}
                          {insight.type === "report" && (
                            <FileText className="w-4 h-4 text-blue-500" />
                          )}
                          {insight.type === "ai" && (
                            <Brain className="w-4 h-4 text-purple-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{insight.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {insight.description}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {insight.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Fleet Summary
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Cost Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Driver Metrics
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Maintenance Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <HubLayout title="Insights">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          height: "100%",
          gap: 0,
        }}
      >
        <div style={{ minHeight: 0, overflow: "auto" }}>{renderModule()}</div>

        <div
          style={{
            borderLeft: "1px solid #1e232a",
            minHeight: 0,
            overflow: "auto",
            background: "#0b0f14",
          }}
        >
          <div style={{ padding: "16px" }}>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Analytics Modules
              </h3>

              <Button
                variant={activeModule === "overview" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("overview")}
              >
                <ChartLine className="w-4 h-4 mr-2" />
                Overview
              </Button>

              <Button
                variant={activeModule === "executive" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("executive")}
              >
                <Lightning className="w-4 h-4 mr-2" />
                Executive Dashboard
              </Button>

              <Button
                variant={activeModule === "analytics" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("analytics")}
              >
                <TrendUp className="w-4 h-4 mr-2" />
                Fleet Analytics
              </Button>

              <Button
                variant={activeModule === "reports" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("reports")}
              >
                <FileText className="w-4 h-4 mr-2" />
                Custom Reports
              </Button>

              <Button
                variant={activeModule === "workbench" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("workbench")}
              >
                <Database className="w-4 h-4 mr-2" />
                Data Workbench
              </Button>

              <Button
                variant={
                  activeModule === "cost-analysis" ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                onClick={() => setActiveModule("cost-analysis")}
              >
                <CurrencyDollar className="w-4 h-4 mr-2" />
                Cost Analysis
              </Button>

              <Button
                variant={activeModule === "predictive" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("predictive")}
              >
                <Brain className="w-4 h-4 mr-2" />
                Predictive AI
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Quick Metrics
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <span className="text-sm">Reports Today</span>
                  <Badge variant="secondary">42</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <span className="text-sm">Insights Generated</span>
                  <Badge variant="secondary">18</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <span className="text-sm">Cost Savings</span>
                  <Badge variant="secondary">$45K</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                  <span className="text-sm">AI Predictions</span>
                  <Badge variant="secondary">92%</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Brain className="w-4 h-4 mr-2" />
                  Run Analysis
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                System Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Data Pipeline: Healthy</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>AI Models: Active</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Analytics: Running</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HubLayout>
  );
};

export default InsightsHub;

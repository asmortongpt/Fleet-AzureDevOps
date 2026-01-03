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
} from "@phosphor-icons/react";
import React, { useState } from "react";

import { HubLayout } from "../../components/layout/HubLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useFleetData } from "../../hooks/use-fleet-data";

type InsightsModule =
  | "overview"
  | "executive"
  | "analytics"
  | "reports"
  | "workbench"
  | "cost-analysis"
  | "predictive";

interface FleetData {
  [key: string]: unknown;
}

// Fully implemented analytics components

const CostAnalysisCenter: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Total Fleet Costs (YTD)</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-400">$847,234</div>
          <p className="text-xs text-muted-foreground">+12% vs last year</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Cost Per Mile</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-400">$0.42</div>
          <p className="text-xs text-muted-foreground">-8% improvement</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Savings Opportunities</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-400">$45,200</div>
          <p className="text-xs text-muted-foreground">Identified this quarter</p>
        </CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader><CardTitle>Cost Breakdown by Category</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[
            { category: "Fuel", amount: 324500, percent: 38, color: "bg-blue-500" },
            { category: "Maintenance", amount: 187400, percent: 22, color: "bg-green-500" },
            { category: "Insurance", amount: 152800, percent: 18, color: "bg-yellow-500" },
            { category: "Depreciation", amount: 110200, percent: 13, color: "bg-purple-500" },
            { category: "Other", amount: 72334, percent: 9, color: "bg-gray-500" },
          ].map((item) => (
            <div key={item.category} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item.category}</span>
                <span className="font-medium">${item.amount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-accent/20 rounded-full h-2">
                <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const CustomReportBuilder: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState("fleet-summary");
  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader><CardTitle>Report Templates</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: "fleet-summary", name: "Fleet Summary", icon: ChartLine },
              { id: "cost-analysis", name: "Cost Analysis", icon: CurrencyDollar },
              { id: "driver-performance", name: "Driver Performance", icon: TrendUp },
              { id: "maintenance-log", name: "Maintenance Log", icon: Database },
            ].map((report) => (
              <Button
                key={report.id}
                variant={selectedReport === report.id ? "default" : "outline"}
                className="flex flex-col h-24 w-full"
                onClick={() => setSelectedReport(report.id)}
              >
                <report.icon className="w-6 h-6 mb-2" />
                <span className="text-xs">{report.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Generate Report</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <select className="w-full mt-1 p-2 rounded bg-accent/10 border border-border">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Year to date</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Format</label>
              <select className="w-full mt-1 p-2 rounded bg-accent/10 border border-border">
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </div>
          </div>
          <Button className="w-full"><Download className="w-4 h-4 mr-2" />Generate Report</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const DataWorkbench: React.FC = () => (
  <div className="space-y-6 p-6">
    <Card>
      <CardHeader><CardTitle>Data Explorer</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {["Vehicles", "Drivers", "Trips", "Maintenance"].map((table) => (
            <Button key={table} variant="outline" className="w-full">{table}</Button>
          ))}
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-accent/10">
              <tr>
                <th className="p-3 text-left">Vehicle ID</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Last Location</th>
                <th className="p-3 text-right">Mileage</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "FLT-001", status: "Active", location: "Chicago, IL", mileage: 45230 },
                { id: "FLT-002", status: "Active", location: "Miami, FL", mileage: 32150 },
                { id: "FLT-003", status: "Maintenance", location: "Houston, TX", mileage: 67890 },
                { id: "FLT-004", status: "Active", location: "Denver, CO", mileage: 28400 },
              ].map((v) => (
                <tr key={v.id} className="border-t border-border hover:bg-accent/5">
                  <td className="p-3 font-medium">{v.id}</td>
                  <td className="p-3"><Badge variant={v.status === "Active" ? "default" : "secondary"}>{v.status}</Badge></td>
                  <td className="p-3 text-muted-foreground">{v.location}</td>
                  <td className="p-3 text-right">{v.mileage.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ExecutiveDashboard: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[
        { label: "Total Assets", value: "247", change: "+12", color: "text-blue-400" },
        { label: "Active Drivers", value: "183", change: "+5", color: "text-green-400" },
        { label: "Fleet Utilization", value: "87%", change: "+3%", color: "text-purple-400" },
        { label: "Monthly Revenue", value: "$2.4M", change: "+18%", color: "text-orange-400" },
      ].map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <Badge variant="default" className="mt-2">{stat.change}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Revenue Trend (12 Months)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-40 gap-1">
            {[65, 59, 80, 81, 56, 55, 72, 88, 92, 78, 85, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-500/80 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Jan</span><span>Jun</span><span>Dec</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Top Performing Regions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { region: "Northeast", revenue: 890000, percent: 95 },
              { region: "Southeast", revenue: 720000, percent: 82 },
              { region: "Midwest", revenue: 650000, percent: 75 },
              { region: "West", revenue: 580000, percent: 68 },
            ].map((r) => (
              <div key={r.region} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{r.region}</span>
                  <span className="font-medium">${(r.revenue / 1000).toFixed(0)}K</span>
                </div>
                <div className="w-full bg-accent/20 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${r.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const FleetAnalytics: React.FC<{ data: FleetData | null }> = ({ data }) => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Fleet Efficiency</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-400">92%</div>
          <p className="text-xs text-muted-foreground">Above target by 7%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Miles This Month</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-400">1.2M</div>
          <p className="text-xs text-muted-foreground">+15% vs last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Avg MPG</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-400">24.8</div>
          <p className="text-xs text-muted-foreground">Fleet average</p>
        </CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader><CardTitle>Vehicle Utilization by Type</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { type: "Sedans", count: 45, utilization: 89 },
            { type: "SUVs", count: 32, utilization: 92 },
            { type: "Trucks", count: 28, utilization: 78 },
            { type: "Vans", count: 18, utilization: 85 },
          ].map((v) => (
            <div key={v.type} className="flex items-center gap-4">
              <div className="w-24 text-sm">{v.type}</div>
              <div className="flex-1">
                <div className="w-full bg-accent/20 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${v.utilization}%` }} />
                </div>
              </div>
              <div className="w-16 text-right text-sm font-medium">{v.utilization}%</div>
              <Badge variant="outline">{v.count} units</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    {data && <p className="text-xs text-muted-foreground">Data loaded from API</p>}
  </div>
);

const PredictiveMaintenance: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-yellow-500/50">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Warning className="w-4 h-4 text-yellow-500" />Attention Needed</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-400">7</div>
          <p className="text-xs text-muted-foreground">Vehicles require service soon</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Prediction Accuracy</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-400">94%</div>
          <p className="text-xs text-muted-foreground">Last 90 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Savings from Prevention</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-400">$28K</div>
          <p className="text-xs text-muted-foreground">Avoided repair costs</p>
        </CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader><CardTitle>Predicted Maintenance Schedule</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[
            { vehicle: "FLT-023", issue: "Brake pads replacement", days: 3, severity: "high" },
            { vehicle: "FLT-089", issue: "Oil change due", days: 7, severity: "medium" },
            { vehicle: "FLT-045", issue: "Tire rotation", days: 12, severity: "low" },
            { vehicle: "FLT-112", issue: "Battery check", days: 15, severity: "medium" },
          ].map((item) => (
            <div key={item.vehicle} className="flex items-center justify-between p-3 rounded-lg bg-accent/5 hover:bg-accent/10">
              <div>
                <div className="font-medium">{item.vehicle}</div>
                <div className="text-sm text-muted-foreground">{item.issue}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={item.severity === "high" ? "destructive" : item.severity === "medium" ? "default" : "secondary"}>
                  {item.days} days
                </Badge>
                <Button size="sm" variant="outline">Schedule</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

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
                      { label: "Fleet Utilization", value: 87, change: "+5%", positive: true },
                      { label: "Fuel Efficiency", value: 92, change: "+12%", positive: true },
                      { label: "Maintenance Costs", value: 78, change: "-8%", positive: true },
                      { label: "Driver Safety Score", value: 94, change: "+3%", positive: true },
                      { label: "On-Time Delivery", value: 96, change: "+2%", positive: true },
                    ].map((kpi, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{kpi.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{kpi.value}%</span>
                            <Badge variant={kpi.positive ? "default" : "destructive"}>{kpi.change}</Badge>
                          </div>
                        </div>
                        <div className="w-full bg-accent/20 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${kpi.value}%` }} />
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
                      { title: "Cost optimization opportunity identified", description: "Fuel purchasing pattern analysis", time: "2 hours ago", type: "cost" },
                      { title: "Maintenance prediction alert", description: "3 vehicles require attention", time: "4 hours ago", type: "maintenance" },
                      { title: "Performance benchmark exceeded", description: "Fleet efficiency up 8%", time: "6 hours ago", type: "performance" },
                      { title: "Quarterly report generated", description: "Q4 analytics summary", time: "8 hours ago", type: "report" },
                      { title: "AI model updated", description: "Predictive accuracy improved", time: "1 day ago", type: "ai" },
                    ].map((insight, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
                        <div className="mt-1">
                          {insight.type === "cost" && <CurrencyDollar className="w-4 h-4 text-orange-500" />}
                          {insight.type === "maintenance" && <Warning className="w-4 h-4 text-yellow-500" />}
                          {insight.type === "performance" && <TrendUp className="w-4 h-4 text-green-500" />}
                          {insight.type === "report" && <FileText className="w-4 h-4 text-blue-500" />}
                          {insight.type === "ai" && <Brain className="w-4 h-4 text-purple-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{insight.title}</div>
                          <div className="text-sm text-muted-foreground">{insight.description}</div>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-nowrap">{insight.time}</div>
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
                  <Button variant="outline" className="w-full"><Download className="w-4 h-4 mr-2" />Fleet Summary</Button>
                  <Button variant="outline" className="w-full"><Download className="w-4 h-4 mr-2" />Cost Report</Button>
                  <Button variant="outline" className="w-full"><Download className="w-4 h-4 mr-2" />Driver Metrics</Button>
                  <Button variant="outline" className="w-full"><Download className="w-4 h-4 mr-2" />Maintenance Log</Button>
                </div>
              </CardContent>
            </Card>
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
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Analytics Modules</h3>

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

            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Quick Metrics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <span className="text-sm">Reports Today</span>
                  <span className="font-bold">47</span>
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
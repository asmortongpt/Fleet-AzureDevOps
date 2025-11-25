import React, { useState } from "react";
import { HubLayout } from "../../components/layout/HubLayout";
import { PeopleManagement } from "../../components/modules/PeopleManagement";
import { DriverPerformance } from "../../components/modules/DriverPerformance";
import { DriverScorecard } from "../../components/modules/DriverScorecard";
import MobileEmployeeDashboard from "../../components/modules/MobileEmployeeDashboard";
import MobileManagerView from "../../components/modules/MobileManagerView";
import { useFleetData } from "../../hooks/use-fleet-data";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Users,
  User,
  ChartLine,
  IdentificationCard,
  DeviceMobile,
  UsersFour,
  Warning,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react";

type PeopleModule =
  | "overview"
  | "management"
  | "performance"
  | "scorecard"
  | "employee-mobile"
  | "manager-mobile";

const PeopleHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<PeopleModule>("overview");
  const fleetData = useFleetData();

  const renderModule = () => {
    switch (activeModule) {
      case "management":
        return <PeopleManagement data={fleetData} />;
      case "performance":
        return <DriverPerformance />;
      case "scorecard":
        return <DriverScorecard />;
      case "employee-mobile":
        return <MobileEmployeeDashboard />;
      case "manager-mobile":
        return <MobileManagerView />;
      case "overview":
      default:
        return (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Total Drivers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">48</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    42 active, 6 inactive
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Licensed & Certified
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">45</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    3 expiring soon
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartLine className="w-5 h-5 text-purple-500" />
                    Avg Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">87%</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Up 5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warning className="w-5 h-5 text-orange-500" />
                    Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">5</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    3 training, 2 review
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        name: "John Martinez",
                        score: 98,
                        trips: 156,
                        rating: "Excellent",
                      },
                      {
                        name: "Sarah Johnson",
                        score: 96,
                        trips: 142,
                        rating: "Excellent",
                      },
                      {
                        name: "Michael Chen",
                        score: 94,
                        trips: 138,
                        rating: "Excellent",
                      },
                      {
                        name: "Emily Rodriguez",
                        score: 92,
                        trips: 134,
                        rating: "Very Good",
                      },
                      {
                        name: "David Thompson",
                        score: 91,
                        trips: 128,
                        rating: "Very Good",
                      },
                    ].map((driver, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-medium">{driver.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {driver.trips} trips
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{driver.score}</div>
                          <Badge
                            variant={
                              driver.score >= 95 ? "default" : "secondary"
                            }
                          >
                            {driver.rating}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        title: "License renewed",
                        driver: "James Wilson",
                        time: "1 hour ago",
                        type: "certification",
                      },
                      {
                        title: "Safety training completed",
                        driver: "Maria Garcia",
                        time: "3 hours ago",
                        type: "training",
                      },
                      {
                        title: "Performance review scheduled",
                        driver: "Robert Lee",
                        time: "4 hours ago",
                        type: "review",
                      },
                      {
                        title: "New driver onboarded",
                        driver: "Lisa Anderson",
                        time: "6 hours ago",
                        type: "onboarding",
                      },
                      {
                        title: "Medical certification updated",
                        driver: "Chris Taylor",
                        time: "8 hours ago",
                        type: "certification",
                      },
                    ].map((activity, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {activity.type === "certification" && (
                            <IdentificationCard className="w-4 h-4 text-blue-500" />
                          )}
                          {activity.type === "training" && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {activity.type === "review" && (
                            <Clock className="w-4 h-4 text-orange-500" />
                          )}
                          {activity.type === "onboarding" && (
                            <User className="w-4 h-4 text-purple-500" />
                          )}
                          <div>
                            <div className="font-medium">{activity.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {activity.driver}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activity.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <HubLayout title="People">
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
                People Modules
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
                variant={activeModule === "management" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("management")}
              >
                <Users className="w-4 h-4 mr-2" />
                People Management
              </Button>

              <Button
                variant={activeModule === "performance" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("performance")}
              >
                <ChartLine className="w-4 h-4 mr-2" />
                Driver Performance
              </Button>

              <Button
                variant={activeModule === "scorecard" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("scorecard")}
              >
                <IdentificationCard className="w-4 h-4 mr-2" />
                Driver Scorecard
              </Button>

              <Button
                variant={
                  activeModule === "employee-mobile" ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                onClick={() => setActiveModule("employee-mobile")}
              >
                <DeviceMobile className="w-4 h-4 mr-2" />
                Employee Mobile
              </Button>

              <Button
                variant={
                  activeModule === "manager-mobile" ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                onClick={() => setActiveModule("manager-mobile")}
              >
                <UsersFour className="w-4 h-4 mr-2" />
                Manager Mobile
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <span className="text-sm">Active Drivers</span>
                  <Badge variant="secondary">42</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <span className="text-sm">Certified</span>
                  <Badge variant="secondary">45</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <span className="text-sm">In Training</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                  <span className="text-sm">Avg Score</span>
                  <Badge variant="secondary">87%</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Add Driver
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <IdentificationCard className="w-4 h-4 mr-2" />
                  Check Certifications
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Training
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HubLayout>
  );
};

export default PeopleHub;

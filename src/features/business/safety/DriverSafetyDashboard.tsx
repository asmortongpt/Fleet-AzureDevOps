/**
 * Tesla Autopilot-Grade Driver Safety Dashboard
 * Real-time behavior monitoring with coaching recommendations
 */

// motion removed - React 19 incompatible
import { AlertTriangle, Shield, Eye, Brain, Zap, TrendingUp, Clock, Phone, Car, Activity, Target, BookOpen, Award, Bell, Gauge, Coffee, AlertCircle, CheckCircle, Timer, Users, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatTime } from '@/utils/format-helpers';
import { formatVehicleShortName } from '@/utils/vehicle-display';

// Local type definitions for safety dashboard
interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
}

interface DrivingEvent {
  timestamp: Date;
  severity: number;
  location?: { lat: number; lng: number };
}

interface GoalProgress {
  goal: string;
  title: string;
  progress: number;
  currentValue: number;
  targetValue: number;
}

interface AIDriverBehaviorAnalysis {
  driverId: string;
  vehicleId: string;
  safetyScore: number;
  attentionScore: number;
  aggressionScore: number;
  efficiencyScore: number;
  risk: {
    prediction?: {
      timeToIntervention?: number;
      accidentRisk: number;
    };
  };
  events: {
    harshBraking: DrivingEvent[];
    harshAcceleration: DrivingEvent[];
    speedingViolations: DrivingEvent[];
    distractedDriving: DrivingEvent[];
  };
  coaching: {
    improvements: string[];
    goalProgress: GoalProgress[];
    trainingRecommendations: string[];
  };
}

interface DriverFatigueAnalysis {
  driverId: string;
  fatigueLevel: number;
  timestamp: Date;
}

interface DistractionAnalysis {
  driverId: string;
  riskLevel: number;
  timestamp: Date;
}

interface AccidentPrediction {
  driverId: string;
  risk: {
    overall: number;
  };
  timestamp: Date;
}

interface SafetyIntervention {
  type: string;
  severity: string;
  trigger: string;
}

interface SafetyDashboardMetrics {
  realTime: {
    activeDrivers: number;
    criticalAlerts: number;
    activeSafetyInterventions: number;
    averageFleetSafetyScore: number;
    fatigueAlerts: number;
    distractionAlerts: number;
  };
  coaching: {
    driversInProgram: number;
    averageImprovement: number;
    completionRate: number;
  };
  predictions: {
    accidentRisks: AccidentPrediction[];
  };
}

interface DriverSafetyDashboardProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  activeAnalyses: AIDriverBehaviorAnalysis[];
  fatigueAnalyses: DriverFatigueAnalysis[];
  distractionAnalyses: DistractionAnalysis[];
  accidentPredictions: AccidentPrediction[];
  interventions: SafetyIntervention[];
  dashboardMetrics: SafetyDashboardMetrics;
  onInterventionTrigger: (driverId: string, intervention: Partial<SafetyIntervention>) => void;
  onCoachingSchedule: (driverId: string, coachingPlan: any) => void;
  className?: string;
}

const riskColors = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20'
};

const getRiskLevel = (score: number): keyof typeof riskColors => {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
};

export const DriverSafetyDashboard: React.FC<DriverSafetyDashboardProps> = ({
  drivers,
  vehicles,
  activeAnalyses,
  fatigueAnalyses,
  distractionAnalyses,
  accidentPredictions,
  interventions,
  dashboardMetrics,
  onInterventionTrigger,
  onCoachingSchedule,
  className = ''
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'drivers' | 'alerts' | 'coaching'>(
    'overview'
  );
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh data every 10 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Calculate critical alerts
  const criticalAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      type: string;
      driverId: string;
      severity: 'critical' | 'high' | 'medium';
      message: string;
      timestamp: Date;
    }> = [];

    // High-risk accident predictions
    accidentPredictions.forEach((prediction) => {
      if (prediction.risk.overall > 0.8) {
        alerts.push({
          id: `accident_${prediction.driverId}`,
          type: 'accident_risk',
          driverId: prediction.driverId,
          severity: 'critical',
          message: `High accident risk detected (${Math.round(prediction.risk.overall * 100)}%)`,
          timestamp: prediction.timestamp
        });
      }
    });

    // Critical fatigue levels
    fatigueAnalyses.forEach((fatigue) => {
      if (fatigue.fatigueLevel > 0.8) {
        alerts.push({
          id: `fatigue_${fatigue.driverId}`,
          type: 'fatigue',
          driverId: fatigue.driverId,
          severity: 'critical',
          message: `Critical fatigue level detected (${Math.round(fatigue.fatigueLevel * 100)}%)`,
          timestamp: fatigue.timestamp
        });
      }
    });

    // High distraction risk
    distractionAnalyses.forEach((distraction) => {
      if (distraction.riskLevel > 0.7) {
        alerts.push({
          id: `distraction_${distraction.driverId}`,
          type: 'distraction',
          driverId: distraction.driverId,
          severity: 'high',
          message: `Driver distraction detected`,
          timestamp: distraction.timestamp
        });
      }
    });

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [accidentPredictions, fatigueAnalyses, distractionAnalyses]);

  // Filter critical alerts based on selected filter
  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'all') return criticalAlerts;
    return criticalAlerts.filter((alert) => alert.severity === alertFilter);
  }, [criticalAlerts, alertFilter]);

  const renderOverviewMetrics = () => {
    const metrics = [
      { label: 'Active Drivers', value: dashboardMetrics.realTime.activeDrivers, icon: Users, color: 'text-emerald-400' },
      { label: 'Critical Alerts', value: dashboardMetrics.realTime.criticalAlerts, icon: AlertTriangle, color: 'text-red-400' },
      { label: 'Interventions', value: dashboardMetrics.realTime.activeSafetyInterventions, icon: Shield, color: 'text-orange-400' },
      { label: 'Safety Score', value: Math.round(dashboardMetrics.realTime.averageFleetSafetyScore), icon: Gauge, color: 'text-emerald-400' },
      { label: 'Fatigue', value: dashboardMetrics.realTime.fatigueAlerts, icon: Coffee, color: 'text-amber-400' },
      { label: 'Distraction', value: dashboardMetrics.realTime.distractionAlerts, icon: Eye, color: 'text-emerald-400' },
    ];
    return (
      <div className="flex items-center gap-0 mb-3 bg-[#1a1a1a] rounded-lg border border-white/[0.08] overflow-hidden divide-x divide-white/[0.06]">
        {metrics.map(m => (
          <div key={m.label} className="flex-1 flex items-center gap-2 px-3 py-2.5 min-w-0">
            <m.icon className={`w-3.5 h-3.5 ${m.color} flex-shrink-0`} />
            <div className="min-w-0">
              <div className="text-[10px] text-white/40 uppercase tracking-wide truncate">{m.label}</div>
              <div className={`text-sm font-semibold ${m.color}`}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDriverAnalysisCard = (analysis: AIDriverBehaviorAnalysis) => {
    const driver = drivers.find((d) => d.id === analysis.driverId);
    const vehicle = vehicles.find((v) => v.id === analysis.vehicleId);
    const riskLevel = getRiskLevel(analysis.safetyScore);
    const fatigue = fatigueAnalyses.find((f) => f.driverId === analysis.driverId);
    const distraction = distractionAnalyses.find((d) => d.driverId === analysis.driverId);

    if (!driver) return null;

    return (
      <div
        key={analysis.driverId}
        className="mb-2"
      >
        <Card
          className={`border-l-4 ${riskColors[riskLevel]}  transition-all duration-200`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-9 bg-white/[0.06] rounded-full flex items-center justify-center">
                    <Car className="w-4 h-4 text-white/70" />
                  </div>
                  {analysis.risk.prediction?.timeToIntervention && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-sm">
                    {driver.firstName} {driver.lastName}
                  </CardTitle>
                  <p className="text-sm text-white/70">
                    {driver.department} • {vehicle ? formatVehicleShortName(vehicle) : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={riskLevel === 'low' ? 'default' : 'destructive'}>
                      Risk: {riskLevel.toUpperCase()}
                    </Badge>
                    {analysis.risk.prediction?.timeToIntervention && (
                      <Badge variant="destructive" className="animate-pulse">
                        Intervention: {analysis.risk.prediction.timeToIntervention}s
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold">{Math.round(analysis.safetyScore)}</div>
                <div className="text-xs text-white/40">Safety Score</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {/* Real-time Status indicators */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="ml-1 text-xs">Safety</span>
                </div>
                <div className="font-semibold">{Math.round(analysis.safetyScore)}</div>
              </div>

              <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="ml-1 text-xs">Attention</span>
                </div>
                <div className="font-semibold">{Math.round(analysis.attentionScore)}</div>
              </div>

              <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="ml-1 text-xs">Aggression</span>
                </div>
                <div className="font-semibold">{Math.round(analysis.aggressionScore)}</div>
              </div>

              <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span className="ml-1 text-xs">Efficiency</span>
                </div>
                <div className="font-semibold">{Math.round(analysis.efficiencyScore)}</div>
              </div>
            </div>

            {/* AI insights */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                AI Insights & Alerts
              </h4>

              {/* Fatigue status */}
              {fatigue && fatigue.fatigueLevel > 0.5 && (
                <div className="flex items-center justify-between p-2 bg-orange-500/10 rounded border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">Fatigue Detected</span>
                  </div>
                  <div className="text-sm text-white/60">Level: {Math.round(fatigue.fatigueLevel * 100)}%</div>
                </div>
              )}

              {/* Distraction status */}
              {distraction && distraction.riskLevel > 0.6 && (
                <div className="flex items-center justify-between p-2 bg-red-500/10 rounded border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">Distraction Alert</span>
                  </div>
                  <div className="text-sm text-white/60">Risk: {Math.round(distraction.riskLevel * 100)}%</div>
                </div>
              )}

              {/* Accident risk */}
              {(analysis.risk.prediction?.accidentRisk ?? 0) > 0.7 && (
                <div className="flex items-center justify-between p-2 bg-red-500/10 rounded border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">High Accident Risk</span>
                  </div>
                  <div className="text-sm text-white/60">
                    {Math.round((analysis.risk.prediction?.accidentRisk ?? 0) * 100)}%
                  </div>
                </div>
              )}
            </div>

            {/* Recent events Summary */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recent Events (Last Trip)</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Harsh Braking:</span>
                  <span
                    className={
                      analysis.events.harshBraking.length > 2 ? 'text-red-600 font-semibold' : ''
                    }
                  >
                    {analysis.events.harshBraking.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Hard Acceleration:</span>
                  <span
                    className={
                      analysis.events.harshAcceleration.length > 2
                        ? 'text-red-600 font-semibold'
                        : ''
                    }
                  >
                    {analysis.events.harshAcceleration.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Speeding:</span>
                  <span
                    className={
                      analysis.events.speedingViolations.length > 0
                        ? 'text-red-600 font-semibold'
                        : ''
                    }
                  >
                    {analysis.events.speedingViolations.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Distracted Driving:</span>
                  <span
                    className={
                      analysis.events.distractedDriving.length > 0
                        ? 'text-red-600 font-semibold'
                        : ''
                    }
                  >
                    {analysis.events.distractedDriving.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Coaching recommendations */}
            {analysis.coaching.improvements.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  AI Coaching Recommendations
                </h4>
                <div className="space-y-1">
                  {analysis.coaching.improvements.slice(0, 2).map((improvement) => (
                    <div key={improvement} className="text-xs text-white/60 bg-emerald-500/10 p-2 rounded">
                      • {improvement}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDriver(analysis.driverId)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>

              {analysis.risk.prediction?.timeToIntervention && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    onInterventionTrigger(analysis.driverId, {
                      type: 'audio_alert',
                      severity: 'critical',
                      trigger: 'High risk detected'
                    })
                  }
                  className="flex-1"
                >
                  <Bell className="w-4 h-4 mr-1" />
                  Intervene Now
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => onCoachingSchedule(analysis.driverId, analysis.coaching)}
              >
                <BookOpen className="w-4 h-4 mr-1" />
                Schedule Coaching
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAlertsView = () => (
    <div className="space-y-2">
      {/* Alert filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium">Filter by severity:</span>
        {(['all', 'critical', 'high', 'medium'] as const).map((filter) => (
          <Button
            key={filter}
            size="sm"
            variant={alertFilter === filter ? 'default' : 'outline'}
            onClick={() => setAlertFilter(filter)}
          >
            {filter === 'all' ? 'All Alerts' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const driver = drivers.find((d) => d.id === alert.driverId);
            const severityIcon = {
              critical: <AlertCircle className="w-3 h-3 text-red-600" />,
              high: <AlertTriangle className="w-3 h-3 text-orange-600" />,
              medium: <Bell className="w-3 h-3 text-yellow-600" />
            }[alert.severity];

            return (
              <div
                key={alert.id}
              >
                <Card
                  className={`border-l-4 ${riskColors[alert.severity as keyof typeof riskColors]}`}
                >
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {severityIcon}
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-white/70">
                            Driver: {driver?.firstName} {driver?.lastName}
                          </div>
                          <div className="text-xs text-white/40 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(alert.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            alert.driverId &&
                            onInterventionTrigger(alert.driverId, {
                              type: 'audio_alert',
                              severity: alert.severity as any,
                              trigger: alert.message
                            })
                          }
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Respond
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-3 text-center">
              <CheckCircle className="w-12 h-9 mx-auto mb-2 text-emerald-400" />
              <h3 className="text-sm font-semibold mb-2">No Active Alerts</h3>
              <p className="text-white/70">All drivers are operating within safe parameters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderCoachingView = () => (
    <div className="space-y-2">
      {/* Coaching overview — inline metrics row */}
      <div className="flex items-center gap-0 bg-[#1a1a1a] rounded-lg border border-white/[0.08] overflow-hidden divide-x divide-white/[0.06]">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5">
          <Users className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wide">In Program</div>
            <div className="text-sm font-semibold text-white/80">{dashboardMetrics.coaching.driversInProgram}</div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wide">Avg Improvement</div>
            <div className="text-sm font-semibold text-emerald-400">+{Math.round(dashboardMetrics.coaching.averageImprovement)}%</div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5">
          <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wide">Completion Rate</div>
            <div className="text-sm font-semibold text-amber-400">{Math.round(dashboardMetrics.coaching.completionRate)}%</div>
          </div>
        </div>
      </div>

      {/* Driver coaching cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Active Coaching Programs</h3>
        {activeAnalyses
          .filter((analysis) => analysis.coaching.goalProgress.length > 0)
          .map((analysis) => {
            const driver = drivers.find((d) => d.id === analysis.driverId);
            if (!driver) return null;

            return (
              <Card key={analysis.driverId} className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-emerald-400" />
                    {driver.firstName} {driver.lastName} - Coaching Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.coaching.goalProgress.map((goal) => (
                    <div key={goal.goal} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{goal.title}</span>
                        <Badge variant={goal.progress >= 80 ? 'default' : 'secondary'}>
                          {Math.round(goal.progress)}%
                        </Badge>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="text-sm text-white/70">
                        Current: {goal.currentValue} | Target: {goal.targetValue}
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 border-t">
                    <h4 className="font-medium text-sm mb-2">Recommended Training</h4>
                    <div className="space-y-1">
                      {analysis.coaching.trainingRecommendations.map((training) => (
                        <div
                          key={training}
                          className="flex items-center justify-between p-2 bg-white/[0.03] rounded border border-white/[0.08]"
                        >
                          <span className="text-sm">{training}</span>
                          <Button size="sm" variant="outline">
                            <BookOpen className="w-4 h-4 mr-1" />
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white/80">Driver Safety Dashboard</h1>
          <p className="text-white/70">Tesla Autopilot-grade AI monitoring & coaching</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-white/40 flex items-center gap-1">
            <Timer className="w-4 h-4" />
            Last updated: {formatTime(lastUpdate)}
          </div>
          <Button
            size="sm"
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-refresh
          </Button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'drivers', label: 'Driver Analysis', icon: Users },
          { id: 'alerts', label: 'Active Alerts', icon: AlertTriangle },
          { id: 'coaching', label: 'AI Coaching', icon: Target }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={selectedView === tab.id ? 'default' : 'ghost'}
            onClick={() => setSelectedView(tab.id as any)}
            className="gap-2"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content based on selected view */}
        <div>
          {selectedView === 'overview' && (
            <div>
              {renderOverviewMetrics()}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChartIcon className="w-3 h-3" />
                      Safety Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      {activeAnalyses.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={activeAnalyses.map((a, i) => ({
                            driver: drivers.find(d => d.id === a.driverId)?.firstName ?? `D${i + 1}`,
                            safety: Math.round(a.safetyScore),
                            attention: Math.round(a.attentionScore),
                            efficiency: Math.round(a.efficiencyScore),
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="driver" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                            <Line type="monotone" dataKey="safety" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Safety" />
                            <Line type="monotone" dataKey="attention" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Attention" />
                            <Line type="monotone" dataKey="efficiency" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Efficiency" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-white/40">
                          No driver data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-3 h-3" />
                      AI Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardMetrics.predictions.accidentRisks.slice(0, 3).map((prediction) => (
                        <div
                          key={prediction.driverId}
                          className="flex items-center justify-between p-2 bg-white/[0.03] rounded"
                        >
                          <span className="text-sm">
                            {drivers.find((d) => d.id === prediction.driverId)?.firstName} -
                            Accident Risk
                          </span>
                          <Badge
                            variant={prediction.risk.overall > 0.7 ? 'destructive' : 'secondary'}
                          >
                            {Math.round(prediction.risk.overall * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {selectedView === 'drivers' && (
            <div>
              <div className="space-y-2">
                {activeAnalyses.length > 0 ? (
                  activeAnalyses.map(renderDriverAnalysisCard)
                ) : (
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Car className="w-12 h-9 mx-auto mb-2 text-white/40" />
                      <h3 className="text-sm font-semibold mb-2">No Active Drivers</h3>
                      <p className="text-white/70">No drivers are currently being monitored.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {selectedView === 'alerts' && renderAlertsView()}

          {selectedView === 'coaching' && renderCoachingView()}
        </div>
    </div>
  );
};

export default DriverSafetyDashboard;

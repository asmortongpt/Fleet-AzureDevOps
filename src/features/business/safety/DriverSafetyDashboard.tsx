/**
 * Tesla Autopilot-Grade Driver Safety Dashboard
 * Real-time behavior monitoring with coaching recommendations
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Eye, Brain, Zap, TrendingUp, Clock, Phone, Car, Activity, Target, BookOpen, Award, Bell, Gauge, Coffee, AlertCircle, CheckCircle, Timer, Users, BarChart3, LineChart } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import type {
  AIDriverBehaviorAnalysis,
  DriverFatigueAnalysis,
  DistractionAnalysis,
  AccidentPrediction,
  SafetyIntervention,
  SafetyDashboardMetrics,
  Driver,
  Vehicle
} from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/Progress';

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
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  critical: 'text-red-600 bg-red-50 border-red-200'
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
  const [autoRefresh, setAutoRefresh] = useState(true);
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
    const alerts: any[] = [];

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

  const renderOverviewCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      {/* Real-time Metrics */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Active Drivers</p>
              <p className="text-2xl font-bold text-blue-900">
                {dashboardMetrics.realTime.activeDrivers}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-800" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-900">
                {dashboardMetrics.realTime.criticalAlerts}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Interventions</p>
              <p className="text-2xl font-bold text-orange-900">
                {dashboardMetrics.realTime.activeSafetyInterventions}
              </p>
            </div>
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Safety Score</p>
              <p className="text-2xl font-bold text-green-900">
                {Math.round(dashboardMetrics.realTime.averageFleetSafetyScore)}
              </p>
            </div>
            <Gauge className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Fatigue Alerts</p>
              <p className="text-2xl font-bold text-purple-900">
                {dashboardMetrics.realTime.fatigueAlerts}
              </p>
            </div>
            <Coffee className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-700">Distraction</p>
              <p className="text-2xl font-bold text-indigo-900">
                {dashboardMetrics.realTime.distractionAlerts}
              </p>
            </div>
            <Eye className="w-8 h-8 text-indigo-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDriverAnalysisCard = (analysis: AIDriverBehaviorAnalysis) => {
    const driver = drivers.find((d) => d.id === analysis.driverId);
    const vehicle = vehicles.find((v) => v.id === analysis.vehicleId);
    const riskLevel = getRiskLevel(analysis.safetyScore);
    const fatigue = fatigueAnalyses.find((f) => f.driverId === analysis.driverId);
    const distraction = distractionAnalyses.find((d) => d.driverId === analysis.driverId);

    if (!driver) return null;

    return (
      <motion.div
        key={analysis.driverId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Card
          className={`border-l-4 ${riskColors[riskLevel]} hover:shadow-lg transition-all duration-200`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Car className="w-6 h-6 text-slate-700" />
                  </div>
                  {analysis.risk.prediction?.timeToIntervention && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {driver.firstName} {driver.lastName}
                  </CardTitle>
                  <p className="text-sm text-slate-700">
                    {driver.department} • {vehicle?.make} {vehicle?.model}
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
                <div className="text-3xl font-bold">{Math.round(analysis.safetyScore)}</div>
                <div className="text-xs text-gray-500">Safety Score</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Real-time Status indicators */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Shield className="w-4 h-4 text-blue-800" />
                  <span className="ml-1 text-xs">Safety</span>
                </div>
                <div className="font-semibold">{Math.round(analysis.safetyScore)}</div>
              </div>

              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="ml-1 text-xs">Attention</span>
                </div>
                <div className="font-semibold">{Math.round(analysis.attentionScore)}</div>
              </div>

              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="ml-1 text-xs">Aggression</span>
                </div>
                <div className="font-semibold">{Math.round(analysis.aggressionScore)}</div>
              </div>

              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="ml-1 text-xs">Efficiency</span>
                </div>
                <div className="font-semibold">{Math.round(analysis.efficiencyScore)}</div>
              </div>
            </div>

            {/* AI insights */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-800" />
                AI Insights & Alerts
              </h4>

              {/* Fatigue status */}
              {fatigue && fatigue.fatigueLevel > 0.5 && (
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Fatigue Detected</span>
                  </div>
                  <div className="text-sm">Level: {Math.round(fatigue.fatigueLevel * 100)}%</div>
                </div>
              )}

              {/* Distraction status */}
              {distraction && distraction.riskLevel > 0.6 && (
                <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">Distraction Alert</span>
                  </div>
                  <div className="text-sm">Risk: {Math.round(distraction.riskLevel * 100)}%</div>
                </div>
              )}

              {/* Accident risk */}
              {analysis.risk.prediction?.accidentRisk > 0.7 && (
                <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">High Accident Risk</span>
                  </div>
                  <div className="text-sm">
                    {Math.round(analysis.risk.prediction.accidentRisk * 100)}%
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
                  <Target className="w-4 h-4 text-green-600" />
                  AI Coaching Recommendations
                </h4>
                <div className="space-y-1">
                  {analysis.coaching.improvements.slice(0, 2).map((improvement, index) => (
                    <div key={index} className="text-xs text-gray-700 bg-green-50 p-2 rounded">
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
      </motion.div>
    );
  };

  const renderAlertsView = () => (
    <div className="space-y-4">
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
              critical: <AlertCircle className="w-5 h-5 text-red-600" />,
              high: <AlertTriangle className="w-5 h-5 text-orange-600" />,
              medium: <Bell className="w-5 h-5 text-yellow-600" />
            }[alert.severity];

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card
                  className={`border-l-4 ${riskColors[alert.severity as keyof typeof riskColors]}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {severityIcon}
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-slate-700">
                            Driver: {driver?.firstName} {driver?.lastName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {alert.timestamp.toLocaleTimeString()}
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
              </motion.div>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
              <p className="text-slate-700">All drivers are operating within safe parameters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderCoachingView = () => (
    <div className="space-y-6">
      {/* Coaching overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Drivers in Program</p>
                <p className="text-2xl font-bold">{dashboardMetrics.coaching.driversInProgram}</p>
              </div>
              <Users className="w-8 h-8 text-blue-800" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Avg Improvement</p>
                <p className="text-2xl font-bold text-green-600">
                  +{Math.round(dashboardMetrics.coaching.averageImprovement)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(dashboardMetrics.coaching.completionRate)}%
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver coaching cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Coaching Programs</h3>
        {activeAnalyses
          .filter((analysis) => analysis.coaching.goalProgress.length > 0)
          .map((analysis) => {
            const driver = drivers.find((d) => d.id === analysis.driverId);
            if (!driver) return null;

            return (
              <Card key={analysis.driverId} className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-800" />
                    {driver.firstName} {driver.lastName} - Coaching Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.coaching.goalProgress.map((goal) => (
                    <div key={goal.goal} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{goal.title}</span>
                        <Badge variant={goal.progress >= 80 ? 'default' : 'secondary'}>
                          {Math.round(goal.progress)}%
                        </Badge>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="text-sm text-slate-700">
                        Current: {goal.currentValue} | Target: {goal.targetValue}
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 border-t">
                    <h4 className="font-medium text-sm mb-2">Recommended Training</h4>
                    <div className="space-y-1">
                      {analysis.coaching.trainingRecommendations.map((training, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white rounded"
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
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Safety Dashboard</h1>
          <p className="text-slate-700">Tesla Autopilot-grade AI monitoring & coaching</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Timer className="w-4 h-4" />
            Last updated: {lastUpdate.toLocaleTimeString()}
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
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {selectedView === 'overview' && (
            <div>
              {renderOverviewCards()}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="w-5 h-5" />
                      Safety Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Safety score trend chart would go here
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      AI Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardMetrics.predictions.accidentRisks.slice(0, 3).map((prediction) => (
                        <div
                          key={prediction.driverId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
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
              <div className="space-y-4">
                {activeAnalyses.length > 0 ? (
                  activeAnalyses.map(renderDriverAnalysisCard)
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">No Active Drivers</h3>
                      <p className="text-slate-700">No drivers are currently being monitored.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {selectedView === 'alerts' && renderAlertsView()}

          {selectedView === 'coaching' && renderCoachingView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DriverSafetyDashboard;

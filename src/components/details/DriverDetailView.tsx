import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  User, Award, FileText, Calendar, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, Car, MapPin, Clock, Star, Shield,
  GraduationCap, Phone, Mail, Home
} from 'lucide-react';
import { useDrilldown } from '@/contexts/DrilldownContext';

interface Driver {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  photoUrl?: string;
  status?: string;
  department?: string;
  [key: string]: any;
}

interface DriverDetailViewProps {
  driver: Driver;
  onClose?: () => void;
}

export function DriverDetailView({ driver, onClose }: DriverDetailViewProps) {
  const { push } = useDrilldown();
  const [activeTab, setActiveTab] = useState('profile');

  // Mock comprehensive driver data
  const certifications = [
    { id: '1', name: 'Commercial Driver\'s License (CDL)', type: 'Class B', issued: '2023-01-15', expires: '2028-01-15', status: 'valid' },
    { id: '2', name: 'Hazmat Endorsement', type: 'H', issued: '2023-02-20', expires: '2026-02-20', status: 'valid' },
    { id: '3', name: 'Passenger Endorsement', type: 'P', issued: '2023-01-15', expires: '2028-01-15', status: 'valid' },
    { id: '4', name: 'Defensive Driving Certificate', type: 'Training', issued: '2025-06-01', expires: '2026-06-01', status: 'valid' }
  ];

  const performanceMetrics = {
    safetyScore: 94,
    fuelEfficiency: 87,
    onTimePerformance: 96,
    customerSatisfaction: 92,
    maintenanceCompliance: 98,
    overallRating: 4.7
  };

  const assignments = [
    { vehicleId: 'V-001', make: 'Ford', model: 'F-150', assignedDate: '2025-01-01', status: 'active', milesDriven: 12450 },
    { vehicleId: 'V-015', make: 'Chevrolet', model: 'Silverado', assignedDate: '2024-06-01', endDate: '2024-12-31', status: 'completed', milesDriven: 28900 },
    { vehicleId: 'V-008', make: 'Ram', model: '1500', assignedDate: '2024-01-01', endDate: '2024-05-31', status: 'completed', milesDriven: 15200 }
  ];

  const trainingRecords = [
    { id: '1', course: 'Winter Driving Safety', date: '2025-11-15', instructor: 'John Smith', score: 95, status: 'completed' },
    { id: '2', course: 'Emergency Response Procedures', date: '2025-08-20', instructor: 'Sarah Johnson', score: 88, status: 'completed' },
    { id: '3', course: 'Vehicle Pre-Trip Inspection', date: '2025-05-10', instructor: 'Mike Williams', score: 92, status: 'completed' },
    { id: '4', course: 'DOT Compliance Update', date: '2026-01-15', instructor: 'TBD', score: null, status: 'scheduled' }
  ];

  const incidents = [
    { id: '1', date: '2025-10-12', type: 'Minor Accident', description: 'Backing incident in parking lot', severity: 'low', resolved: true },
    { id: '2', date: '2025-06-05', type: 'Traffic Violation', description: 'Speeding - 5 mph over limit', severity: 'low', resolved: true }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
      case 'active':
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header Section with Photo */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-white">
              <AvatarImage src={driver.photoUrl} alt={driver.name} />
              <AvatarFallback className="bg-indigo-500 text-white text-2xl">
                {driver.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold mb-1">{driver.name}</h1>
              <p className="text-indigo-100 mb-2">{driver.department || 'Fleet Operations'}</p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {driver.email || 'N/A'}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {driver.phone || 'N/A'}
                </div>
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-indigo-700">
              <XCircle className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs text-indigo-200">Safety Score</p>
            <p className="text-2xl font-bold">{performanceMetrics.safetyScore}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs text-indigo-200">Overall Rating</p>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <p className="text-2xl font-bold">{performanceMetrics.overallRating}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs text-indigo-200">License Status</p>
            <p className="text-2xl font-bold">Valid</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs text-indigo-200">Years of Service</p>
            <p className="text-2xl font-bold">5.2</p>
          </div>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-medium">{driver.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employee ID:</span>
                    <span className="font-medium">{driver.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-blue-600">{driver.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{driver.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{driver.department || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(driver.status || 'active')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    License Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Number:</span>
                    <span className="font-mono">{driver.licenseNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class:</span>
                    <span className="font-medium">Class B CDL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issued:</span>
                    <span className="font-medium">2023-01-15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">{driver.licenseExpiry || '2028-01-15'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Endorsements:</span>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">H</Badge>
                      <Badge variant="secondary" className="text-xs">P</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="default" className="bg-green-500">Valid</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Recent Incidents
                  </CardTitle>
                  <CardDescription>{incidents.length} incidents in last 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {incidents.map((incident) => (
                      <div key={incident.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{incident.type}</p>
                            <Badge variant={incident.severity === 'low' ? 'secondary' : 'destructive'} className="text-xs">
                              {incident.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{incident.description}</p>
                          <p className="text-xs text-muted-foreground">Date: {incident.date}</p>
                        </div>
                        {incident.resolved && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Licenses & Certifications
                </CardTitle>
                <CardDescription>{certifications.length} active certifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{cert.name}</h4>
                            {getStatusBadge(cert.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">Type: {cert.type}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs mt-3 pt-3 border-t">
                        <div>
                          <span className="text-muted-foreground">Issued:</span>
                          <p className="font-medium">{cert.issued}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expires:</span>
                          <p className="font-medium">{cert.expires}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Safety Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <p className={`text-4xl font-bold ${getScoreColor(performanceMetrics.safetyScore)}`}>
                      {performanceMetrics.safetyScore}
                    </p>
                    <p className="text-muted-foreground mb-1">/ 100</p>
                  </div>
                  <Progress value={performanceMetrics.safetyScore} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">Based on incident-free miles and compliance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fuel Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <p className={`text-4xl font-bold ${getScoreColor(performanceMetrics.fuelEfficiency)}`}>
                      {performanceMetrics.fuelEfficiency}
                    </p>
                    <p className="text-muted-foreground mb-1">/ 100</p>
                  </div>
                  <Progress value={performanceMetrics.fuelEfficiency} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">MPG performance vs. fleet average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">On-Time Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <p className={`text-4xl font-bold ${getScoreColor(performanceMetrics.onTimePerformance)}`}>
                      {performanceMetrics.onTimePerformance}
                    </p>
                    <p className="text-muted-foreground mb-1">/ 100</p>
                  </div>
                  <Progress value={performanceMetrics.onTimePerformance} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">Deliveries on schedule</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Customer Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <p className={`text-4xl font-bold ${getScoreColor(performanceMetrics.customerSatisfaction)}`}>
                      {performanceMetrics.customerSatisfaction}
                    </p>
                    <p className="text-muted-foreground mb-1">/ 100</p>
                  </div>
                  <Progress value={performanceMetrics.customerSatisfaction} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">Average customer rating</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Maintenance Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <p className={`text-4xl font-bold ${getScoreColor(performanceMetrics.maintenanceCompliance)}`}>
                      {performanceMetrics.maintenanceCompliance}
                    </p>
                    <p className="text-muted-foreground mb-1">/ 100</p>
                  </div>
                  <Progress value={performanceMetrics.maintenanceCompliance} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">Pre-trip inspections completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Overall Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                    <p className="text-4xl font-bold text-yellow-600">{performanceMetrics.overallRating}</p>
                    <p className="text-muted-foreground">/ 5.0</p>
                  </div>
                  <Progress value={(performanceMetrics.overallRating / 5) * 100} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">Composite performance score</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle Assignment History
                </CardTitle>
                <CardDescription>{assignments.length} total assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.vehicleId}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => push({
                        id: `vehicle-${assignment.vehicleId}`,
                        type: 'vehicle',
                        label: `${assignment.make} ${assignment.model}`,
                        data: assignment
                      })}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{assignment.make} {assignment.model}</h4>
                            {getStatusBadge(assignment.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">Vehicle ID: {assignment.vehicleId}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Assigned:</span>
                              <p className="font-medium">{assignment.assignedDate}</p>
                            </div>
                            {assignment.endDate && (
                              <div>
                                <span className="text-muted-foreground">Ended:</span>
                                <p className="font-medium">{assignment.endDate}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Miles Driven:</span>
                              <p className="font-medium">{assignment.milesDriven.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Training & Development
                </CardTitle>
                <CardDescription>{trainingRecords.length} total courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trainingRecords.map((training) => (
                    <div key={training.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{training.course}</h4>
                            {getStatusBadge(training.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">Instructor: {training.instructor}</p>
                        </div>
                        {training.score && (
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${getScoreColor(training.score)}`}>{training.score}</p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        )}
                      </div>
                      <div className="text-xs mt-3 pt-3 border-t">
                        <span className="text-muted-foreground">Date:</span>
                        <p className="font-medium">{training.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

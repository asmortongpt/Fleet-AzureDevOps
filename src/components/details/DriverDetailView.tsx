import {
  User, Award, AlertTriangle,
  CheckCircle, XCircle, Car, Clock, Star, Shield,
  GraduationCap, Phone, Mail
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { secureFetch } from '@/hooks/use-api';

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

  const [certifications, setCertifications] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchDriverDetails = async () => {
      try {
        const [certRes, perfRes, assignRes, trainingRes, incidentRes] = await Promise.all([
          secureFetch(`/api/v1/drivers/${driver.id}/certifications`),
          secureFetch(`/api/v1/drivers/${driver.id}/performance`),
          secureFetch(`/api/v1/drivers/${driver.id}/assignments`),
          secureFetch(`/api/v1/drivers/${driver.id}/training`),
          secureFetch(`/api/v1/drivers/${driver.id}/incidents`)
        ]);

        if (!isMounted) return;

        if (certRes.ok) {
          const payload = await certRes.json();
          setCertifications(payload.data || payload || []);
        }
        if (perfRes.ok) {
          const payload = await perfRes.json();
          setPerformanceMetrics(payload.data || payload || null);
        }
        if (assignRes.ok) {
          const payload = await assignRes.json();
          setAssignments(payload.data || payload || []);
        }
        if (trainingRes.ok) {
          const payload = await trainingRes.json();
          setTrainingRecords(payload.data || payload || []);
        }
        if (incidentRes.ok) {
          const payload = await incidentRes.json();
          setIncidents(payload.data || payload || []);
        }
      } catch {
        if (!isMounted) return;
        setCertifications([]);
        setPerformanceMetrics(null);
        setAssignments([]);
        setTrainingRecords([]);
        setIncidents([]);
      }
    };

    fetchDriverDetails();

    return () => {
      isMounted = false;
    };
  }, [driver.id]);

  const performance = useMemo(() => ({
    safetyScore: Number(performanceMetrics?.safetyScore || performanceMetrics?.safety_score || 0),
    fuelEfficiency: Number(performanceMetrics?.fuelEfficiency || performanceMetrics?.fuel_efficiency || 0),
    onTimePerformance: Number(performanceMetrics?.onTimePerformance || performanceMetrics?.on_time_performance || 0),
    customerSatisfaction: Number(performanceMetrics?.customerSatisfaction || performanceMetrics?.customer_satisfaction || 0),
    maintenanceCompliance: Number(performanceMetrics?.maintenanceCompliance || performanceMetrics?.maintenance_compliance || 0),
    overallRating: Number(performanceMetrics?.overallRating || performanceMetrics?.overall_rating || 0)
  }), [performanceMetrics]);

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

  const licenseStatus = useMemo(() => {
    if (!driver.licenseExpiry) return 'Unknown';
    const expiry = new Date(driver.licenseExpiry);
    if (Number.isNaN(expiry.getTime())) return 'Unknown';
    return expiry < new Date() ? 'Expired' : 'Valid';
  }, [driver.licenseExpiry]);

  const yearsOfService = useMemo(() => {
    const start = driver.hireDate || driver.startDate || driver.createdAt;
    if (!start) return 'N/A';
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) return 'N/A';
    const years = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return years.toFixed(1);
  }, [driver.hireDate, driver.startDate, driver.createdAt]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header Section with Photo */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-20 h-20 border-4 border-white">
              <AvatarImage src={driver.photoUrl} alt={driver.name} />
              <AvatarFallback className="bg-indigo-500 text-white text-sm">
                {driver.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-sm font-bold mb-1">{driver.name}</h1>
              <p className="text-indigo-100 mb-2">{driver.department || 'Fleet Operations'}</p>
              <div className="flex gap-2 text-sm">
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
              <XCircle className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs text-indigo-200">Safety Score</p>
            <p className="text-sm font-bold">{performance.safetyScore || 'N/A'}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs text-indigo-200">Overall Rating</p>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <p className="text-sm font-bold">{performance.overallRating || 'N/A'}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs text-indigo-200">License Status</p>
            <p className="text-sm font-bold">{licenseStatus}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs text-indigo-200">Years of Service</p>
            <p className="text-sm font-bold">{yearsOfService}</p>
          </div>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full mb-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                    <span className="font-medium text-blue-800">{driver.email || 'N/A'}</span>
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
                    <span className="font-medium">{driver.licenseClass || driver.license_type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issued:</span>
                    <span className="font-medium">{driver.licenseIssued || driver.license_issued || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">{driver.licenseExpiry || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Endorsements:</span>
                    <div className="flex gap-1">
                      {(driver.endorsements || driver.license_endorsements || []).length > 0 ? (
                        (driver.endorsements || driver.license_endorsements || []).map((endorsement: string) => (
                          <Badge key={endorsement} variant="secondary" className="text-xs">{endorsement}</Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={licenseStatus === 'Expired' ? 'destructive' : 'default'} className={licenseStatus === 'Expired' ? '' : 'bg-green-500'}>
                      {licenseStatus}
                    </Badge>
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
                    {incidents.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No incidents reported.</div>
                    ) : (
                      incidents.map((incident) => (
                        <div key={incident.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{incident.type || incident.category || 'Incident'}</p>
                              <Badge variant={(incident.severity || 'low') === 'low' ? 'secondary' : 'destructive'} className="text-xs">
                                {incident.severity || 'low'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{incident.description || incident.summary || 'Incident details not available'}</p>
                            <p className="text-xs text-muted-foreground">Date: {incident.date || incident.created_at || 'N/A'}</p>
                          </div>
                          {incident.resolved && (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      ))
                    )}
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
                  <Award className="w-3 h-3" />
                  Licenses & Certifications
                </CardTitle>
                <CardDescription>{certifications.length} active certifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {certifications.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No certifications found.</div>
                  ) : (
                    certifications.map((cert) => (
                      <div key={cert.id} className="border rounded-lg p-2">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{cert.name || cert.title || 'Certification'}</h4>
                              {getStatusBadge(cert.status || 'valid')}
                            </div>
                            <p className="text-sm text-muted-foreground">Type: {cert.type || cert.category || ''}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t">
                          <div>
                            <span className="text-muted-foreground">Issued:</span>
                            <p className="font-medium">{cert.issued || cert.issued_at || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expires:</span>
                            <p className="font-medium">{cert.expires || cert.expires_at || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Safety Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold mb-2">{performance.safetyScore || 0}%</div>
                  <Progress value={performance.safetyScore || 0} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">Top 10% of fleet</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fuel Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold mb-2">{performance.fuelEfficiency || 0}%</div>
                  <Progress value={performance.fuelEfficiency || 0} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">Above fleet average</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">On-Time Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold mb-2">{performance.onTimePerformance || 0}%</div>
                  <Progress value={performance.onTimePerformance || 0} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">Excellent performance</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Customer Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold mb-2">{performance.customerSatisfaction || 0}%</div>
                  <Progress value={performance.customerSatisfaction || 0} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">Based on feedback</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Maintenance Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold mb-2">{performance.maintenanceCompliance || 0}%</div>
                  <Progress value={performance.maintenanceCompliance || 0} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">Pre-trip inspections</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-3 h-3" />
                  Vehicle Assignments
                </CardTitle>
                <CardDescription>Current and past vehicle assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No assignments available.</div>
                  ) : (
                    assignments.map((assignment) => (
                      <div key={assignment.vehicleId || assignment.id} className="border rounded-lg p-2">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{assignment.make || assignment.vehicle_make || ''} {assignment.model || assignment.vehicle_model || ''}</h4>
                              {getStatusBadge(assignment.status || 'active')}
                            </div>
                            <p className="text-sm text-muted-foreground">ID: {assignment.vehicleId || assignment.vehicle_id || assignment.id}</p>
                          </div>
                          <p className="text-sm font-medium">{Number(assignment.milesDriven || assignment.miles_driven || 0).toLocaleString()} mi</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t">
                          <div>
                            <span className="text-muted-foreground">Assigned:</span>
                            <p className="font-medium">{assignment.assignedDate || assignment.assigned_date || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">End Date:</span>
                            <p className="font-medium">{assignment.endDate || assignment.end_date || 'Current'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-3 h-3" />
                  Training Records
                </CardTitle>
                <CardDescription>Completed and scheduled training sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trainingRecords.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No training records available.</div>
                  ) : (
                    trainingRecords.map((record) => (
                      <div key={record.id} className="border rounded-lg p-2">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{record.course || record.title || 'Training'}</h4>
                              {getStatusBadge(record.status || 'completed')}
                            </div>
                            <p className="text-sm text-muted-foreground">Instructor: {record.instructor || record.trainer || 'N/A'}</p>
                          </div>
                          {record.score && (
                            <div className={`font-bold text-sm ${getScoreColor(record.score)}`}>
                              {record.score}%
                            </div>
                          )}
                        </div>
                        <div className="text-xs mt-3 pt-3 border-t">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium ml-1">{record.date || record.completed_at || 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * E2E Test Page - Complete End-to-End Verification
 *
 * This page demonstrates the complete workflow:
 * 1. Form → API → Database → UI Display
 * 2. Real data from PostgreSQL (no mocks)
 * 3. Provable with database queries
 *
 * Use this page to verify the Fleet CTA application works end-to-end.
 */

import { useState, useEffect } from 'react'
import toast from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, RefreshCw, Database } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  created_at: string
}

interface MaintenanceSchedule {
  id: string
  vehicle_id: string
  name: string
  description: string
  type: string
  interval_days: number | null
  estimated_cost: string
  vin: string
  make: string
  model: string
  year: number
  created_at: string
}

interface Vehicle {
  id: string
  vin: string
  make: string
  model: string
  year: number
  status: string
}

export default function E2ETestPage() {
  // State
  const [users, setUsers] = useState<User[]>([])
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // User form state
  const [userForm, setUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'Driver'
  })

  // Maintenance form state
  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicleId: '',
    name: '',
    description: '',
    type: 'preventive',
    intervalDays: '90',
    nextServiceDate: '',
    estimatedCost: '75.50',
    estimatedDuration: '60'
  })

  // Fetch all data
  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [usersRes, maintenanceRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE}/api/e2e-test/users`),
        fetch(`${API_BASE}/api/e2e-test/maintenance-schedules`),
        fetch(`${API_BASE}/api/e2e-test/vehicles`)
      ])

      if (!usersRes.ok || !maintenanceRes.ok || !vehiclesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [usersData, maintenanceData, vehiclesData] = await Promise.all([
        usersRes.json(),
        maintenanceRes.json(),
        vehiclesRes.json()
      ])

      setUsers(usersData.data || [])
      setMaintenanceSchedules(maintenanceData.data || [])
      setVehicles(vehiclesData.data || [])

      toast.success('Data loaded from database')
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create user
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/e2e-test/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      const result = await response.json()
      toast.success('User created: ' + result.data.email)

      // Reset form
      setUserForm({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'Driver'
      })

      // Refresh data
      await fetchData()
    } catch (err: any) {
      toast.error('Failed to create user: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create maintenance schedule
  const createMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        vehicleId: maintenanceForm.vehicleId,
        name: maintenanceForm.name,
        description: maintenanceForm.description,
        type: maintenanceForm.type,
        intervalDays: parseInt(maintenanceForm.intervalDays) || null,
        nextServiceDate: maintenanceForm.nextServiceDate || null,
        estimatedCost: parseFloat(maintenanceForm.estimatedCost) || null,
        estimatedDuration: parseInt(maintenanceForm.estimatedDuration) || null
      }

      const response = await fetch(`${API_BASE}/api/e2e-test/maintenance-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create maintenance schedule')
      }

      const result = await response.json()
      toast.success('Maintenance schedule created: ' + result.data.name)

      // Reset form
      setMaintenanceForm({
        vehicleId: '',
        name: '',
        description: '',
        type: 'preventive',
        intervalDays: '90',
        nextServiceDate: '',
        estimatedCost: '75.50',
        estimatedDuration: '60'
      })

      // Refresh data
      await fetchData()
    } catch (err: any) {
      toast.error('Failed to create maintenance schedule: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleet CTA - E2E Test Dashboard</h1>
          <p className="text-muted-foreground">Complete End-to-End Verification with Real Database Data</p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh Data
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground">Total users in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Maintenance Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{maintenanceSchedules.length}</div>
            <p className="text-sm text-muted-foreground">Total schedules in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{vehicles.length}</div>
            <p className="text-sm text-muted-foreground">Total vehicles available</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create User Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>Test user creation workflow: Form → API → Database → UI</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="555-1234"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Driver">Driver</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Create User
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Create Maintenance Schedule Form */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Maintenance</CardTitle>
            <CardDescription>Test maintenance workflow: Form → API → Database → UI</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createMaintenance} className="space-y-4">
              <div>
                <Label htmlFor="vehicle">Vehicle *</Label>
                <Select value={maintenanceForm.vehicleId} onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, vehicleId: value })}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.vin})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  placeholder="Oil Change"
                  value={maintenanceForm.name}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Routine maintenance..."
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={maintenanceForm.type} onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, type: value })}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="intervalDays">Interval (days)</Label>
                  <Input
                    id="intervalDays"
                    type="number"
                    value={maintenanceForm.intervalDays}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, intervalDays: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedCost">Est. Cost ($)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    step="0.01"
                    value={maintenanceForm.estimatedCost}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, estimatedCost: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="estimatedDuration">Duration (min)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={maintenanceForm.estimatedDuration}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, estimatedDuration: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nextServiceDate">Next Service Date</Label>
                <Input
                  id="nextServiceDate"
                  type="datetime-local"
                  value={maintenanceForm.nextServiceDate}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextServiceDate: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !maintenanceForm.vehicleId}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Create Schedule
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users (Real Data from Database)</CardTitle>
          <CardDescription>Showing {users.length} users - all data retrieved from PostgreSQL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 10).map((user) => (
                  <tr key={user.id} className="border-b hover:bg-accent/50">
                    <td className="p-2 font-mono text-xs">{user.email}</td>
                    <td className="p-2">{user.first_name} {user.last_name}</td>
                    <td className="p-2">
                      <Badge variant="outline">{user.role}</Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground text-xs">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedules (Real Data from Database)</CardTitle>
          <CardDescription>Showing {maintenanceSchedules.length} schedules - all data retrieved from PostgreSQL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Service Name</th>
                  <th className="text-left p-2">Vehicle</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Interval</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceSchedules.slice(0, 10).map((schedule) => (
                  <tr key={schedule.id} className="border-b hover:bg-accent/50">
                    <td className="p-2 font-medium">{schedule.name}</td>
                    <td className="p-2 text-xs">
                      <div>{schedule.year} {schedule.make} {schedule.model}</div>
                      <div className="text-muted-foreground font-mono">{schedule.vin}</div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{schedule.type}</Badge>
                    </td>
                    <td className="p-2">${schedule.estimated_cost}</td>
                    <td className="p-2">{schedule.interval_days ? `${schedule.interval_days} days` : 'N/A'}</td>
                    <td className="p-2 text-muted-foreground text-xs">
                      {new Date(schedule.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Database Verification Instructions */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Verification
          </CardTitle>
          <CardDescription>Verify this data matches the PostgreSQL database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Verify Users in Database:</h4>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test -c "SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 10;"
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Verify Maintenance Schedules in Database:</h4>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test -c "SELECT id, name, type, estimated_cost, interval_days, created_at FROM maintenance_schedules ORDER BY created_at DESC LIMIT 10;"
            </pre>
          </div>

          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-900 dark:text-green-100">
              If the data above matches the database queries, the end-to-end workflow is working correctly!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  User, 
  Phone, 
  EnvelopeSimple, 
  IdentificationCard,
  Warning,
  Certificate,
  Plus,
  MagnifyingGlass
} from "@phosphor-icons/react"
import { Driver, Staff } from "@/lib/types"
import { useState } from "react"
import { useFleetData } from "@/hooks/use-fleet-data"

interface PeopleManagementProps {
  data: ReturnType<typeof useFleetData>
}

export function PeopleManagement() {
  const data = useFleetData()
  const drivers = data.drivers || []
  const staff = data.staff || []
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("drivers")

  const filteredDrivers = drivers.filter(d =>
    !searchQuery ||
    (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.employeeId && d.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredStaff = staff.filter(s =>
    !searchQuery ||
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.employeeId && s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">People Management</h1>
        <div className="flex gap-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Person
          </Button>
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or employee ID..."
          value={searchQuery || ""}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="drivers">Drivers ({drivers.length})</TabsTrigger>
          <TabsTrigger value="staff">Staff ({staff.length})</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">License</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safety Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Certifications</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {filteredDrivers.map(driver => (
                    <tr
                      key={driver.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium">{driver.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{driver.employeeId || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{driver.department || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-sm">
                        <a href={`tel:${driver.phone}`} className="hover:text-primary hover:underline">
                          {driver.phone || 'No phone'}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <a href={`mailto:${driver.email}`} className="hover:text-primary hover:underline truncate max-w-[200px] block">
                          {driver.email || 'No email'}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline" className="text-xs">
                          <IdentificationCard className="w-3 h-3 mr-1" />
                          {driver.licenseType || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline" className={driver.status === "active" ? "bg-success/10 text-success border-success/20" : ""}>
                          {driver.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{driver.safetyScore}</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {(driver.certifications || []).map(cert => (
                            <Badge key={cert} variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                              <Certificate className="w-3 h-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.location.href = `tel:${driver.phone}`}
                          >
                            <Phone className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.location.href = `mailto:${driver.email}`}
                          >
                            <EnvelopeSimple className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              window.location.hash = 'driver-performance'
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {filteredStaff.map(member => (
                    <tr
                      key={member.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium">{member.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{member.employeeId || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{member.department}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">{member.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <a href={`tel:${member.phone}`} className="hover:text-primary hover:underline">
                          {member.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <a href={`mailto:${member.email}`} className="hover:text-primary hover:underline truncate max-w-[200px] block">
                          {member.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.location.href = `tel:${member.phone}`}
                          >
                            <Phone className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.location.href = `mailto:${member.email}`}
                          >
                            <EnvelopeSimple className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="certifications">
          <Card>
            <CardHeader>
              <CardTitle>Training & Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track driver certifications, training completion, and compliance requirements.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Driver Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage driver shifts, availability, and scheduling.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

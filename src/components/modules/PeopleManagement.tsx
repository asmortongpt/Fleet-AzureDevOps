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

export function PeopleManagement({ data }: PeopleManagementProps) {
  const drivers = data.drivers || []
  const staff = data.staff || []
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("drivers")

  const filteredDrivers = drivers.filter(d => 
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredStaff = staff.filter(s => 
    !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="grid grid-cols-1 gap-4">
            {filteredDrivers.map(driver => (
              <Card key={driver.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{driver.name}</h3>
                          <p className="text-sm text-muted-foreground">{driver.employeeId} • {driver.department}</p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{driver.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <EnvelopeSimple className="w-4 h-4 text-muted-foreground" />
                            <span>{driver.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IdentificationCard className="w-4 h-4 text-muted-foreground" />
                            <span>{driver.licenseType}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {driver.certifications.map(cert => (
                            <Badge key={cert} variant="outline" className="bg-success/10 text-success border-success/20">
                              <Certificate className="w-3 h-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant="outline" className={driver.status === "active" ? "bg-success/10 text-success border-success/20" : ""}>
                        {driver.status}
                      </Badge>
                      <div className="text-2xl font-semibold">{driver.safetyScore}</div>
                      <div className="text-xs text-muted-foreground">Safety Score</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `tel:${driver.phone}`}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `mailto:${driver.email}`}
                    >
                      <EnvelopeSimple className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Navigate to driver performance with this driver selected
                        window.location.hash = 'driver-performance'
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredStaff.map(member => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">{member.employeeId}</p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{member.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <EnvelopeSimple className="w-4 h-4 text-muted-foreground" />
                            <span>{member.email}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{member.department}</Badge>
                          <Badge variant="outline">{member.role}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 flex flex-col items-end">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {member.status}
                      </Badge>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `tel:${member.phone}`}
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `mailto:${member.email}`}
                        >
                          <EnvelopeSimple className="w-3 h-3 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

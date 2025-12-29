import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Driver } from '@/types'

interface DriverDetailDrilldownProps {
  driver: Driver
}

export function DriverDetailDrilldown({ driver }: DriverDetailDrilldownProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{driver.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="vehicles">Assigned Vehicles</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-lg">{driver.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-lg">{driver.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">License Number</p>
                  <p className="text-lg">{driver.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-lg capitalize">{driver.status}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="performance">
              <p>Safety score, fuel efficiency, on-time delivery rate</p>
            </TabsContent>
            
            <TabsContent value="vehicles">
              <p>List of assigned vehicles and usage history</p>
            </TabsContent>
            
            <TabsContent value="compliance">
              <p>License expiration, certifications, training records</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

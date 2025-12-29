import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Vehicle } from '@/types'

interface VehicleDetailDrilldownProps {
  vehicle: Vehicle
}

export function VehicleDetailDrilldown({ vehicle }: VehicleDetailDrilldownProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {vehicle.make} {vehicle.model}
            <span className="text-sm font-normal text-muted-foreground">
              VIN: {vehicle.vin}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="trips">Trip History</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Year</p>
                  <p className="text-2xl">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Mileage</p>
                  <p className="text-2xl">{vehicle.mileage?.toLocaleString()} mi</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-2xl capitalize">{vehicle.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">License Plate</p>
                  <p className="text-2xl">{vehicle.licensePlate}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="maintenance">
              <p>Maintenance history and upcoming service</p>
            </TabsContent>
            
            <TabsContent value="trips">
              <p>Recent trips and route history</p>
            </TabsContent>
            
            <TabsContent value="costs">
              <p>Fuel costs, maintenance costs, total cost of ownership</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

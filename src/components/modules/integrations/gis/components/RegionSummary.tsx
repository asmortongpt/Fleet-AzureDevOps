/**
 * Region Summary - Displays metrics for the selected region
 */

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RegionSummaryProps {
  selectedRegion: string
  vehicleCount: number
  facilityCount: number
}

export function RegionSummary({ selectedRegion, vehicleCount, facilityCount }: RegionSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Region Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coverage Area</span>
            <span className="font-medium">{selectedRegion === "all" ? "Statewide" : selectedRegion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vehicles</span>
            <span className="font-medium">{vehicleCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Facilities</span>
            <span className="font-medium">{facilityCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Response Time</span>
            <span className="font-medium">12 min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Region Status</span>
            <Badge className="bg-success/10 text-success border-success/20">Operational</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

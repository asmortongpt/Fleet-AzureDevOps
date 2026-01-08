/**
 * Facilities Sidebar - Displays list of facilities in the region
 */

import { Buildings, CarProfile, Wrench, GasPump } from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GISFacility } from "@/lib/types"

interface FacilitiesSidebarProps {
  facilities: GISFacility[]
}

function getFacilityIcon(type: GISFacility["type"]) {
  switch (type) {
    case "office":
      return <Buildings className="w-5 h-5" />
    case "depot":
      return <CarProfile className="w-5 h-5" />
    case "service-center":
      return <Wrench className="w-5 h-5" />
    case "fueling-station":
      return <GasPump className="w-5 h-5" />
  }
}

export function FacilitiesSidebar({ facilities }: FacilitiesSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Facilities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {facilities.slice(0, 6).map((facility) => (
            <div key={facility.id} className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">{getFacilityIcon(facility.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{facility.name}</p>
                <p className="text-xs text-muted-foreground">{facility.type.replace("-", " ")}</p>
                <p className="text-xs text-muted-foreground mt-1">{facility.address}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  facility.status === "operational"
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-warning/10 text-warning border-warning/20"
                }
              >
                {facility.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

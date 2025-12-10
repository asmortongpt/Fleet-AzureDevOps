/**
 * Examples Tab - Shows public ArcGIS service examples
 */

import { Copy } from "@phosphor-icons/react"
import { useCallback } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ExampleServiceProps {
  name: string
  url: string
  type: string
  description: string
}

function ExampleService({ name, url, type, description }: ExampleServiceProps) {
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(url)
  }, [url])

  return (
    <div className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline">{type}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-muted p-2 rounded font-mono truncate">{url}</code>
        <Button size="sm" variant="outline" onClick={copyToClipboard} aria-label="Action button">
          <Copy className="w-3 h-3 mr-1" />
          Copy
        </Button>
      </div>
    </div>
  )
}

export function ExamplesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example ArcGIS Services</CardTitle>
        <CardDescription>Public ArcGIS services you can use to test the integration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ExampleService
          name="USA States"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2"
          type="feature"
          description="US state boundaries with population data"
        />
        <ExampleService
          name="World Cities"
          url="https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0"
          type="feature"
          description="Major cities worldwide with population information"
        />
        <ExampleService
          name="Traffic Cameras (Minnesota)"
          url="https://gis.dot.state.mn.us/arcgis/rest/services/sdw/traffic_cameras/MapServer/0"
          type="feature"
          description="Live traffic camera locations in Minnesota"
        />
        <ExampleService
          name="World Imagery"
          url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
          type="tile"
          description="High-resolution satellite imagery worldwide"
        />
      </CardContent>
    </Card>
  )
}

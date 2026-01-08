/**
 * Help Tab - User guide for ArcGIS Integration
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HelpTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to Use ArcGIS Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 prose prose-sm max-w-none">
        <div>
          <h3 className="font-semibold text-base">Step 1: Find Your ArcGIS Service URL</h3>
          <p className="text-muted-foreground">
            Obtain the REST API URL from your ArcGIS Online, Portal, or Server instance. The URL should end with
            /FeatureServer, /MapServer, or /ImageServer followed by an optional layer index (e.g., /FeatureServer/0).
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base">Step 2: Test Your Connection</h3>
          <p className="text-muted-foreground">
            Before adding a layer, use the "Test Connection" button to verify the service is accessible and retrieve
            its capabilities. This will auto-populate layer information if available.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base">Step 3: Add Authentication (if needed)</h3>
          <p className="text-muted-foreground">
            For secured services, provide an ArcGIS token. Generate tokens from your ArcGIS portal's token generation
            page. Tokens typically expire after a set period and may need to be refreshed.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base">Step 4: Configure Layer Settings</h3>
          <p className="text-muted-foreground">
            Adjust opacity, zoom levels, and refresh intervals to control how the layer appears and behaves on your
            map. Advanced options allow fine-tuned control over layer visibility and performance.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-base">Supported Layer Types</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>
              <strong>Feature Layers:</strong> Vector features with attributes and geometry
            </li>
            <li>
              <strong>Tile Layers:</strong> Pre-rendered cached tiles for fast performance
            </li>
            <li>
              <strong>Dynamic Layers:</strong> Server-rendered on demand with custom styling
            </li>
            <li>
              <strong>Image Layers:</strong> Raster imagery and satellite data
            </li>
            <li>
              <strong>WMS Layers:</strong> OGC Web Map Service endpoints
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base">Performance Tips</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Set appropriate zoom level ranges to avoid loading unnecessary data</li>
            <li>Use tile layers when possible for better performance</li>
            <li>Limit the number of active layers to 3-5 for optimal map performance</li>
            <li>Disable auto-refresh unless real-time data is required</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-base">Troubleshooting</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>
              <strong>Connection Failed:</strong> Verify the URL is correct and the service is accessible
            </li>
            <li>
              <strong>401 Unauthorized:</strong> Check your authentication token is valid and not expired
            </li>
            <li>
              <strong>CORS Error:</strong> The ArcGIS service must allow requests from this domain
            </li>
            <li>
              <strong>Layer Not Visible:</strong> Check zoom level constraints and layer opacity
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

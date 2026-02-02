# External MCP Server Integration Guide

This guide explains how to integrate Fleet CTA MCP Server with external MCP servers to enhance fleet management capabilities with real-time data from third-party services.

## Overview

Fleet CTA can leverage external MCP servers to access:
- **Weather data** for route planning and safety
- **Geolocation services** for enhanced tracking
- **Traffic information** for route optimization
- **Fuel price data** for cost analysis
- **Financial data** for operational economics

---

## Recommended External MCP Servers

### 1. Fetch Server (Official Reference)
**Purpose**: Web content fetching and conversion for LLMs

**Fleet Use Cases**:
- Extract real-time traffic data from DOT websites
- Fetch fuel prices from GasBuddy or AAA
- Pull weather alerts from NOAA
- Get road closure information

**Installation**:
```bash
npx @modelcontextprotocol/create-server fetch
```

**Integration Example**:
```typescript
// Use with Fleet CTA to get fuel prices before route planning
const fuelPrices = await fetch_tool({
  url: "https://gasprices.aaa.com",
  max_length: 5000
});
```

---

### 2. Time Server (Official Reference)
**Purpose**: Time and timezone conversion

**Fleet Use Cases**:
- Coordinate driver shifts across time zones
- Schedule maintenance windows
- Track HOS (Hours of Service) compliance
- Calculate delivery ETAs across zones

**Installation**:
```bash
npx @modelcontextprotocol/create-server time
```

**Integration Example**:
```typescript
// Convert delivery time to driver's local timezone
const driverLocalTime = await time_convert({
  time: "2026-02-03T14:00:00Z",
  from_timezone: "UTC",
  to_timezone: "America/Los_Angeles"
});
```

---

### 3. Baidu Map Server (Third-Party)
**Purpose**: Location services and geospatial analysis

**Fleet Use Cases**:
- Route optimization for Chinese operations
- Location-based vehicle tracking
- Distance calculations
- Geocoding addresses

**Repository**: Check MCP Registry for latest version

**Integration Example**:
```typescript
// Get route between two points
const route = await baidu_map_directions({
  origin: { lat: 39.9042, lng: 116.4074 },
  destination: { lat: 31.2304, lng: 121.4737 },
  optimize: true
});
```

---

### 4. AlphaVantage Server (Third-Party)
**Purpose**: Financial market data including commodity prices

**Fleet Use Cases**:
- Track diesel fuel commodity prices
- Monitor oil price trends
- Analyze transportation economics
- Forecast fuel cost changes

**Integration Example**:
```typescript
// Get current crude oil prices
const oilPrice = await alphavantage_commodity({
  symbol: "WTI",
  function: "CRUDE_OIL"
});
```

---

### 5. Weather Service Integrations

**Available Options**:
- **VariFlight MCP** - Civil aviation weather data
- **Tako** - Real-time weather with visualizations
- **Custom NOAA integration** via Fetch server

**Fleet Use Cases**:
- Pre-trip weather checks
- Winter storm route adjustments
- Severe weather alerts
- Road condition predictions

**Example Integration**:
```typescript
// Get weather along route
const weatherData = await fetch_tool({
  url: "https://api.weather.gov/points/38.8977,-77.0365",
  extract: ["forecast", "hazards"]
});
```

---

## Integration Architecture

### Option 1: Multi-Server Configuration (Recommended)

Configure Claude Desktop or your MCP client to connect to multiple servers simultaneously:

```json
{
  "mcpServers": {
    "fleet-cta": {
      "command": "node",
      "args": ["/path/to/fleet-cta-mcp-server/dist/index.js"],
      "env": {
        "FLEET_API_URL": "http://localhost:3001/api"
      }
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "time": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-time"]
    }
  }
}
```

**Benefits**:
- LLM can call tools from any connected server
- Tools remain independent and maintainable
- Easy to add/remove services

### Option 2: Orchestration Layer

Create a meta-server that orchestrates calls to multiple MCP servers:

```typescript
// Advanced: Create orchestration tools
server.registerTool(
  "fleet_route_with_weather",
  {
    title: "Get Route with Weather Forecast",
    description: "Combines Fleet CTA routing with weather data",
    inputSchema: {
      origin: z.string(),
      destination: z.string()
    }
  },
  async ({ origin, destination }) => {
    // 1. Get route from Fleet CTA
    const route = await fleetClient.getRoute(origin, destination);

    // 2. Fetch weather for route points
    const weatherPromises = route.waypoints.map(point =>
      weatherClient.getForecast(point.lat, point.lng)
    );
    const weather = await Promise.all(weatherPromises);

    // 3. Combine and return
    return {
      route,
      weather,
      alerts: weather.filter(w => w.severity === "severe")
    };
  }
);
```

**Benefits**:
- Single tool call for complex workflows
- Better error handling and retry logic
- Can optimize based on combined data

---

## Workflow Examples

### Scenario 1: Weather-Aware Route Planning

```
User: "Plan a route from Seattle to Portland considering weather"

LLM Tool Calls:
1. fleet_list_vehicles() → Find available vehicles
2. fetch(weather_url) → Get weather forecast
3. fleet_optimize_route() → Calculate best route avoiding storms
4. fleet_get_fuel_efficiency() → Estimate fuel needs
5. fetch(fuel_prices_url) → Find cheapest fuel stops
```

### Scenario 2: Multi-Timezone Driver Scheduling

```
User: "Schedule driver shifts for our national fleet"

LLM Tool Calls:
1. fleet_list_drivers() → Get all drivers
2. time_get_timezones() → Identify driver time zones
3. fleet_get_driver_schedule() → Check current schedules
4. time_convert() → Coordinate across zones
5. fleet_get_compliance_status() → Ensure HOS compliance
```

### Scenario 3: Cost-Optimized Dispatching

```
User: "Dispatch vehicles considering fuel prices and traffic"

LLM Tool Calls:
1. fleet_get_fleet_stats() → Current fleet status
2. fetch(traffic_data) → Real-time traffic conditions
3. fetch(fuel_prices) → Regional fuel costs
4. alphavantage(diesel_prices) → Commodity price trends
5. fleet_optimize_route() → Cost-optimized routing
```

---

## Best Practices

### 1. Error Handling

Always handle failures gracefully when external services are unavailable:

```typescript
try {
  const weather = await fetchWeather(location);
  return { ...route, weather };
} catch (error) {
  logger.warn("Weather data unavailable, proceeding without it");
  return { ...route, weather: null, warning: "Weather data unavailable" };
}
```

### 2. Caching

Cache external data to reduce API calls and improve performance:

```typescript
const weatherCache = new Map<string, WeatherData>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCachedWeather(location: string): WeatherData | null {
  const cached = weatherCache.get(location);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

### 3. Rate Limiting

Respect external API rate limits:

```typescript
import Bottleneck from "bottleneck";

const weatherLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000 // 1 request per second
});

const getWeather = weatherLimiter.wrap(async (location: string) => {
  return await weatherClient.forecast(location);
});
```

### 4. Fallback Strategies

Provide alternatives when primary services fail:

```typescript
async function getLocationData(address: string) {
  // Try primary geocoding service
  try {
    return await baiduMap.geocode(address);
  } catch (error) {
    // Fallback to fetch + OpenStreetMap
    return await fetch_tool({
      url: `https://nominatim.openstreetmap.org/search?q=${address}&format=json`
    });
  }
}
```

---

## Security Considerations

### API Keys

Store API keys securely:

```bash
# .env file (NEVER commit to git)
WEATHER_API_KEY=your_key_here
MAPS_API_KEY=your_key_here
ALPHAVANTAGE_KEY=your_key_here
```

### Data Privacy

Be cautious with external services:
- Review their data privacy policies
- Understand data retention
- Consider GDPR/CCPA compliance
- Don't send sensitive fleet data unnecessarily

### Network Security

- Use HTTPS for all external calls
- Validate SSL certificates
- Implement request signing where available
- Monitor for unusual traffic patterns

---

## Testing External Integrations

### Unit Tests

```typescript
describe("Weather Integration", () => {
  it("should handle weather API failures gracefully", async () => {
    // Mock weather service failure
    jest.spyOn(weatherClient, "forecast").mockRejectedValue(new Error("API down"));

    const result = await routeWithWeather("Seattle", "Portland");
    expect(result.weather).toBeNull();
    expect(result.warning).toBeDefined();
  });
});
```

### Integration Tests

```bash
# Test with real external services
npm run test:integration

# Test with mocks
npm run test:unit
```

---

## Monitoring and Observability

Track external service health:

```typescript
import { Counter, Histogram } from "prom-client";

const externalCallsTotal = new Counter({
  name: "fleet_mcp_external_calls_total",
  help: "Total external MCP server calls",
  labelNames: ["server", "tool", "status"]
});

const externalCallDuration = new Histogram({
  name: "fleet_mcp_external_call_duration_seconds",
  help: "External call duration",
  labelNames: ["server", "tool"]
});

// Use in tool implementations
const timer = externalCallDuration.startTimer({ server: "weather", tool: "forecast" });
try {
  const result = await weatherClient.forecast(location);
  externalCallsTotal.inc({ server: "weather", tool: "forecast", status: "success" });
  return result;
} catch (error) {
  externalCallsTotal.inc({ server: "weather", tool: "forecast", status: "error" });
  throw error;
} finally {
  timer();
}
```

---

## Future Enhancements

### Planned Integrations

1. **Real-time Traffic APIs**
   - Google Maps Traffic API
   - HERE Traffic API
   - TomTom Traffic API

2. **ELD (Electronic Logging Device) Integration**
   - Connect directly to telematics providers
   - Real-time HOS tracking
   - FMCSA compliance automation

3. **Fuel Card APIs**
   - WEX, Fleet One integration
   - Automated expense tracking
   - Fuel theft detection

4. **Maintenance Service APIs**
   - Schedule maintenance at partner shops
   - Get service quotes
   - Track repair status

---

## Support and Resources

- **MCP Registry**: https://github.com/modelcontextprotocol/servers
- **Official Servers**: Check `@modelcontextprotocol` organization
- **Community Servers**: Browse MCP Registry
- **Fleet CTA Issues**: Report integration problems on GitHub

---

## Contributing

To add a new external integration:

1. Document the use case
2. Create example code
3. Add tests
4. Update this guide
5. Submit PR with integration details


# Free ArcGIS Services for Fleet Management

This document catalogs publicly accessible ArcGIS REST API services that can be integrated into the Fleet Management system using the ArcGIS Integration UI.

## Integration Instructions

All services listed below can be added through the UI at:
**Settings > Integrations > ArcGIS Integration**

Simply copy the service URL and paste it into the "Add Layer" form. The system will automatically detect the service type and available fields.

---

## Traffic Camera Services

### 1. California Department of Transportation (Caltrans)
**Service URL**: `https://services.arcgis.com/Zs2aNLFN00jrS4gG/arcgis/rest/services/Transportation_ESF_1/FeatureServer/9`

**Type**: FeatureServer
**Coverage**: California statewide
**Provider**: Caltrans
**Use Cases**:
- Real-time traffic monitoring
- Route planning for California operations
- Incident detection

**Key Fields**:
- Camera location and direction
- Status information
- Image URLs

---

### 2. Washington State Department of Transportation (WSDOT)
**Service URL**: `https://www.wsdot.wa.gov/arcgis/rest/services/Production/WSDOTTrafficCameras/MapServer`

**Type**: MapServer
**Coverage**: Washington State
**Provider**: WSDOT
**Use Cases**:
- Weather condition monitoring (especially important for mountain passes)
- Traffic flow analysis
- Winter road conditions

---

### 3. Seattle Department of Transportation
**Service URL**: `https://gisdata.seattle.gov/server/rest/services/SDOT/SDOT_Assets/MapServer/9`

**Type**: MapServer (Layer 9: Traffic Cameras)
**Coverage**: Seattle, WA metro area
**Provider**: Seattle DOT
**Use Cases**:
- Urban traffic monitoring
- Downtown Seattle operations
- Event impact assessment

---

### 4. King County Traffic Cameras
**Service URL**: `https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Traffic_Cameras/MapServer`

**Type**: MapServer
**Coverage**: King County, WA (including Seattle suburbs)
**Provider**: King County GIS
**Use Cases**:
- Regional traffic monitoring
- Suburban route planning
- County-wide operations

---

### 5. Georgia Department of Transportation
**Service URL**: `http://gis10.dot.ga.gov/ArcGIS/rest/services/ExtractAndEmail/MapServer/6`

**Type**: MapServer (Layer 6)
**Coverage**: Georgia statewide
**Provider**: Georgia DOT
**Note**: HTTP only (not HTTPS)
**Use Cases**:
- Georgia operations monitoring
- I-75 corridor tracking
- Atlanta metro area traffic

---

### 6. Minnesota Department of Transportation
**Service URL**: `https://gis2.co.dakota.mn.us/arcgis/rest/services/DCGIS_OL_Transportation/MapServer/12`

**Type**: MapServer (Layer 12)
**Coverage**: Dakota County, MN
**Provider**: Dakota County GIS
**Use Cases**:
- Minnesota operations
- Twin Cities metro traffic
- Winter weather monitoring

---

### 7. City of Redmond Traffic Cameras
**Service URL**: `https://gis.redmond.gov/arcgis/rest/services/Traffic/Cameras/MapServer`

**Type**: MapServer
**Coverage**: Redmond, WA
**Provider**: City of Redmond
**Use Cases**:
- Local traffic monitoring
- Microsoft campus area traffic
- Small-scale urban operations

---

### 8. Nottingham City Council CCTV Cameras (UK)
**Service URL**: `https://services.arcgis.com/yvqphKcf9bBSnjX1/arcgis/rest/services/CCTV_Cameras/FeatureServer/83`

**Type**: FeatureServer (Layer 83)
**Coverage**: Nottingham, UK
**Provider**: Nottingham City Council
**Use Cases**:
- UK operations
- City center monitoring
- Public safety integration

---

## EV Charging Infrastructure

### 1. NEVI EV Charging Stations (December 2024)
**Service URL**: `https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/NEVI_EV_Charging_Stations_December162024/FeatureServer/0`

**Type**: FeatureServer
**Coverage**: United States (National Electric Vehicle Infrastructure program)
**Provider**: Federal Highway Administration
**Update Frequency**: Monthly
**Use Cases**:
- EV fleet route planning
- Charging station availability
- Infrastructure gap analysis
- Federal NEVI program compliance

**Key Fields**:
- Station name and address
- Charger types (Level 2, DC Fast Charging)
- Number of ports
- Network operator
- Access hours
- Pricing information

---

## Additional Useful Services

### Weather Services
Multiple weather radar and forecast layers are available through NOAA and weather.gov ArcGIS services. Search for:
- `weather.gov/arcgis/rest/services`
- Real-time radar
- Storm warnings
- Road weather conditions

### Road Conditions
Many state DOTs provide real-time road condition layers:
- Construction zones
- Road closures
- Bridge weight limits
- Winter road conditions

### Emergency Services
- Fire station locations
- Hospital coverage areas
- Emergency response zones
- Evacuation routes

### Public Transit
- Bus stops and routes
- Transit stations
- Park and ride facilities
- Real-time vehicle locations

---

## Best Practices for Integration

### 1. Layer Naming Convention
When adding these services, use consistent naming:
- `Traffic - [Provider] - [Region]`
- Example: `Traffic - Caltrans - California`
- Example: `EV Charging - NEVI - National`

### 2. Refresh Intervals
Recommended sync intervals by service type:
- **Traffic Cameras**: 15-30 minutes (traffic conditions change frequently)
- **EV Charging Stations**: 24 hours (infrastructure changes slowly)
- **Weather**: 5-15 minutes (for active monitoring)
- **Road Conditions**: 30-60 minutes

### 3. Layer Organization
Group related layers together:
1. **Traffic Monitoring**
   - All camera services
   - Road condition services
2. **Infrastructure**
   - EV charging stations
   - Maintenance facilities
3. **Emergency Response**
   - Emergency services
   - Weather alerts

### 4. Performance Optimization
- Enable only the layers needed for your operational area
- Use appropriate zoom level restrictions (min/max zoom)
- Set reasonable opacity levels for overlapping layers
- Consider caching strategies for static data

### 5. Service Validation
Before adding a service to production:
1. Test the service URL in the ArcGIS Integration UI
2. Verify field mappings are correct
3. Check data quality and completeness
4. Confirm refresh intervals work as expected
5. Test with a small pilot group first

---

## Service Discovery Resources

### Finding More Services
1. **ArcGIS Online Open Data**: `https://hub.arcgis.com/`
2. **State/Local Government Open Data Portals**:
   - Search for "[State/City] open data portal"
   - Look for transportation or public works sections
3. **Federal Agencies**:
   - NOAA Weather Services
   - USGS Geographic Services
   - Census Bureau TIGER Services

### Service Type Guide
- **FeatureServer**: Best for point data (cameras, stations, facilities)
- **MapServer**: Good for both point and polygon data
- **ImageServer**: Used for raster data (weather radar, imagery)
- **WMS**: Web Map Service (compatible with ArcGIS Integration)

---

## Regional Coverage Summary

### Strong Coverage Areas
- **Pacific Northwest**: Seattle/Washington State (3 services)
- **California**: Statewide coverage (Caltrans)
- **Georgia**: Statewide coverage
- **National**: EV charging infrastructure

### Limited Coverage Areas
- **Midwest**: Limited to Dakota County, MN
- **Northeast**: No free services identified yet
- **Southeast**: Limited to Georgia

### International
- **UK**: Nottingham CCTV cameras (proof of concept for international expansion)

---

## Security and Privacy

### Public Data Notice
All services listed here are:
- Publicly accessible
- No authentication required
- Published by government agencies
- Intended for public use

### Data Usage Guidelines
- Do not attempt to access restricted services
- Respect rate limits and terms of service
- Cache data appropriately to minimize API calls
- Do not redistribute raw data without proper attribution

### Attribution Requirements
When displaying data from these services:
- Include provider attribution
- Link to original data source when possible
- Follow any specific attribution requirements in service metadata

---

## Support and Maintenance

### Service Availability
- Government services may have maintenance windows
- Services may be temporarily unavailable during updates
- Monitor service health through the ArcGIS Integration UI

### Reporting Issues
If a service becomes unavailable or has data quality issues:
1. Check the service URL directly in a browser
2. Review service metadata for maintenance notifications
3. Contact the service provider if issues persist
4. Disable the layer temporarily if needed

### Version Updates
This document was last updated: **November 10, 2025**

New services are continually being published. Check back regularly for updates, or search the resources listed in the "Service Discovery Resources" section.

---

## Quick Start Guide

### Adding Your First Service

1. **Navigate to ArcGIS Integration**:
   - Log in to Fleet Management system
   - Go to Settings > Integrations > ArcGIS Integration

2. **Choose a Service**:
   - Start with NEVI EV Charging Stations (national coverage)
   - Or choose a traffic camera service for your region

3. **Add the Layer**:
   - Click "Add Layer"
   - Paste the service URL
   - Enter a descriptive name
   - Click "Test Connection"
   - Review field mappings
   - Set refresh interval
   - Save

4. **View on Map**:
   - Navigate to Fleet Map view
   - Toggle the new layer on/off
   - Adjust opacity if needed
   - Zoom to see data points

5. **Refine Configuration**:
   - Adjust zoom levels if data is too dense/sparse
   - Modify refresh interval based on your needs
   - Customize styling if available

---

## Future Enhancements

### Planned Service Additions
- More state DOT traffic cameras
- National bridge inspection data
- Truck parking availability
- Weigh station information
- Rest area locations

### Integration Improvements
- Service health monitoring
- Automatic service discovery
- Data caching for offline use
- Custom alerting based on layer data
- Integration with work order system

---

## Questions or Contributions

Have you found additional free services that would be useful? Contact your system administrator to have them added to this document.

**Last Updated**: November 10, 2025
**Maintained By**: Fleet Management Development Team
**Version**: 1.0

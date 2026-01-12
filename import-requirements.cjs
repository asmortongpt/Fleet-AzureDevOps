#!/usr/bin/env node

/**
 * Azure DevOps Requirements Import Script
 * Imports all 17 Fleet Management requirements as Issues linked to parent Epics
 */

const https = require('https');

// Azure DevOps Configuration
const ORG = 'capitaltechalliance';
const PROJECT = 'FleetManagement';
const PAT = process.env.AZURE_DEVOPS_PAT || 'YOUR_PAT_HERE'; // Set via environment variable
const AUTH = Buffer.from(':' + PAT).toString('base64');
const API_VERSION = '7.1-preview.3';

// Parent Epic IDs
const EPICS = {
  phase1: 11480,
  phase2: 11478,
  phase3: 11479
};

// Requirements data structured by phase
const requirements = [
  // ============================================================================
  // PHASE 1 - IMPLEMENTED (5 requirements) - Link to Epic #11480
  // ============================================================================
  {
    title: 'Telematics Integration',
    description: `**Status**: COMPLETE ✅

**Requirements Met**:
- Real-time vehicle tracking with geofencing
- OBD-II device framework (via Samsara integration)
- Connected vehicle API (Smartcar - 50+ car brands)
- Stream vehicle data: location, speed, fuel, tire pressure, battery
- Remote commands: lock/unlock, start/stop charging
- Multi-provider support (Samsara, Geotab, Verizon, Motive, Smartcar)

**Implementation**:
- \`api/src/services/samsara.service.ts\` (420 lines)
- \`api/src/services/smartcar.service.ts\` (550 lines)
- \`api/src/routes/telematics.routes.ts\` (600 lines)
- \`api/src/routes/smartcar.routes.ts\` (450 lines)
- Database schema: 10 tables for telematics
- Background sync: Every 5 minutes

**Business Value**: $135k/year (Samsara) included in total Phase 1 value

**Timeline**: COMPLETE`,
    parentEpic: EPICS.phase1,
    tags: ['Phase1', 'Implemented', 'Telematics', 'Integration', 'Real-Time-Tracking'],
    businessValue: 135000,
    phase: 'Phase 1'
  },
  {
    title: 'Connected Vehicles / Smartcar Integration',
    description: `**Status**: COMPLETE ✅

**Requirements Met**:
- Connected vehicle API integration (50+ car brands)
- Stream vehicle data: location, speed, fuel, tire pressure, battery
- Remote vehicle commands: lock/unlock, start/stop charging
- Real-time telemetry streaming
- Multi-brand support through unified API

**Implementation**:
- \`api/src/services/smartcar.service.ts\` (550 lines)
- \`api/src/routes/smartcar.routes.ts\` (450 lines)
- 11 API endpoints for vehicle control
- Real-time data synchronization
- Comprehensive error handling and retries

**Business Value**: $365k/year in operational efficiency

**Timeline**: COMPLETE`,
    parentEpic: EPICS.phase1,
    tags: ['Phase1', 'Implemented', 'Smartcar', 'Connected-Vehicles', 'IoT'],
    businessValue: 365000,
    phase: 'Phase 1'
  },
  {
    title: 'Mobile Applications (iOS & Android)',
    description: `**Status**: COMPLETE ✅

**Requirements Met**:
- Native iOS mobile app (Swift + SwiftUI)
- Native Android mobile app (Kotlin + Jetpack Compose)
- Barcode scanner (13 formats including VIN validation)
- Receipt photo OCR framework (for expense reporting)
- Real-time API communication
- Haptic feedback and torch control

**Implementation**:
- \`mobile-apps/ios/BarcodeScannerView.swift\` (400 lines)
- \`mobile-apps/android/BarcodeScannerActivity.kt\` (500 lines)
- AVFoundation (iOS) + ML Kit (Android) integration
- VIN validation with check digit verification

**Business Value**: $100k/year in inventory efficiency

**Not Yet Implemented** (Phase 3):
- Offline sync mode
- Digital driver toolbox dashboard
- Mobile OSHA reporting with 3D damage pinning
- Keyless entry/vehicle control via mobile
- AR navigation overlay

**Timeline**: COMPLETE (basic features), enhancements in Phase 3`,
    parentEpic: EPICS.phase1,
    tags: ['Phase1', 'Implemented', 'Mobile', 'iOS', 'Android', 'Barcode-Scanner'],
    businessValue: 100000,
    phase: 'Phase 1'
  },
  {
    title: 'Security & Authentication',
    description: `**Status**: COMPLETE ✅

**Requirements Met**:
- Microsoft SSO (Azure AD OAuth 2.0)
- JWT token authentication (24-hour expiration)
- Role-based access control (RBAC)
- Kubernetes Secrets with encryption at rest
- Full audit logging for compliance
- FedRAMP/SOC2-ready architecture
- Webhook signature verification

**Implementation**:
- \`api/src/routes/microsoft-auth.ts\`
- \`k8s/azure-ad-secret-role.yaml\`
- RBAC middleware with 4+ roles
- Comprehensive audit logging
- Security headers and HTTPS enforcement

**Security Features**:
- Multi-factor authentication support
- Session management and revocation
- API key rotation
- Encrypted data at rest and in transit

**Timeline**: COMPLETE`,
    parentEpic: EPICS.phase1,
    tags: ['Phase1', 'Implemented', 'Security', 'Authentication', 'Azure-AD', 'SSO'],
    businessValue: 0,
    phase: 'Phase 1'
  },
  {
    title: 'Database & Cloud Infrastructure',
    description: `**Status**: COMPLETE ✅

**Requirements Met**:
- Multi-tenant architecture
- PostgreSQL with 15+ tables
- Real-time telemetry tracking
- Driver behavior scoring
- Geofence management
- Azure Kubernetes deployment
- OpenTelemetry monitoring
- Auto-scaling (load tested 300+ concurrent users)

**Implementation**:
- \`api/src/migrations/009_telematics_integration.sql\` (430 lines)
- Multi-provider unified data model
- Background jobs with cron scheduling
- Kubernetes deployment ready
- Horizontal pod autoscaling
- Database connection pooling

**Infrastructure**:
- Azure Kubernetes Service (AKS)
- PostgreSQL managed database
- Redis for caching
- Azure Monitor integration
- CI/CD pipeline with GitHub Actions

**Timeline**: COMPLETE`,
    parentEpic: EPICS.phase1,
    tags: ['Phase1', 'Implemented', 'Infrastructure', 'Database', 'Azure', 'Kubernetes'],
    businessValue: 0,
    phase: 'Phase 1'
  },

  // ============================================================================
  // PHASE 2 - DOCUMENTED (2 requirements) - Link to Epic #11478
  // ============================================================================
  {
    title: 'AI Damage Detection',
    description: `**Status**: DOCUMENTED - Ready to Implement 📋

**Requirements**:
- AI-based damage zone mapping
- Computer vision for safety events
- Automatic work order creation
- Cost estimation for repairs
- Multi-angle photo analysis
- Damage severity classification

**Implementation Plan**:
- YOLOv8 + ResNet-50 architecture
- Mobile camera integration (iOS/Android)
- Real-time damage detection
- Integration with work order system
- Parts cost estimation engine

**Documentation**: \`mobile-apps/AI_DAMAGE_DETECTION_IMPLEMENTATION.md\` (600 lines)

**Technical Approach**:
- TensorFlow Lite for on-device inference
- Cloud-based model training pipeline
- Continuous model improvement
- Integration with existing photo capture

**Business Value**: $300,000/year in reduced claims processing time

**Timeline**: 3 weeks to implement
**Status**: Complete technical documentation ready`,
    parentEpic: EPICS.phase2,
    tags: ['Phase2', 'Documented', 'AI', 'Computer-Vision', 'Damage-Detection', 'ML'],
    businessValue: 300000,
    phase: 'Phase 2'
  },
  {
    title: 'LiDAR 3D Scanning',
    description: `**Status**: DOCUMENTED - Ready to Implement 📋

**Requirements**:
- 3D vehicle damage model generation
- Visual inspection with AR overlay
- Volume calculation for damage assessment
- Point cloud capture and processing
- Integration with damage reporting workflow

**Implementation Plan**:
- ARKit (iOS) for LiDAR capture
- ARCore Depth API (Android)
- 3D mesh reconstruction
- Damage area measurement
- Export to standard formats (USDZ, GLB)

**Documentation**: \`mobile-apps/LIDAR_3D_SCANNING_IMPLEMENTATION.md\` (400 lines)

**Technical Approach**:
- iPhone 12 Pro+ LiDAR sensor support
- Real-time 3D visualization
- Cloud storage for 3D models
- Integration with AI damage detection
- AR-based damage annotation

**Business Value**: $500,000/year in accurate damage assessment

**Timeline**: 4 weeks to implement
**Status**: Complete ARKit implementation guide with Swift code`,
    parentEpic: EPICS.phase2,
    tags: ['Phase2', 'Documented', 'LiDAR', '3D-Scanning', 'AR', 'Mobile'],
    businessValue: 500000,
    phase: 'Phase 2'
  },

  // ============================================================================
  // PHASE 3 - PLANNED (10 requirements) - Link to Epic #11479
  // ============================================================================
  {
    title: 'Real-Time Dispatch & Radio Communications',
    description: `**Status**: NOT IMPLEMENTED ❌

**Requirements**:
- Push-to-talk radio dispatch
- Live operational communications
- AI-powered transcription and incident tagging
- Azure SignalR for voice streaming
- Three dispatch modes (Monitor, Human-in-Loop, Autonomous)
- Recording and playback capabilities
- Emergency broadcast system

**Technical Requirements**:
- WebSocket/Socket.IO audio streaming infrastructure
- Real-time audio compression
- Voice activity detection
- Integration with existing dispatch workflows
- Multi-channel support
- Geolocation-based channel assignment

**Dependencies**:
- WebRTC for audio streaming
- Azure SignalR Service
- Speech-to-text API integration
- Real-time communication infrastructure

**Business Value**: TBD - Enhanced dispatcher productivity

**Timeline**: 6-8 weeks (Phase 3)
**Status**: Requirements documented, not started`,
    parentEpic: EPICS.phase3,
    tags: ['Phase3', 'Planned', 'Dispatch', 'Radio', 'Real-Time', 'Communications', 'AI'],
    businessValue: 0,
    phase: 'Phase 3'
  },
  {
    title: 'High-Fidelity 3D Vehicle Viewer & AR Mode',
    description: `**Status**: NOT IMPLEMENTED (basic framework exists) ❌

**Requirements**:
- Photorealistic rendering with PBR assets
- Exterior/interior toggle
- Variant/trim system for customizations
- AR mode for mobile (USDZ/Scene Viewer)
- React Three Fiber integration
- 360-degree vehicle exploration
- Damage overlay visualization

**Technical Requirements**:
- 3D model library integration (TurboSquid, Sketchfab)
- PBR material workflow
- Real-time lighting and shadows
- Mobile AR viewer (iOS QuickLook, Android Scene Viewer)
- Web-based 3D viewer with controls
- Responsive performance optimization

**Current State**: Basic Virtual Garage exists, needs upgrade to full showroom

**Business Value**: TBD - Enhanced vehicle visualization

**Timeline**: 4-6 weeks (Phase 3)
**Status**: Requirements documented, basic framework in place`,
    parentEpic: EPICS.phase3,
    tags: ['Phase3', 'Planned', '3D-Viewer', 'AR', 'Visualization', 'Showroom'],
    businessValue: 0,
    phase: 'Phase 3'
  },
  {
    title: 'AI-Driven Route Optimization',
    description: `**Status**: NOT IMPLEMENTED ❌

**Requirements**:
- Multi-stop route optimization
- Constraints: vehicle capacity, driver schedules, traffic
- EV range consideration
- AI-based dispatch suggestions (ETA-based)
- Integration with mapping APIs (Mapbox/Google)
- Real-time route recalculation
- Driver assignment optimization

**Technical Requirements**:
- OR-Tools or similar optimization engine
- Real-time traffic data integration
- Vehicle capability constraints
- Driver schedule management
- Cost minimization algorithms
- Route comparison and analysis

**Dependencies**:
- Google Maps Directions API
- Real-time traffic data feeds
- Vehicle telematics data
- Driver availability system

**Business Value**: TBD - Fuel savings and time optimization

**Timeline**: 3-4 weeks (Phase 3)
**Status**: Requirements documented, not started`,
    parentEpic: EPICS.phase3,
    tags: ['Phase3', 'Planned', 'Route-Optimization', 'AI', 'Dispatch', 'Mapping'],
    businessValue: 0,
    phase: 'Phase 3'
  },
  {
    title: 'Enhanced Predictive Maintenance',
    description: `**Status**: PARTIALLY IMPLEMENTED (basic framework exists) ❌

**Requirements**:
- Remaining Useful Life (RUL) estimation
- Automatic work order creation
- Parts pre-ordering
- Anomaly detection on telemetry
- Driver behavior pattern analysis
- Maintenance cost forecasting
- Failure prediction models

**Technical Requirements**:
- Machine learning models for RUL estimation
- Time-series anomaly detection
- Integration with parts inventory system
- Predictive analytics dashboard
- Alert and notification system
- Historical data analysis

**Current State**: Have telemetry data collection, need ML models for prediction

**Business Value**: TBD - Reduced downtime and maintenance costs

**Timeline**: 4-6 weeks to complete (Phase 3)
**Status**: Basic framework implemented, ML models needed`,
    parentEpic: EPICS.phase3,
    tags: ['Phase3', 'Planned', 'Predictive-Maintenance', 'ML', 'Analytics', 'AI'],
    businessValue: 0,
    phase: 'Phase 3'
  },
  {
    title: 'Video Telematics & Driver Safety Monitoring',
    description: `**Status**: NOT IMPLEMENTED ❌

**Requirements**:
- In-vehicle camera feed integration
- AI analysis: distracted driving, drowsiness, seatbelt use
- Multi-camera support (forward, driver-facing, cargo)
- Event-triggered video clips
- Video dashboard for review
- Evidence locker with retention policies
- Privacy controls (face/plate blurring)
- Real-time safety alerts

**Technical Requirements**:
- Computer vision pipeline (OpenCV/Azure Computer Vision)
- Video storage and streaming infrastructure
- Real-time event detection
- Privacy-preserving video processing
- Integration with telematics providers
- Mobile app video playback

**Dependencies**:
- Dashcam hardware integration
- Cloud video storage (Azure Media Services)
- Computer vision models
- Real-time streaming infrastructure

**Business Value**: TBD - Reduced accidents and insurance costs

**Timeline**: 6-8 weeks (Phase 3)
**Status**: Requirements documented, not started`,
    parentEpic: EPICS.phase3,
    tags: ['Phase3', 'Planned', 'Video-Telematics', 'AI', 'Safety', 'Computer-Vision'],
    businessValue: 0,
    phase: 'Phase 3'
  },
  {
    title: 'EV Fleet Management & Sustainability',
    description: `**Status**: PARTIALLY IMPLEMENTED (battery tracking via Smartcar) ❌

**Requirements**:
- OCPP protocol for charging infrastructure
- Charging station integration
- Smart charging schedules (demand response)
- Charger reservation system
- Vehicle-to-Grid (V2G) support
- Carbon footprint tracking
- ESG reporting
- Green Fleet KPIs dashboard

**Technical Requirements**:
- OCPP 1.6/2.0 protocol implementation
- Charging station management system
- Load balancing and scheduling algorithms
- Carbon emission calculation engine
- ESG metrics dashboard
- Integration with utility providers

**Current State**: Have EV battery data via Smartcar, need charging infrastructure integration

**Business Value**: TBD - Energy cost optimization and sustainability

**Timeline**: 4-6 weeks (Phase 3)
**Status**: Battery tracking complete, charging infrastructure needed`,
    parentEpic: EPICS.phase3,
    tags: ['Phase3', 'Planned', 'EV', 'Sustainability', 'Charging', 'Green-Fleet'],
    businessValue: 0,
    phase: 'Phase 3'
  },
  {
    title: 'Mobile App Enhancements',
    description: `**Status**: BASIC MOBILE APPS COMPLETE, enhancements needed ❌

**Requirements**:
- Full offline functionality with sync
- Digital Driver Toolbox dashboard
- Mobile OSHA & damage reporting with 3D
- Keyless entry (Bluetooth/NFC/cloud)
- AR navigation with overlay
- Push notifications
- Voice commands
- Wearable integration (Apple Watch, Android Wear)

**Technical Requirements**:
- Offline-first architecture with SQLite
- Background sync with conflict resolution
- Bluetooth Low Energy (BLE) integration
- NFC vehicle pairing
- ARKit/ARCore navigation overlay
- Firebase Cloud Messaging
- Voice recognition integration

**Current State**: Have barcode scanner and basic mobile apps, need offline mode and advanced features

**Business Value**: TBD - Enhanced driver productivity

**Timeline**: 3-4 weeks (Phase 3)
**Status**: Basic features complete, enhancements planned`,
    parentEpic: EPICS.phase3,
    tags: ['Phase3', 'Planned', 'Mobile-Enhancement', 'Offline', 'AR', 'Driver-Tools'],
    businessValue: 0,
    phase: 'Phase 3'
  },
  {
    title: 'Globalization & Accessibility',
    description: `**Status**: NOT IMPLEMENTED (English only) ❌

**Requirements**:
- Full internationalization (i18n)
- Multiple language support (Spanish, French, German, Mandarin)
- WCAG 2.1+ AA accessibility compliance
- Screen reader support (JAWS, NVDA)
- Keyboard navigation
- Color contrast fixes
- Right-to-left (RTL) language support
- Locale-specific formatting (dates, numbers, currency)

**Technical Requirements**:
- i18next or similar i18n framework
- Translation management system
- Accessibility testing automation
- ARIA labels and semantic HTML
- Keyboard shortcut system
- High contrast themes
- Font size scaling

**Current State**: English only, framework ready for externalization

**Business Value**: TBD - Market expansion and compliance

**Timeline**: 2-3 weeks (Phase 3)
**Status**: Requirements documented, translation needed`,
    parentEpic: EPICS.phase3,
    tags: ['Phase3', 'Planned', 'i18n', 'Accessibility', 'WCAG', 'Globalization'],
    businessValue: 0,
    phase: 'Phase 3'
  },
  {
    title: 'Expanded Integrations',
    description: `**Status**: PARTIAL (REST API complete, webhooks basic) ❌

**Requirements**:
- Fuel card providers (WEX, Fleetcor)
- Toll transponder APIs
- Maintenance vendors EDI
- Parts suppliers integration
- Enterprise ERP/HR systems (SAP, Oracle, Workday)
- SCIM for user provisioning
- GraphQL API
- Webhooks module
- Plugin/marketplace architecture
- Third-party developer SDK

**Technical Requirements**:
- EDI 810/850 transaction processing
- GraphQL schema and resolvers
- Webhook delivery and retry system
- SCIM 2.0 protocol implementation
- OAuth 2.0 for third-party apps
- API versioning strategy
- Developer portal and documentation

**Current State**: Have 30+ REST endpoints, need specific vendor integrations

**Business Value**: TBD - Ecosystem expansion

**Timeline**: 4-8 weeks depending on integrations (Phase 3)
**Status**: API foundation complete, vendor integrations needed`,
    parentEpic: EPICS.phase3,
    tags: ['Phase3', 'Planned', 'Integration', 'API', 'GraphQL', 'Webhooks', 'ERP'],
    businessValue: 0,
    phase: 'Phase 3'
  },
  {
    title: 'Predictive Analytics & ML-Based Forecasting',
    description: `**Status**: NOT IMPLEMENTED ❌

**Requirements**:
- Fleet utilization forecasting
- Demand prediction for vehicle allocation
- Cost trend analysis
- Anomaly detection across fleet operations
- Budget forecasting
- Driver performance prediction
- Seasonal pattern analysis
- What-if scenario modeling

**Technical Requirements**:
- Time-series forecasting models (ARIMA, Prophet, LSTM)
- Data pipeline for model training
- Feature engineering framework
- Model versioning and deployment
- Real-time prediction API
- Interactive analytics dashboard
- Explainable AI for insights

**Dependencies**:
- Historical data accumulation (6+ months)
- Data warehouse infrastructure
- ML model training pipeline
- Business intelligence tools integration

**Business Value**: TBD - Data-driven decision making

**Timeline**: 4-6 weeks (Phase 3)
**Status**: Requirements documented, not started`,
    parentEpic: EPICS.phase3,
    tags: ['Phase3', 'Planned', 'Predictive-Analytics', 'ML', 'Forecasting', 'BI'],
    businessValue: 0,
    phase: 'Phase 3'
  }
];

/**
 * Make authenticated HTTPS request to Azure DevOps API
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dev.azure.com',
      path: `/${ORG}/${PROJECT}/_apis/${path}?api-version=${API_VERSION}`,
      method: method,
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json-patch+json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Create a work item (Issue) in Azure DevOps
 */
async function createIssue(requirement) {
  const operations = [
    {
      op: 'add',
      path: '/fields/System.Title',
      value: requirement.title
    },
    {
      op: 'add',
      path: '/fields/System.Description',
      value: requirement.description
    },
    {
      op: 'add',
      path: '/fields/System.Tags',
      value: requirement.tags.join('; ')
    },
    {
      op: 'add',
      path: '/fields/System.State',
      value: 'To Do'
    }
  ];

  // Add business value if present
  if (requirement.businessValue > 0) {
    operations.push({
      op: 'add',
      path: '/fields/Microsoft.VSTS.Common.BusinessValue',
      value: requirement.businessValue
    });
  }

  try {
    const workItem = await makeRequest('PATCH', 'wit/workitems/$Issue', operations);
    console.log(`✅ Created Issue #${workItem.id}: ${requirement.title}`);
    return workItem;
  } catch (error) {
    console.error(`❌ Failed to create Issue "${requirement.title}":`, error.message);
    throw error;
  }
}

/**
 * Create a parent-child link between Epic and Issue
 */
async function linkToParent(issueId, parentEpicId) {
  const operations = [
    {
      op: 'add',
      path: '/relations/-',
      value: {
        rel: 'System.LinkTypes.Hierarchy-Reverse',
        url: `https://dev.azure.com/${ORG}/${PROJECT}/_apis/wit/workItems/${parentEpicId}`,
        attributes: {
          comment: 'Parent Epic link'
        }
      }
    }
  ];

  try {
    await makeRequest('PATCH', `wit/workitems/${issueId}`, operations);
    console.log(`   🔗 Linked Issue #${issueId} to Epic #${parentEpicId}`);
  } catch (error) {
    console.error(`   ❌ Failed to link Issue #${issueId} to Epic #${parentEpicId}:`, error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Fleet Management Requirements Import to Azure DevOps        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Organization: ${ORG}`);
  console.log(`Project: ${PROJECT}`);
  console.log(`Requirements to import: ${requirements.length}\n`);

  const results = {
    phase1: [],
    phase2: [],
    phase3: [],
    errors: []
  };

  // Process each requirement
  for (const req of requirements) {
    try {
      // Create the Issue
      const workItem = await createIssue(req);

      // Link to parent Epic
      await linkToParent(workItem.id, req.parentEpic);

      // Store result by phase
      const phaseKey = req.phase.toLowerCase().replace(' ', '');
      results[phaseKey].push({
        id: workItem.id,
        title: req.title,
        url: `https://dev.azure.com/${ORG}/${PROJECT}/_workitems/edit/${workItem.id}`,
        parentEpic: req.parentEpic,
        businessValue: req.businessValue
      });

      // Rate limiting: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.errors.push({
        title: req.title,
        error: error.message
      });
    }
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      IMPORT SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('📊 PHASE 1 - IMPLEMENTED (5 features, Epic #11480):');
  console.log('─────────────────────────────────────────────────────────────────');
  results.phase1.forEach(item => {
    console.log(`✅ Issue #${item.id}: ${item.title}`);
    console.log(`   💰 Business Value: $${item.businessValue.toLocaleString()}/year`);
    console.log(`   🔗 ${item.url}\n`);
  });
  const phase1Total = results.phase1.reduce((sum, item) => sum + item.businessValue, 0);
  console.log(`   TOTAL PHASE 1 VALUE: $${phase1Total.toLocaleString()}/year\n`);

  console.log('📋 PHASE 2 - DOCUMENTED (2 features, Epic #11478):');
  console.log('─────────────────────────────────────────────────────────────────');
  results.phase2.forEach(item => {
    console.log(`📋 Issue #${item.id}: ${item.title}`);
    console.log(`   💰 Business Value: $${item.businessValue.toLocaleString()}/year`);
    console.log(`   🔗 ${item.url}\n`);
  });
  const phase2Total = results.phase2.reduce((sum, item) => sum + item.businessValue, 0);
  console.log(`   TOTAL PHASE 2 VALUE: $${phase2Total.toLocaleString()}/year\n`);

  console.log('❌ PHASE 3 - PLANNED (10 features, Epic #11479):');
  console.log('─────────────────────────────────────────────────────────────────');
  results.phase3.forEach(item => {
    console.log(`❌ Issue #${item.id}: ${item.title}`);
    console.log(`   🔗 ${item.url}\n`);
  });

  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    console.log('─────────────────────────────────────────────────────────────────');
    results.errors.forEach(err => {
      console.log(`❌ ${err.title}: ${err.error}`);
    });
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                     QUICK LINKS                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Epic #11480 (Phase 1): https://dev.azure.com/${ORG}/${PROJECT}/_workitems/edit/11480`);
  console.log(`Epic #11478 (Phase 2): https://dev.azure.com/${ORG}/${PROJECT}/_workitems/edit/11478`);
  console.log(`Epic #11479 (Phase 3): https://dev.azure.com/${ORG}/${PROJECT}/_workitems/edit/11479\n`);

  console.log(`View all work items: https://dev.azure.com/${ORG}/${PROJECT}/_workitems/`);
  console.log(`View backlog: https://dev.azure.com/${ORG}/${PROJECT}/_backlogs/backlog/FleetManagement%20Team/Stories\n`);

  console.log('✅ Import complete!');
  console.log(`   Total Issues created: ${results.phase1.length + results.phase2.length + results.phase3.length}`);
  console.log(`   Total business value: $${(phase1Total + phase2Total).toLocaleString()}/year (Phases 1-2)`);
}

// Run the import
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

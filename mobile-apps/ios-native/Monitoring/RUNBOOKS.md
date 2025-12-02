# Fleet Manager iOS - Incident Response Runbooks

This document contains comprehensive incident response runbooks for the Fleet Manager iOS mobile application. Each runbook provides step-by-step diagnostic and resolution procedures.

## Table of Contents

1. [High Crash Rate](#1-high-crash-rate)
2. [High API Error Rate](#2-high-api-error-rate)
3. [Authentication Failure](#3-authentication-failure)
4. [Service Outage](#4-service-outage)
5. [Database Connection Failure](#5-database-connection-failure)
6. [Severe Memory Leak](#6-severe-memory-leak)
7. [Slow API Response](#7-slow-api-response)
8. [High Memory Usage](#8-high-memory-usage)
9. [High Sync Queue](#9-high-sync-queue)
10. [GPS Accuracy Degradation](#10-gps-accuracy-degradation)
11. [High Battery Drain](#11-high-battery-drain)
12. [OBD2 Connection Issues](#12-obd2-connection-issues)
13. [Elevated Error Rate](#13-elevated-error-rate)
14. [Slow App Launch](#14-slow-app-launch)
15. [Network Timeout](#15-network-timeout)
16. [Data Sync Failures](#16-data-sync-failures)
17. [Push Notification Failures](#17-push-notification-failures)
18. [Storage Space Issues](#18-storage-space-issues)

---

## 1. High Crash Rate

**Alert:** App crash rate exceeds 1%

**Severity:** Critical

**Impact:** Users experiencing app crashes, potential data loss, poor user experience

### Diagnostic Steps

1. **Identify Affected Versions**
   ```bash
   # Query crash metrics by version
   curl -X GET "https://api.fleet.com/metrics/crashes?groupBy=version&timeRange=1h"
   ```
   - Check if crashes are isolated to specific app version
   - Identify iOS versions affected

2. **Analyze Crash Reports**
   ```bash
   # Access Firebase Crashlytics dashboard
   open https://console.firebase.google.com/project/fleet-ios/crashlytics
   ```
   - Review crash stack traces
   - Identify common crash patterns
   - Check for new crashes vs existing issues

3. **Check Crash Categories**
   - Memory crashes (EXC_BAD_ACCESS)
   - Force unwrapping nil optionals
   - Array out of bounds
   - Network-related crashes
   - Threading issues

4. **Correlate with Recent Changes**
   ```bash
   # Check recent deployments
   git log --oneline --since="24 hours ago"
   ```
   - Review recent code changes
   - Check if crashes started after deployment

### Resolution Steps

**Immediate Actions:**

1. **Assess Rollback Need**
   - If crash rate > 5%: **Immediate rollback required**
   - If crash rate 1-5%: **Prepare hotfix**
   - Document decision in incident channel

2. **Enable Kill Switch (if available)**
   ```swift
   // Disable problematic feature via Remote Config
   firebase.remoteConfig.setValue("false", forKey: "enable_problematic_feature")
   ```

3. **Communicate with Users**
   - Post status update on status page
   - Prepare support team with FAQs
   - Consider in-app notification if affecting many users

**Short-term Fix:**

1. **Prepare Hotfix**
   ```bash
   # Create hotfix branch
   git checkout -b hotfix/crash-fix-v1.2.3

   # Apply fix
   # ... make code changes ...

   # Build and test
   fastlane test

   # Submit for emergency review
   fastlane ios emergency_release
   ```

2. **Test Thoroughly**
   - Reproduce crash locally
   - Verify fix resolves issue
   - Test on multiple iOS versions
   - Run full regression suite

3. **Monitor Post-Fix**
   - Watch crash rate for 2 hours post-deployment
   - Compare crash rates before/after
   - Monitor user feedback

**Long-term Fix:**

1. **Root Cause Analysis**
   - Document crash cause
   - Identify similar patterns in codebase
   - Update coding guidelines if needed

2. **Prevent Recurrence**
   - Add unit tests for crash scenario
   - Implement defensive programming
   - Add logging around crash-prone areas
   - Consider adding crash guards

3. **Update Monitoring**
   - Add specific metric for this crash type
   - Lower alert threshold if needed
   - Create dashboard panel for tracking

### Escalation Criteria

- Crash rate > 5%: **Escalate to Engineering Manager immediately**
- Crash causing data loss: **Escalate to Product Manager**
- Unable to identify cause within 1 hour: **Escalate to Mobile Team Lead**
- Issue persists after hotfix: **Escalate to VP Engineering**

### Related Runbooks

- [Memory Leak](#6-severe-memory-leak)
- [Service Outage](#4-service-outage)

---

## 2. High API Error Rate

**Alert:** API error rate exceeds 5%

**Severity:** Critical

**Impact:** Users unable to access data, sync failures, degraded functionality

### Diagnostic Steps

1. **Identify Affected Endpoints**
   ```bash
   # Query error rates by endpoint
   curl -X GET "https://api.fleet.com/metrics/errors?groupBy=endpoint&timeRange=1h"
   ```
   - List endpoints with high error rates
   - Note error codes (400, 401, 403, 500, 503, etc.)

2. **Check Backend Service Health**
   ```bash
   # Check backend service status
   curl https://api.fleet.com/health

   # Check backend metrics
   open https://grafana.fleet.com/backend-health
   ```
   - Verify backend services are running
   - Check backend error logs
   - Review database connection status

3. **Analyze Error Patterns**
   - Check if errors are consistent or intermittent
   - Identify error types:
     - Client errors (4xx): Check request validation
     - Server errors (5xx): Backend issue
     - Timeout errors: Network or performance issue

4. **Review Recent Changes**
   ```bash
   # Check recent backend deployments
   kubectl get deployments -n production
   kubectl describe deployment fleet-api
   ```
   - Review recent API changes
   - Check for breaking changes
   - Verify API versioning

### Resolution Steps

**Immediate Actions:**

1. **Implement Circuit Breaker**
   ```swift
   // Enable circuit breaker for failing endpoint
   APIConfiguration.enableCircuitBreaker(for: "/api/problematic-endpoint")
   ```

2. **Enable Offline Mode**
   - Allow app to function with cached data
   - Queue failed requests for retry
   - Show appropriate user messaging

3. **Contact Backend Team**
   - Open incident in #backend-alerts
   - Share error metrics and affected endpoints
   - Request backend investigation

**Short-term Fix:**

1. **Implement Request Retry Logic**
   ```swift
   // Add exponential backoff retry
   func retryRequest(maxAttempts: 3, exponentialBackoff: true) {
       // Implementation
   }
   ```

2. **Add Request Timeout Handling**
   ```swift
   // Reduce timeout for failing endpoints
   urlRequest.timeoutInterval = 10.0
   ```

3. **Deploy Client-Side Fix (if needed)**
   - Update request parameters
   - Fix authentication headers
   - Correct API versioning

**Long-term Fix:**

1. **Implement Better Error Handling**
   - Add specific error messages for each error type
   - Implement graceful degradation
   - Cache responses for offline use

2. **Add API Health Checks**
   - Implement pre-flight checks
   - Add endpoint availability checking
   - Show service status to users

3. **Improve Logging**
   - Log full request/response for errors
   - Add correlation IDs for tracing
   - Enhance error context

### Escalation Criteria

- Error rate > 10%: **Escalate to Backend Team Lead immediately**
- Multiple endpoints affected: **Escalate to Architecture team**
- Payment/critical endpoints affected: **Escalate to Product Manager**
- Issue persists > 30 minutes: **Escalate to Engineering Manager**

### Related Runbooks

- [Service Outage](#4-service-outage)
- [Network Timeout](#15-network-timeout)
- [Authentication Failure](#3-authentication-failure)

---

## 3. Authentication Failure

**Alert:** Authentication failure rate exceeds 10%

**Severity:** Critical

**Impact:** Users unable to log in, potential security breach, service disruption

### Diagnostic Steps

1. **Identify Failure Types**
   ```bash
   # Query auth failures by type
   curl -X GET "https://api.fleet.com/metrics/auth-failures?groupBy=reason&timeRange=1h"
   ```
   Common failure reasons:
   - Invalid credentials
   - Expired tokens
   - Network errors
   - Service unavailable
   - Rate limiting

2. **Check Authentication Service**
   ```bash
   # Check auth service health
   curl https://auth.fleet.com/health

   # Check recent logins
   curl -X GET "https://api.fleet.com/auth/login-stats?timeRange=1h"
   ```

3. **Review Security Events**
   - Check for DDoS attack patterns
   - Review rate limiting logs
   - Check for brute force attempts
   - Monitor geographic distribution of failures

4. **Verify Token Management**
   - Check token expiration settings
   - Verify refresh token logic
   - Review keychain storage issues

### Resolution Steps

**Immediate Actions:**

1. **Assess Security Threat**
   - If DDoS/attack: **Enable rate limiting**
   - If credential stuffing: **Enable CAPTCHA**
   - If service issue: **Proceed with technical fix**

2. **Enable Fallback Authentication**
   ```swift
   // Use backup auth endpoint if available
   APIConfiguration.authEndpoint = "https://auth-backup.fleet.com/login"
   ```

3. **Communicate with Users**
   - Post status update
   - Provide workaround if available
   - Update support team

**Short-term Fix:**

1. **Fix Token Refresh Logic**
   ```swift
   // Ensure proper token refresh
   func refreshToken() async throws -> AuthToken {
       guard let refreshToken = KeychainManager.getRefreshToken() else {
           throw AuthError.noRefreshToken
       }

       let newToken = try await authService.refresh(refreshToken)
       try KeychainManager.save(token: newToken)
       return newToken
   }
   ```

2. **Handle Expired Sessions Gracefully**
   ```swift
   // Redirect to login on token expiration
   if error is AuthError.tokenExpired {
       NavigationCoordinator.shared.showLogin()
   }
   ```

3. **Implement Retry with Fresh Token**
   - Retry failed requests after token refresh
   - Clear cached tokens on persistent failures
   - Force re-authentication if needed

**Long-term Fix:**

1. **Improve Token Management**
   - Implement automatic token refresh
   - Add token expiration buffer (refresh before expiry)
   - Better error messaging for auth failures

2. **Add Biometric Fallback**
   - Implement Face ID/Touch ID
   - Store encrypted credentials locally
   - Quick re-authentication option

3. **Security Improvements**
   - Implement certificate pinning
   - Add request signing
   - Enhanced MFA support

### Escalation Criteria

- Failure rate > 25%: **Escalate to Security team immediately**
- Suspected attack: **Escalate to Security team and VP Engineering**
- Payment-related: **Escalate to Compliance team**
- Issue persists > 15 minutes: **Escalate to Backend Team Lead**

### Related Runbooks

- [High API Error Rate](#2-high-api-error-rate)
- [Service Outage](#4-service-outage)

---

## 4. Service Outage

**Alert:** Active users < 5 during business hours

**Severity:** Critical

**Impact:** Complete service unavailability, no users can access app

### Diagnostic Steps

1. **Verify Actual Outage**
   ```bash
   # Check backend services
   curl -I https://api.fleet.com/health

   # Check DNS
   nslookup api.fleet.com

   # Check CDN
   curl -I https://cdn.fleet.com
   ```

2. **Check Multiple Layers**
   - Mobile app functionality
   - Backend API availability
   - Database connectivity
   - Third-party services (Firebase, Azure, etc.)
   - DNS resolution
   - SSL certificate validity

3. **Review Monitoring Systems**
   ```bash
   # Check all monitoring dashboards
   open https://grafana.fleet.com/service-health
   open https://datadog.fleet.com/infrastructure
   open https://status.fleet.com
   ```

4. **Check Recent Changes**
   - Recent deployments (mobile or backend)
   - Infrastructure changes
   - DNS changes
   - SSL certificate renewals

### Resolution Steps

**Immediate Actions:**

1. **Declare Major Incident**
   ```bash
   # Create incident
   ./scripts/create-incident.sh --severity=critical --title="Complete Service Outage"
   ```
   - Page all relevant teams
   - Start incident bridge call
   - Assign incident commander

2. **Update Status Page**
   - Post immediate status update
   - Set expectation for next update
   - Provide subscription option

3. **Assess Rollback Options**
   - Identify last known good state
   - Prepare rollback commands
   - Coordinate with all teams

**Short-term Fix:**

1. **If Backend Issue:**
   ```bash
   # Rollback backend deployment
   kubectl rollout undo deployment/fleet-api

   # Scale up replicas if needed
   kubectl scale deployment/fleet-api --replicas=10
   ```

2. **If Mobile App Issue:**
   ```bash
   # Enable remote kill switch
   firebase remoteConfig.setValue("true", forKey: "app_maintenance_mode")

   # Display maintenance message to users
   ```

3. **If Infrastructure Issue:**
   ```bash
   # Check load balancer
   aws elbv2 describe-target-health --target-group-arn <ARN>

   # Check auto-scaling
   aws autoscaling describe-auto-scaling-groups
   ```

**Long-term Fix:**

1. **Complete Root Cause Analysis**
   - Document timeline of events
   - Identify root cause
   - List contributing factors
   - Document lessons learned

2. **Implement Preventative Measures**
   - Add health checks
   - Improve monitoring
   - Add automated rollback
   - Implement circuit breakers

3. **Update Runbooks**
   - Document new findings
   - Update escalation procedures
   - Add new diagnostic steps

### Escalation Criteria

- **Immediate:** Escalate to Engineering Manager and VP Engineering
- **5 minutes:** Escalate to CTO
- **15 minutes:** Escalate to CEO
- **30 minutes:** Consider external communication (press, investors)

### Related Runbooks

- [High API Error Rate](#2-high-api-error-rate)
- [Database Connection Failure](#5-database-connection-failure)

---

## 5. Database Connection Failure

**Alert:** Database connection errors > 10/min

**Severity:** Critical

**Impact:** Data persistence failures, app crashes, data loss

### Diagnostic Steps

1. **Check Database Connectivity**
   ```swift
   // Test database connection
   let isConnected = DataPersistenceManager.shared.testConnection()
   print("Database connected: \(isConnected)")
   ```

2. **Review Error Logs**
   ```bash
   # Check app logs for database errors
   adb logcat | grep "SQLite\|CoreData\|Database"
   ```

3. **Check Storage Space**
   ```swift
   // Check available storage
   let availableSpace = UIDevice.current.availableStorage()
   print("Available storage: \(availableSpace) bytes")
   ```

4. **Verify Database Integrity**
   ```swift
   // Check database file
   let dbPath = DataPersistenceManager.shared.databasePath
   let exists = FileManager.default.fileExists(atPath: dbPath)
   let size = try? FileManager.default.attributesOfItem(atPath: dbPath)[.size]
   ```

### Resolution Steps

**Immediate Actions:**

1. **Enable Offline Mode**
   - Queue operations for later
   - Prevent new write operations
   - Show appropriate user message

2. **Check Connection Pool**
   ```swift
   // Reset connection pool
   DataPersistenceManager.shared.resetConnectionPool()
   ```

3. **Verify Database File**
   - Check file permissions
   - Verify file not corrupted
   - Check encryption keys valid

**Short-term Fix:**

1. **Implement Connection Retry**
   ```swift
   func connectWithRetry(maxAttempts: 5) {
       for attempt in 1...maxAttempts {
           do {
               try openDatabase()
               return
           } catch {
               Thread.sleep(forTimeInterval: Double(attempt) * 0.5)
           }
       }
   }
   ```

2. **Clear Database Cache**
   ```swift
   // Clear cached connections
   DataPersistenceManager.shared.clearCache()
   ```

3. **Verify Write Permissions**
   - Check app sandbox permissions
   - Verify file protection level
   - Check for file locking issues

**Long-term Fix:**

1. **Implement Connection Pooling**
   - Manage connection lifecycle
   - Add connection timeouts
   - Monitor connection health

2. **Add Database Migration Safety**
   - Test migrations thoroughly
   - Add rollback capability
   - Version database schema

3. **Improve Error Handling**
   - Better error messages
   - Graceful degradation
   - Data recovery procedures

### Escalation Criteria

- Persistent failures > 5 minutes: **Escalate to Mobile Team Lead**
- Data loss suspected: **Escalate to Data team and Product Manager**
- Affecting > 25% of users: **Escalate to Engineering Manager**

### Related Runbooks

- [Storage Space Issues](#18-storage-space-issues)
- [Data Sync Failures](#16-data-sync-failures)

---

## 6. Severe Memory Leak

**Alert:** P95 memory > 250MB with growth rate > 10MB/min

**Severity:** Critical

**Impact:** App slowdown, crashes, poor user experience

### Diagnostic Steps

1. **Use Instruments to Profile**
   ```bash
   # Launch Instruments
   open -a Instruments
   # Select "Leaks" and "Allocations" templates
   ```

2. **Identify Leaking Objects**
   - Review leak stack traces
   - Identify retain cycles
   - Check for unclosed resources
   - Review delegate patterns

3. **Check Specific Screens**
   ```bash
   # Query memory by screen
   curl -X GET "https://api.fleet.com/metrics/memory?groupBy=screen&timeRange=1h"
   ```

4. **Review Recent Code Changes**
   - Check for new closures with strong references
   - Review view controller lifecycle
   - Check for notification observer leaks

### Resolution Steps

**Immediate Actions:**

1. **Force App Restart Recommendation**
   - Show in-app message recommending restart
   - Clear memory caches
   - Release unnecessary resources

2. **Disable Memory-Intensive Features**
   ```swift
   // Disable problematic feature
   FeatureFlags.shared.disable(.highMemoryFeature)
   ```

**Short-term Fix:**

1. **Fix Retain Cycles**
   ```swift
   // Use weak self in closures
   someAsyncOperation { [weak self] result in
       guard let self = self else { return }
       self.handleResult(result)
   }
   ```

2. **Implement Proper Cleanup**
   ```swift
   // Add deinit logging
   deinit {
       NotificationCenter.default.removeObserver(self)
       cancellables.removeAll()
       logger.log(.debug, "View controller deallocated")
   }
   ```

3. **Clear Caches Aggressively**
   ```swift
   // Clear image cache
   ImageCache.shared.clearMemory()

   // Clear data cache
   CacheManager.shared.clearExpiredItems()
   ```

**Long-term Fix:**

1. **Implement Memory Monitoring**
   - Add memory warnings handling
   - Implement automatic cache clearing
   - Monitor memory in development

2. **Code Review Focus**
   - Review all closures for retain cycles
   - Check delegate weak references
   - Verify observer cleanup

3. **Add Unit Tests**
   - Test view controller deallocation
   - Test cache cleanup
   - Test resource release

### Escalation Criteria

- Memory > 300MB: **Immediate hotfix required**
- Causing crashes: **Escalate to Mobile Team Lead immediately**
- Unable to identify source within 1 hour: **Escalate to Senior Engineer**

### Related Runbooks

- [High Crash Rate](#1-high-crash-rate)
- [High Memory Usage](#8-high-memory-usage)

---

## 7. Slow API Response

**Alert:** P95 API response time > 500ms

**Severity:** Warning

**Impact:** Degraded user experience, slow app performance

### Diagnostic Steps

1. **Identify Slow Endpoints**
   ```bash
   # Query response times by endpoint
   curl -X GET "https://api.fleet.com/metrics/latency?groupBy=endpoint&percentile=95&timeRange=1h"
   ```

2. **Check Network Conditions**
   - Test on different networks (WiFi, 4G, 5G)
   - Check latency from different regions
   - Verify CDN performance

3. **Review Backend Performance**
   ```bash
   # Check backend service latency
   open https://grafana.fleet.com/backend-latency
   ```

4. **Check for Large Payloads**
   - Review response sizes
   - Check for unnecessary data
   - Verify compression enabled

### Resolution Steps

**Immediate Actions:**

1. **Enable Response Caching**
   ```swift
   // Cache API responses aggressively
   CacheManager.shared.setCachePolicy(.returnCacheDataElseLoad)
   ```

2. **Reduce Request Frequency**
   - Implement request throttling
   - Batch multiple requests
   - Reduce polling frequency

**Short-term Fix:**

1. **Optimize API Calls**
   ```swift
   // Request only needed fields
   let fields = ["id", "name", "status"]
   apiRequest.setFields(fields)
   ```

2. **Implement Request Pagination**
   ```swift
   // Load data in smaller chunks
   func fetchVehicles(page: Int, limit: Int = 20) {
       // Implementation
   }
   ```

3. **Add Loading Indicators**
   - Show progress for slow operations
   - Add skeleton screens
   - Provide user feedback

**Long-term Fix:**

1. **Implement GraphQL (if applicable)**
   - Request only needed data
   - Reduce over-fetching
   - Single request for multiple resources

2. **Add Request Prioritization**
   - High priority for user-initiated requests
   - Low priority for background sync
   - Queue management

3. **Improve Error Handling**
   - Retry with exponential backoff
   - Show cached data on timeout
   - Graceful degradation

### Escalation Criteria

- P95 > 2 seconds: **Escalate to Backend team**
- Affecting critical flows: **Escalate to Product Manager**
- Persists > 2 hours: **Escalate to Architecture team**

### Related Runbooks

- [High API Error Rate](#2-high-api-error-rate)
- [Network Timeout](#15-network-timeout)

---

## 8. High Memory Usage

**Alert:** P95 memory usage > 150MB

**Severity:** Warning

**Impact:** Potential crashes, slower performance, battery drain

### Diagnostic Steps

1. **Profile Memory Usage**
   ```bash
   # Use Xcode Memory Graph Debugger
   # Debug -> View Memory Graph Hierarchy
   ```

2. **Identify Memory Hotspots**
   - Check image caching
   - Review data caching
   - Check for large arrays/dictionaries
   - Review view hierarchy depth

3. **Check by Screen**
   ```bash
   # Query memory by screen
   curl -X GET "https://api.fleet.com/metrics/memory?groupBy=screen"
   ```

### Resolution Steps

**Immediate Actions:**

1. **Clear Caches**
   ```swift
   // Clear all caches
   ImageCache.shared.clearMemory()
   CacheManager.shared.clearMemoryCache()
   URLCache.shared.removeAllCachedResponses()
   ```

2. **Optimize Image Loading**
   ```swift
   // Resize images before displaying
   func loadOptimizedImage(_ url: URL) {
       ImageLoader.load(url, size: targetSize, contentMode: .aspectFit)
   }
   ```

**Short-term Fix:**

1. **Implement Lazy Loading**
   ```swift
   // Load images on-demand
   lazy var heavyResource: HeavyObject = {
       return HeavyObject()
   }()
   ```

2. **Add Memory Warnings Handler**
   ```swift
   func didReceiveMemoryWarning() {
       clearCaches()
       releaseUnusedResources()
       logger.log(.warning, "Memory warning received")
   }
   ```

**Long-term Fix:**

1. **Optimize Data Structures**
   - Use structs instead of classes where appropriate
   - Implement efficient caching strategies
   - Clear unused data promptly

2. **Improve Image Handling**
   - Implement image downsampling
   - Use progressive image loading
   - Implement disk caching

### Escalation Criteria

- Memory > 200MB: **Escalate to Mobile Team Lead**
- Causing crashes: **Escalate immediately**

### Related Runbooks

- [Severe Memory Leak](#6-severe-memory-leak)

---

## 9. High Sync Queue

**Alert:** Sync queue depth > 100 items

**Severity:** Warning

**Impact:** Data not syncing, potential data loss, storage issues

### Diagnostic Steps

1. **Check Queue Contents**
   ```swift
   // Inspect sync queue
   let queueDepth = BackgroundSyncManager.shared.queueDepth
   let oldestItem = BackgroundSyncManager.shared.oldestQueueItem
   print("Queue depth: \(queueDepth), Oldest: \(oldestItem?.timestamp)")
   ```

2. **Check Network Connectivity**
   ```swift
   // Verify network status
   let isConnected = NetworkMonitor.shared.isConnected
   let connectionType = NetworkMonitor.shared.connectionType
   ```

3. **Check Backend Sync Endpoint**
   ```bash
   # Test sync endpoint
   curl -X POST https://api.fleet.com/sync/batch
   ```

### Resolution Steps

**Immediate Actions:**

1. **Verify Network Connection**
   - Check WiFi/cellular connectivity
   - Test backend reachability
   - Verify authentication

2. **Reduce Queue Processing Load**
   ```swift
   // Process in smaller batches
   BackgroundSyncManager.shared.batchSize = 10
   ```

**Short-term Fix:**

1. **Implement Batch Processing**
   ```swift
   // Process queue in batches
   func processQueue() async {
       while queueDepth > 0 {
           let batch = getNextBatch(limit: 20)
           try await syncBatch(batch)
       }
   }
   ```

2. **Add Retry Logic**
   ```swift
   // Retry failed sync items
   func retryFailedItems() {
       let failedItems = getFailedSyncItems()
       for item in failedItems {
           try await syncItem(item)
       }
   }
   ```

**Long-term Fix:**

1. **Optimize Sync Strategy**
   - Prioritize important data
   - Implement differential sync
   - Reduce sync frequency

2. **Add Queue Management**
   - Implement queue size limits
   - Archive old items
   - Clean up failed items

### Escalation Criteria

- Queue > 500 items: **Escalate to Mobile Team Lead**
- Data loss risk: **Escalate to Product Manager**

### Related Runbooks

- [Data Sync Failures](#16-data-sync-failures)
- [High API Error Rate](#2-high-api-error-rate)

---

## 10. GPS Accuracy Degradation

**Alert:** Average GPS accuracy > 30 meters

**Severity:** Warning

**Impact:** Inaccurate trip tracking, poor user experience

### Diagnostic Steps

1. **Check Location Permissions**
   ```swift
   // Verify location permissions
   let status = LocationManager.shared.authorizationStatus
   print("Location permission: \(status)")
   ```

2. **Check GPS Settings**
   ```swift
   // Check accuracy mode
   let accuracy = LocationManager.shared.desiredAccuracy
   let distanceFilter = LocationManager.shared.distanceFilter
   ```

3. **Review User Environment**
   - Check if users are indoors
   - Review geographic distribution
   - Check weather conditions

### Resolution Steps

**Immediate Actions:**

1. **Request Better Permissions**
   ```swift
   // Request "Always" authorization if needed
   LocationManager.shared.requestAlwaysAuthorization()
   ```

2. **Adjust Accuracy Settings**
   ```swift
   // Increase accuracy
   locationManager.desiredAccuracy = kCLLocationAccuracyBest
   locationManager.distanceFilter = kCLDistanceFilterNone
   ```

**Short-term Fix:**

1. **Implement Location Smoothing**
   ```swift
   // Filter out inaccurate readings
   func filterLocation(_ location: CLLocation) -> Bool {
       return location.horizontalAccuracy < 50.0
   }
   ```

2. **Add Kalman Filter**
   - Smooth GPS readings
   - Reduce noise
   - Improve accuracy

**Long-term Fix:**

1. **Implement Hybrid Positioning**
   - Combine GPS with WiFi/cell tower data
   - Use motion sensors for dead reckoning
   - Implement map matching

### Escalation Criteria

- Accuracy > 100m: **Escalate to Product team**
- Affecting trip billing: **Escalate to Product Manager immediately**

### Related Runbooks

- [High Battery Drain](#11-high-battery-drain)

---

## 11. High Battery Drain

**Alert:** Battery drain rate > 10%/hour

**Severity:** Warning

**Impact:** Poor user experience, app uninstalls

### Diagnostic Steps

1. **Profile Energy Usage**
   ```bash
   # Use Xcode Energy Organizer
   # Window -> Organizer -> Energy
   ```

2. **Check Background Activity**
   ```swift
   // Review background tasks
   let backgroundTasks = BackgroundTaskManager.shared.activeTasks
   print("Active background tasks: \(backgroundTasks)")
   ```

3. **Check Location Usage**
   ```swift
   // Verify location update frequency
   let updateInterval = LocationManager.shared.updateInterval
   ```

### Resolution Steps

**Immediate Actions:**

1. **Reduce Location Updates**
   ```swift
   // Use significant location changes
   LocationManager.shared.startMonitoringSignificantLocationChanges()
   ```

2. **Pause Background Tasks**
   ```swift
   // Defer non-critical background work
   BackgroundSyncManager.shared.pauseNonCriticalTasks()
   ```

**Short-term Fix:**

1. **Optimize Location Tracking**
   ```swift
   // Use geofencing instead of continuous tracking
   func useGeofencing() {
       for region in monitoredRegions {
           LocationManager.shared.startMonitoring(for: region)
       }
   }
   ```

2. **Batch Network Requests**
   - Combine multiple requests
   - Reduce request frequency
   - Use background URLSession

**Long-term Fix:**

1. **Implement Adaptive Tracking**
   - High accuracy when driving
   - Low accuracy when stationary
   - Off when parked

2. **Add Battery Monitoring**
   ```swift
   // Adjust behavior based on battery level
   if batteryLevel < 0.20 {
       enablePowerSaveMode()
   }
   ```

### Escalation Criteria

- Drain > 20%/hour: **Escalate to Mobile Team Lead**
- User complaints > 10: **Escalate to Product Manager**

### Related Runbooks

- [GPS Accuracy Degradation](#10-gps-accuracy-degradation)

---

## 12. OBD2 Connection Issues

**Alert:** OBD2 connection success rate < 70%

**Severity:** Warning

**Impact:** Unable to collect vehicle diagnostics, reduced functionality

### Diagnostic Steps

1. **Check Bluetooth Status**
   ```swift
   // Verify Bluetooth enabled
   let bluetoothStatus = OBD2Manager.shared.bluetoothStatus
   print("Bluetooth status: \(bluetoothStatus)")
   ```

2. **Review Device Compatibility**
   ```swift
   // Check OBD2 device types
   let deviceTypes = OBD2Manager.shared.getConnectedDeviceTypes()
   ```

3. **Check Connection Logs**
   ```bash
   # Review OBD2 connection logs
   grep "OBD2" app.log
   ```

### Resolution Steps

**Immediate Actions:**

1. **Reset Bluetooth Connection**
   ```swift
   // Reset Bluetooth
   OBD2Manager.shared.resetBluetooth()
   ```

2. **Clear Paired Devices**
   ```swift
   // Clear cached connections
   OBD2Manager.shared.clearPairedDevices()
   ```

**Short-term Fix:**

1. **Implement Auto-Reconnect**
   ```swift
   // Retry connection automatically
   func autoReconnect() {
       guard !isConnected else { return }
       attemptConnection(retries: 3)
   }
   ```

2. **Add Device Compatibility Check**
   - Verify device supported
   - Check protocol compatibility
   - Update device firmware if needed

**Long-term Fix:**

1. **Improve Connection Logic**
   - Better error handling
   - Implement connection pooling
   - Add connection diagnostics

2. **Update Device Support**
   - Add support for more devices
   - Update communication protocols
   - Improve device discovery

### Escalation Criteria

- Success rate < 50%: **Escalate to Mobile Team Lead**
- Affecting fleet management features: **Escalate to Product Manager**

---

## 13. Elevated Error Rate

**Alert:** Error rate between 2-5%

**Severity:** Warning

**Impact:** Degraded experience, potential escalation

### Diagnostic Steps

1. **Categorize Errors**
   ```bash
   # Query errors by type
   curl -X GET "https://api.fleet.com/metrics/errors?groupBy=type&timeRange=1h"
   ```

2. **Identify Patterns**
   - Time-based patterns
   - User-based patterns
   - Feature-based patterns

3. **Check Error Context**
   - Review error messages
   - Check stack traces
   - Identify common factors

### Resolution Steps

**Immediate Actions:**

1. **Monitor for Escalation**
   - Watch error rate trend
   - Set up additional alerts
   - Prepare contingency plans

2. **Add Additional Logging**
   ```swift
   // Enhanced error logging
   ErrorHandler.shared.enableVerboseLogging()
   ```

**Short-term Fix:**

1. **Implement Error Recovery**
   ```swift
   // Add automatic error recovery
   func handleError(_ error: Error) {
       if error.isRecoverable {
           attemptRecovery()
       }
   }
   ```

2. **Improve Error Messages**
   - User-friendly messages
   - Actionable suggestions
   - Support contact info

**Long-term Fix:**

1. **Root Cause Analysis**
   - Identify error sources
   - Fix underlying issues
   - Prevent recurrence

2. **Improve Error Handling**
   - Better error categorization
   - Graceful degradation
   - Enhanced monitoring

### Escalation Criteria

- Rate approaches 5%: **Escalate to on-call engineer**
- Trending upward: **Escalate to Mobile Team Lead**

---

## 14. Slow App Launch

**Alert:** P95 app launch time > 3 seconds

**Severity:** Warning

**Impact:** Poor first impression, user frustration

### Diagnostic Steps

1. **Profile App Launch**
   ```bash
   # Use Instruments Time Profiler
   # Measure: pre-main, main, viewDidLoad, viewDidAppear
   ```

2. **Identify Bottlenecks**
   - Check initialization code
   - Review dependency injection
   - Check database migrations
   - Review network calls during launch

3. **Differentiate Launch Types**
   - Cold start (app not in memory)
   - Warm start (app in background)
   - Hot start (app in foreground)

### Resolution Steps

**Immediate Actions:**

1. **Defer Non-Critical Initialization**
   ```swift
   // Move to background
   DispatchQueue.global(qos: .background).async {
       initializeNonCriticalServices()
   }
   ```

2. **Add Launch Screen Optimization**
   - Show informative launch screen
   - Add progress indicator
   - Preload critical data only

**Short-term Fix:**

1. **Optimize AppDelegate**
   ```swift
   func application(_ application: UIApplication,
                    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
       // Only critical initialization here
       setupCrashReporting()
       setupAnalytics()

       // Defer everything else
       DispatchQueue.main.async {
           self.deferredSetup()
       }

       return true
   }
   ```

2. **Lazy Load Services**
   ```swift
   // Initialize services on-demand
   lazy var heavyService: HeavyService = {
       return HeavyService()
   }()
   ```

**Long-term Fix:**

1. **Implement Launch Optimization**
   - Reduce framework loading
   - Optimize static initializers
   - Defer SDK initialization

2. **Add Launch Monitoring**
   - Track launch time metrics
   - Monitor by iOS version
   - A/B test optimizations

### Escalation Criteria

- Launch time > 5 seconds: **Escalate to Mobile Team Lead**
- Trending worse: **Escalate to Performance team**

---

## 15. Network Timeout

**Alert:** Network timeout rate > 3%

**Severity:** Warning

**Impact:** Failed requests, poor user experience

### Diagnostic Steps

1. **Check Timeout Settings**
   ```swift
   // Review timeout configuration
   let timeout = URLRequest.timeoutInterval
   print("Request timeout: \(timeout)s")
   ```

2. **Analyze Network Conditions**
   - Check connection type (WiFi, 4G, 5G)
   - Measure actual latency
   - Test from different locations

3. **Review Backend Response Times**
   ```bash
   # Check backend latency
   curl -w "@curl-format.txt" https://api.fleet.com/endpoint
   ```

### Resolution Steps

**Immediate Actions:**

1. **Adjust Timeout Values**
   ```swift
   // Increase timeout for slow connections
   if NetworkMonitor.shared.connectionType == .cellular {
       urlRequest.timeoutInterval = 30.0
   }
   ```

2. **Implement Request Retry**
   ```swift
   // Retry timed-out requests
   func retryOnTimeout(maxAttempts: 3) {
       // Implementation with exponential backoff
   }
   ```

**Short-term Fix:**

1. **Optimize Request Size**
   - Reduce payload size
   - Enable compression
   - Request only needed data

2. **Implement Request Cancellation**
   ```swift
   // Cancel slow requests
   if requestDuration > 15.0 {
       urlSessionTask.cancel()
       showCachedData()
   }
   ```

**Long-term Fix:**

1. **Implement Adaptive Timeouts**
   - Adjust based on connection type
   - Learn from historical data
   - Per-endpoint configuration

2. **Add Request Monitoring**
   - Track timeout rates
   - Identify slow endpoints
   - Monitor by region

### Escalation Criteria

- Timeout rate > 10%: **Escalate to Backend team**
- Specific endpoint affected: **Escalate to API owner**

---

## 16. Data Sync Failures

**Alert:** Sync failure rate > 10%

**Severity:** Warning

**Impact:** Data inconsistency, lost updates

### Diagnostic Steps

1. **Check Sync Status**
   ```swift
   // Review sync failures
   let failures = SyncService.shared.recentFailures
   print("Recent sync failures: \(failures.count)")
   ```

2. **Identify Failure Types**
   - Network errors
   - Authentication errors
   - Conflict errors
   - Validation errors

3. **Check Data Integrity**
   ```swift
   // Verify data consistency
   let conflicts = ConflictResolver.shared.pendingConflicts
   ```

### Resolution Steps

**Immediate Actions:**

1. **Retry Failed Syncs**
   ```swift
   // Retry all failed sync operations
   await SyncService.shared.retryFailedOperations()
   ```

2. **Resolve Conflicts**
   ```swift
   // Auto-resolve simple conflicts
   ConflictResolver.shared.autoResolveSimpleConflicts()
   ```

**Short-term Fix:**

1. **Implement Better Conflict Resolution**
   ```swift
   // Implement last-write-wins strategy
   func resolveConflict(_ local: Entity, _ remote: Entity) -> Entity {
       return local.timestamp > remote.timestamp ? local : remote
   }
   ```

2. **Add Sync Queue Management**
   - Prioritize critical data
   - Batch operations
   - Implement exponential backoff

**Long-term Fix:**

1. **Improve Sync Architecture**
   - Implement differential sync
   - Add versioning
   - Better conflict detection

2. **Add Sync Monitoring**
   - Track sync success rate
   - Monitor sync duration
   - Alert on anomalies

### Escalation Criteria

- Failure rate > 25%: **Escalate to Mobile Team Lead**
- Data loss risk: **Escalate to Product Manager and Data team**

---

## 17. Push Notification Failures

**Alert:** Push notification delivery rate < 90%

**Severity:** Warning

**Impact:** Users miss important updates

### Diagnostic Steps

1. **Check APNs Status**
   ```bash
   # Verify APNs connectivity
   curl https://api.push.apple.com
   ```

2. **Review Token Registration**
   ```swift
   // Check device token
   let token = PushNotificationManager.shared.deviceToken
   print("Device token: \(token?.hexString ?? "nil")")
   ```

3. **Check Backend Delivery**
   ```bash
   # Query notification delivery status
   curl -X GET "https://api.fleet.com/notifications/delivery-stats"
   ```

### Resolution Steps

**Immediate Actions:**

1. **Re-register for Notifications**
   ```swift
   // Force token refresh
   UIApplication.shared.registerForRemoteNotifications()
   ```

2. **Check Notification Permissions**
   ```swift
   // Verify permissions granted
   let center = UNUserNotificationCenter.current()
   let settings = await center.notificationSettings()
   ```

**Short-term Fix:**

1. **Implement Fallback Mechanism**
   - Use in-app polling
   - Show alerts on app open
   - Send emails as backup

2. **Add Token Refresh Logic**
   ```swift
   // Refresh token periodically
   func refreshTokenIfNeeded() {
       if lastTokenUpdate > 30.days.ago {
           UIApplication.shared.registerForRemoteNotifications()
       }
   }
   ```

**Long-term Fix:**

1. **Improve Notification Infrastructure**
   - Add delivery confirmation
   - Implement retry logic
   - Monitor delivery rates

2. **Add Notification Analytics**
   - Track delivery success
   - Monitor by device type
   - Alert on anomalies

### Escalation Criteria

- Delivery < 80%: **Escalate to Backend team**
- Critical notifications failing: **Escalate to Product Manager**

---

## 18. Storage Space Issues

**Alert:** App storage > 500MB or device storage < 100MB

**Severity:** Warning

**Impact:** App crashes, data loss, unable to cache data

### Diagnostic Steps

1. **Check App Storage Usage**
   ```swift
   // Calculate app storage
   let appSize = FileManager.default.appStorageSize()
   print("App storage: \(appSize) bytes")
   ```

2. **Break Down Storage by Type**
   ```swift
   // Analyze storage components
   let breakdown = [
       "Database": DatabaseManager.shared.storageSize(),
       "Images": ImageCache.shared.storageSize(),
       "Documents": DocumentManager.shared.storageSize(),
       "Logs": LoggingManager.shared.storageSize()
   ]
   ```

3. **Check Device Storage**
   ```swift
   // Check device available space
   let freeSpace = UIDevice.current.availableStorage()
   ```

### Resolution Steps

**Immediate Actions:**

1. **Clear Cached Data**
   ```swift
   // Clear all caches
   CacheManager.shared.clearAll()
   ImageCache.shared.clearDiskCache()
   URLCache.shared.removeAllCachedResponses()
   ```

2. **Delete Old Logs**
   ```swift
   // Remove logs older than 7 days
   LoggingManager.shared.deleteLogsOlderThan(days: 7)
   ```

**Short-term Fix:**

1. **Implement Storage Limits**
   ```swift
   // Set cache size limits
   ImageCache.shared.maxCacheSize = 100.MB
   CacheManager.shared.maxDiskCacheSize = 200.MB
   ```

2. **Add Automatic Cleanup**
   ```swift
   // Clean up old data automatically
   func cleanupOldData() {
       deleteOldTrips(olderThan: 90.days)
       deleteOldLogs(olderThan: 7.days)
       compactDatabase()
   }
   ```

**Long-term Fix:**

1. **Implement Smart Caching**
   - LRU cache eviction
   - Size-based limits
   - Age-based cleanup

2. **Add Storage Monitoring**
   - Alert on high usage
   - Show storage info to users
   - Prompt cleanup when needed

### Escalation Criteria

- Storage > 1GB: **Escalate to Mobile Team Lead**
- Causing crashes: **Escalate immediately**

---

## General Incident Response Guidelines

### Communication Protocol

1. **Initial Response (0-5 minutes)**
   - Acknowledge alert
   - Create incident ticket
   - Post in #incidents channel

2. **Investigation (5-30 minutes)**
   - Follow diagnostic steps
   - Document findings
   - Update incident ticket every 10 minutes

3. **Resolution (30+ minutes)**
   - Implement fix
   - Test thoroughly
   - Deploy to production
   - Monitor for 1 hour post-fix

4. **Post-Incident (24 hours)**
   - Write incident report
   - Conduct blameless postmortem
   - Update runbooks
   - Implement preventative measures

### Documentation Requirements

All incidents must be documented with:
- Timeline of events
- Root cause analysis
- Impact assessment
- Resolution steps taken
- Lessons learned
- Action items

---

*Last Updated: 2025-11-11*
*Version: 1.0*
*Owner: Mobile Engineering Team*

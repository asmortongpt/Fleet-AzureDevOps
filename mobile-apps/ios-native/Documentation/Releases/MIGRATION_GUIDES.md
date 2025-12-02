# Migration Guides - Fleet Management iOS App

**Last Updated:** November 11, 2025
**Maintained By:** Capital Tech Alliance Engineering Team

---

## Table of Contents

1. [Migration Guide Template](#migration-guide-template)
2. [Data Migration Procedures](#data-migration-procedures)
3. [API Version Compatibility](#api-version-compatibility)
4. [Backward Compatibility Policy](#backward-compatibility-policy)
5. [Deprecation Notices](#deprecation-notices)
6. [Version-Specific Migration Guides](#version-specific-migration-guides)

---

## Migration Guide Template

Use this template when creating migration guides for new releases:

```markdown
# Migration Guide: v[OLD] to v[NEW]

## Overview
- Release Date: [DATE]
- Migration Complexity: [Low/Medium/High]
- Estimated Time: [MINUTES]
- Rollback Supported: [Yes/No]

## Breaking Changes
- [List all breaking changes]

## Pre-Migration Checklist
- [ ] Backup data
- [ ] Review breaking changes
- [ ] Test in staging environment
- [ ] Notify users of downtime (if applicable)

## Migration Steps
1. [Step-by-step instructions]

## Post-Migration Validation
- [ ] Verify data integrity
- [ ] Test critical features
- [ ] Monitor error logs

## Rollback Procedure
[Steps to rollback if needed]

## Support
- Contact: [EMAIL]
- Emergency: [PHONE]
```

---

## Data Migration Procedures

### Overview

Data migration ensures that user data is safely transferred when upgrading between app versions while maintaining data integrity and availability.

### Migration Types

#### 1. Automatic Migration (Recommended)

**When to Use:**
- Minor version updates (1.0 → 1.1)
- Non-breaking schema changes
- Additive changes only

**Process:**
1. App detects version upgrade on launch
2. Backup current database automatically
3. Run migration scripts
4. Validate data integrity
5. Mark migration complete
6. Delete backup after 7 days

**User Experience:**
- Transparent to user
- May see "Updating..." screen (10-30 seconds)
- No data loss
- Seamless experience

#### 2. Guided Migration

**When to Use:**
- Major version updates (1.x → 2.x)
- Significant schema changes
- User input required

**Process:**
1. Display migration wizard
2. Explain changes to user
3. Request necessary permissions
4. Perform migration with progress bar
5. Show completion summary
6. Offer rollback option (72 hours)

**User Experience:**
- 1-5 minute process
- User sees progress
- Option to pause/resume
- Rollback available

#### 3. Manual Migration

**When to Use:**
- Complex data transformations
- Legacy system integration
- Enterprise deployments

**Process:**
1. Export data from old version
2. Transform data format
3. Import into new version
4. Validate and reconcile
5. Archive old data

**User Experience:**
- May require IT assistance
- Scheduled maintenance window
- Detailed documentation provided

### Core Data Migration

#### Lightweight Migration

**Automatic for:**
- Adding new attributes
- Adding new entities
- Adding new relationships
- Making attributes optional
- Changing attribute defaults

**Example:**
```swift
// Enable lightweight migration
let options = [
    NSMigratePersistentStoresAutomaticallyOption: true,
    NSInferMappingModelAutomaticallyOption: true
]
```

#### Heavy Migration

**Required for:**
- Renaming attributes/entities
- Changing attribute types
- Complex relationship changes
- Data transformation logic

**Process:**
1. Create mapping model
2. Define migration policy
3. Implement custom migration code
4. Test thoroughly
5. Deploy with fallback

### Migration Best Practices

**Before Migration:**
- ✅ Create automatic backup
- ✅ Test on clean install
- ✅ Test on upgrade path
- ✅ Validate all data types
- ✅ Test rollback procedure

**During Migration:**
- ✅ Show progress indicator
- ✅ Log all operations
- ✅ Handle errors gracefully
- ✅ Maintain app responsiveness
- ✅ Allow cancellation if possible

**After Migration:**
- ✅ Validate data integrity
- ✅ Test critical workflows
- ✅ Monitor crash reports
- ✅ Provide user support
- ✅ Keep backup available

### Data Validation

**Integrity Checks:**
```swift
// Validate vehicle count
let preCount = oldDatabase.vehicleCount
let postCount = newDatabase.vehicleCount
assert(preCount == postCount, "Vehicle count mismatch")

// Validate relationships
validateAllVehiclesHaveAssignedDrivers()
validateAllTripsHaveVehicles()

// Validate data types
validateAllDatesAreValid()
validateAllCoordinatesAreInRange()
```

**Health Check:**
- Record count comparison
- Relationship integrity
- Data type validation
- Business rule validation
- Checksum verification

### Backup and Recovery

**Automatic Backup:**
- Created before migration
- Stored in app's document directory
- Encrypted with user's key
- Auto-deleted after 7 days
- Accessible for rollback

**Manual Backup:**
- Export to iCloud Drive
- Export to Files app
- Email export
- Cloud storage integration
- Retention: User controlled

**Recovery Options:**
1. Automatic rollback (if migration fails)
2. Manual rollback (within 72 hours)
3. Restore from iCloud backup
4. Contact support for assistance

---

## API Version Compatibility

### API Versioning Strategy

The Fleet Management app uses **API versioning** to maintain backward compatibility:

**Format:** `/api/v{MAJOR}/endpoint`

**Examples:**
- `/api/v1/vehicles` (deprecated)
- `/api/v2/vehicles` (current)
- `/api/v3/vehicles` (future)

### Compatibility Matrix

| App Version | API v1 | API v2 | API v3 |
|-------------|--------|--------|--------|
| v1.0.0 | ❌ | ✅ | ❌ |
| v1.1.0 | ❌ | ✅ | ❌ |
| v1.2.0 | ❌ | ✅ | ⚠️ (preview) |
| v2.0.0 | ❌ | ⚠️ (legacy) | ✅ |

**Legend:**
- ✅ Full support
- ⚠️ Limited support / Preview
- ❌ Not supported

### API Migration Timeline

**API v1 → v2 (November 2025):**
- **Migration Period:** None (v1 never public)
- **Deprecation Date:** N/A
- **Sunset Date:** N/A
- **Breaking Changes:** None (initial release)

**API v2 → v3 (June 2026, planned):**
- **Announcement:** December 2025
- **Migration Period:** 6 months (Jan-Jun 2026)
- **Deprecation Date:** June 2026
- **Sunset Date:** December 2026
- **Breaking Changes:** TBD

### Version Negotiation

**Client Header:**
```
X-API-Version: 2
Accept: application/vnd.fleet.v2+json
```

**Server Response:**
```
X-API-Version: 2
Content-Type: application/vnd.fleet.v2+json
```

**Fallback Behavior:**
- If requested version unavailable, return latest supported
- Include warning header: `X-API-Version-Warning: requested v3, using v2`
- Log version mismatches for monitoring

### Migration Strategies

#### 1. Graceful Degradation

**Approach:** Support both old and new API simultaneously

**Example:**
```swift
func fetchVehicles() async throws -> [Vehicle] {
    if apiVersion >= 2 {
        return try await fetchVehiclesV2()
    } else {
        return try await fetchVehiclesV1()
    }
}
```

**Pros:**
- Smooth transition
- No user impact
- Rollback friendly

**Cons:**
- Increased complexity
- More testing required
- Technical debt

#### 2. Big Bang Migration

**Approach:** Switch all users at once

**Example:**
```swift
// After migration date
func fetchVehicles() async throws -> [Vehicle] {
    return try await fetchVehiclesV2() // Only v2 supported
}
```

**Pros:**
- Clean cutover
- Simplified codebase
- Clear timeline

**Cons:**
- Higher risk
- Potential outage
- Requires coordination

#### 3. Feature Flag Migration

**Approach:** Gradual rollout with feature flags

**Example:**
```swift
func fetchVehicles() async throws -> [Vehicle] {
    if FeatureFlags.useAPIv2 {
        return try await fetchVehiclesV2()
    } else {
        return try await fetchVehiclesV1()
    }
}
```

**Pros:**
- Gradual rollout
- Easy rollback
- A/B testing possible

**Cons:**
- Requires feature flag infrastructure
- Complex state management
- Longer migration period

---

## Backward Compatibility Policy

### Commitment

Capital Tech Alliance is committed to maintaining backward compatibility wherever possible to minimize disruption to users and integrations.

### Compatibility Guarantees

**MINOR version updates (1.0 → 1.1):**
- ✅ **Guaranteed:** No breaking API changes
- ✅ **Guaranteed:** Data format compatibility
- ✅ **Guaranteed:** Automatic migration
- ✅ **Guaranteed:** No user action required

**MAJOR version updates (1.x → 2.x):**
- ⚠️ **May Include:** Breaking API changes (documented)
- ⚠️ **May Include:** Data format changes (with migration)
- ⚠️ **May Require:** User action
- ✅ **Guaranteed:** 6-month transition period
- ✅ **Guaranteed:** Migration tools provided

### What We Don't Break

**Stable APIs:**
- Public APIs remain backward compatible
- Existing endpoints continue to work
- Response format additions only
- Optional parameters added

**Data Storage:**
- Existing data readable by new versions
- No data loss during upgrades
- Automatic migration when possible
- Manual migration tools provided

**User Experience:**
- Core workflows unchanged
- Existing features enhanced (not removed)
- UI changes are additive
- Settings and preferences preserved

### What May Change

**Deprecated Features:**
- Features marked deprecated may be removed
- Minimum 6-month deprecation period
- Alternative provided before removal
- Clear migration path documented

**Experimental Features:**
- Beta features may change significantly
- No compatibility guarantees
- Clearly marked as "Beta" or "Preview"
- Opt-in only

**Internal APIs:**
- Private APIs may change without notice
- Internal data structures may evolve
- Implementation details subject to change

### Deprecation Process

**Phase 1: Announcement (T-6 months)**
- Feature marked as deprecated in code
- Documentation updated
- In-app notice displayed
- Email to affected users
- Migration guide published

**Phase 2: Warning Period (T-3 months)**
- Deprecation warnings in app
- Usage analytics collected
- Support reaches out to heavy users
- Migration assistance offered

**Phase 3: Removal (T-0)**
- Feature removed from codebase
- Redirects to new feature (if applicable)
- Final migration deadline
- Support documentation archived

### Version Support Windows

| Version Type | Full Support | Security Patches | End of Life |
|-------------|--------------|------------------|-------------|
| Current | Indefinite | Indefinite | - |
| Current -1 | 12 months | 18 months | 24 months |
| Current -2 | 6 months | 12 months | 18 months |
| Older | None | None | Immediate |

---

## Deprecation Notices

### Current Deprecations

#### None (v1.0.0)

As the initial release, there are no deprecations at this time.

### Planned Deprecations (v1.1.0)

#### Legacy Analytics API

**Deprecated In:** v1.1.0 (December 2025)
**Removed In:** v2.0.0 (June 2026)
**Reason:** Performance and feature limitations

**Migration Path:**
```swift
// Old (deprecated)
let stats = try await api.getStats()

// New (recommended)
let analytics = try await api.getAnalytics()
```

**Resources:**
- Migration Guide: [Link]
- API Documentation: [Link]
- Video Tutorial: [Link]

#### Basic Route API

**Deprecated In:** v1.1.0 (December 2025)
**Removed In:** v2.0.0 (June 2026)
**Reason:** Replaced by route optimization engine

**Migration Path:**
```swift
// Old (deprecated)
let route = try await api.getRoute(from: start, to: end)

// New (recommended)
let optimizedRoute = try await api.optimizeRoute(
    stops: [start, ...waypoints, end],
    constraints: routeConstraints
)
```

**Breaking Changes:**
- Return type changed
- Additional parameters required
- Response format enhanced

#### Manual Fuel Entry

**Deprecated In:** v1.1.0 (December 2025)
**Removed In:** v1.2.0 (March 2026)
**Reason:** Automated tracking more accurate

**Migration Path:**
- Enable OBD2 integration
- Connect fleet fuel cards
- Use receipt OCR capture
- Manual entry still available (simplified)

---

## Version-Specific Migration Guides

### Migration: Beta (v0.9.0) → Production (v1.0.0)

**Release Date:** November 11, 2025
**Migration Complexity:** Low
**Estimated Time:** < 1 minute
**Rollback Supported:** No (forward only)

#### Overview

Beta testers are automatically migrated to the production version. All beta data is preserved and migrated.

#### Breaking Changes

None - This is a seamless upgrade.

#### Pre-Migration Checklist

- [x] Automatic process (no user action required)
- [x] Data automatically backed up
- [x] App Store updates app automatically

#### Migration Steps

1. **Automatic Update:**
   - App Store updates app automatically
   - Or: Open App Store, tap "Update"

2. **First Launch:**
   - App detects beta → production migration
   - Shows "Updating your data..." screen (10-30 seconds)
   - Migrates all vehicles, trips, inspections
   - Preserves all photos and documents

3. **Completion:**
   - Migration complete notification
   - Welcome tour for new features (optional)
   - App ready to use

#### Post-Migration Validation

- [x] All vehicles present
- [x] All trips with correct data
- [x] Photos and documents accessible
- [x] Settings and preferences preserved
- [x] Login credentials retained

#### Known Issues

None reported.

#### Support

- Email: support@capitaltechalliance.com
- In-app: Settings → Help → Contact Support

---

### Migration: v1.0.0 → v1.1.0 (Planned)

**Release Date:** December 15, 2025
**Migration Complexity:** Low
**Estimated Time:** < 2 minutes
**Rollback Supported:** Yes (72 hours)

#### Overview

Version 1.1.0 introduces new features without breaking existing functionality. Migration is automatic with optional feature opt-in.

#### Breaking Changes

None for app users. Backend API deprecations announced (see above).

#### Pre-Migration Checklist

- [ ] Ensure iOS 15.0 or later
- [ ] Have 300MB free space
- [ ] Connected to WiFi (recommended)

#### Migration Steps

1. **Update App:**
   - App Store automatic update, or
   - Manual update from App Store

2. **First Launch:**
   - "Preparing new features..." screen (30-60 seconds)
   - Database schema migration (automatic)
   - Feature flags enabled

3. **New Feature Setup:**
   - Welcome tour highlights new features
   - Optional: Enable driver scoring
   - Optional: Set up geofences
   - Optional: Configure analytics

#### Post-Migration Validation

- [ ] All existing data intact
- [ ] New features accessible
- [ ] Reports generate correctly
- [ ] Sync working properly

#### Rollback Procedure

Within 72 hours:
1. Settings → Advanced → Version Management
2. Tap "Restore Previous Version"
3. Confirm rollback
4. App reverts to v1.0.0 with data preserved

#### Known Issues

None anticipated.

---

### Migration: v1.1.0 → v1.2.0 (Planned)

**Release Date:** March 15, 2026
**Migration Complexity:** Medium
**Estimated Time:** 2-5 minutes
**Rollback Supported:** Yes (7 days)

#### Overview

Version 1.2.0 includes significant new features (Apple Watch, CarPlay) and requires iOS 16.0.

#### Breaking Changes

**iOS Version:**
- Requires iOS 16.0+ (upgraded from 15.0)
- Devices running iOS 15.x cannot install

**Storage:**
- Requires 500MB free (upgraded from 300MB)
- Offline maps require additional storage

#### Pre-Migration Checklist

- [ ] Update to iOS 16.0 or later
- [ ] Have 500MB+ free space
- [ ] Backup device via iCloud
- [ ] Connected to WiFi

#### Migration Steps

1. **Update iOS (if needed):**
   - Settings → General → Software Update
   - Install iOS 16.0 or later
   - Restart device

2. **Update App:**
   - App Store will prompt
   - Download (55 MB)
   - Install and launch

3. **Guided Migration:**
   - Welcome screen explains changes
   - iOS 16 feature opt-in
   - Watch app install prompt
   - CarPlay setup wizard
   - Offline maps download

4. **Post-Migration Setup:**
   - Configure Apple Watch (optional)
   - Set up CarPlay (optional)
   - Download offline maps (optional)
   - Configure video recording (optional)

#### Post-Migration Validation

- [ ] All v1.1.0 data migrated
- [ ] Watch app syncing (if installed)
- [ ] CarPlay working (if available)
- [ ] Offline maps downloaded
- [ ] Video recording functional

#### Rollback Procedure

Within 7 days:
1. Settings → Advanced → Version Management
2. Review rollback impact
3. Confirm rollback to v1.1.0
4. Watch app uninstalled automatically
5. CarPlay features disabled

**Note:** Cannot rollback iOS version.

---

## API Client Migration Examples

### Example: Updating API Calls

**v1 (Deprecated):**
```swift
// Old endpoint structure
let response = try await networkManager.get("/api/v1/stats")
let stats = try JSONDecoder().decode(StatsResponse.self, from: response)
```

**v2 (Current):**
```swift
// New endpoint with improved data structure
let response = try await networkManager.get("/api/v2/analytics")
let analytics = try JSONDecoder().decode(AnalyticsResponse.self, from: response)
```

### Example: Handling Both Versions

```swift
func fetchFleetData() async throws -> FleetData {
    let apiVersion = await apiConfiguration.currentVersion

    switch apiVersion {
    case 1:
        // Support for legacy systems
        return try await fetchFleetDataV1()
    case 2:
        // Current version
        return try await fetchFleetDataV2()
    default:
        throw APIError.unsupportedVersion
    }
}
```

---

## Migration Support Resources

### Documentation
- [API Documentation](https://api.capitaltechalliance.com/docs)
- [Migration Tutorials](https://docs.capitaltechalliance.com/migration)
- [Video Guides](https://www.youtube.com/capitaltechalliance)

### Support Channels
- **Email:** migrations@capitaltechalliance.com
- **Phone:** 1-800-FLEET-HELP (1-800-353-3843)
- **Slack:** #migration-support
- **Office Hours:** Live help Tuesdays 2-4 PM PT

### Tools
- Migration validator script
- Data export/import utilities
- API testing sandbox
- Rollback utilities

---

**Document Maintained By:** Engineering Team
**Review Frequency:** Per release
**Next Review:** Before v1.1.0 release

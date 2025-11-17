# Map Components Test Suite

## Overview

This comprehensive test suite provides production-ready tests for all map components in the Fleet Management System. The suite includes unit tests, integration tests, and coverage for error handling, accessibility, and memory leak prevention.

## 📁 Test Files Created

### Core Testing Utilities
- **`src/test-utils.tsx`** - Centralized testing utilities, mocks, and helpers
  - Mock data factories (vehicles, facilities, cameras)
  - Leaflet library mocks
  - Google Maps API mocks
  - Environment variable mocks
  - localStorage mocks
  - Custom render functions
  - Assertion helpers

### Map Component Tests

#### 1. UniversalMap Tests
**File:** `src/components/__tests__/UniversalMap.test.tsx`

**Coverage:**
- Provider selection and switching (Leaflet ↔ Google Maps)
- Error handling and fallback mechanisms
- Loading states and transitions
- Prop validation (coordinates, zoom levels)
- Callback functions (onMapReady, onMapError)
- Error boundaries
- Cleanup and memory management
- Development mode features
- Public API functions (getMapProvider, setMapProvider, etc.)

**Test Count:** 50+ tests

#### 2. LeafletMap Tests
**File:** `src/components/__tests__/LeafletMap.test.tsx`

**Coverage:**
- Map initialization with Leaflet library
- Map style switching (OSM, Dark, Topo, Satellite)
- Vehicle marker rendering and updates
- Facility marker rendering
- Camera marker rendering
- Marker validation and error handling
- Auto-fit bounds functionality
- Popup creation and interaction
- Keyboard accessibility
- Memory cleanup and layer management
- Utility functions (isValidCoordinate, calculateDistance)

**Test Count:** 60+ tests

#### 3. GoogleMap Tests
**File:** `src/components/__tests__/GoogleMap.test.tsx`

**Coverage:**
- API key validation and error handling
- Loading states and transitions
- Map initialization with Google Maps API
- Map style switching (roadmap, satellite, hybrid, terrain)
- Vehicle, facility, and camera markers
- Info window management
- Bounds fitting and zoom limits
- Error recovery and retry logic
- Marker lifecycle and cleanup
- Event listener management
- Real-time updates

**Test Count:** 55+ tests

### Module Component Tests

#### 4. GPSTracking Tests
**File:** `src/components/modules/__tests__/GPSTracking.test.tsx`

**Coverage:**
- Map integration with UniversalMap
- Vehicle filtering by status
- Status metrics calculation
- Vehicle selection and callbacks
- Loading and error states
- Data updates and re-rendering
- Performance with large datasets
- Edge cases and invalid data

**Test Count:** 35+ tests

#### 5. TrafficCameras Tests
**File:** `src/components/modules/__tests__/TrafficCameras.test.tsx`

**Coverage:**
- Camera marker display and filtering
- Operational status visualization
- Live feed link functionality
- Camera selection and details
- Map integration
- Data updates and synchronization
- Performance optimization
- Error handling for invalid data

**Test Count:** 35+ tests

#### 6. FleetDashboard Tests (Stub)
**File:** `src/components/modules/__tests__/FleetDashboard.test.tsx`

**Coverage:**
- Dashboard layout and widgets
- Fleet statistics display
- Map integration
- Real-time updates
- Interactive features

**Test Count:** 15+ test stubs

#### 7. GISCommandCenter Tests (Stub)
**File:** `src/components/modules/__tests__/GISCommandCenter.test.tsx`

**Coverage:**
- Advanced mapping features
- Layer management
- Spatial analysis tools
- Multi-source data integration

**Test Count:** 15+ test stubs

#### 8. RouteManagement Tests (Stub)
**File:** `src/components/modules/__tests__/RouteManagement.test.tsx`

**Coverage:**
- Route planning and optimization
- Waypoint management
- Route visualization
- ETA calculations

**Test Count:** 15+ test stubs

#### 9. GeofenceManagement Tests (Stub)
**File:** `src/components/modules/__tests__/GeofenceManagement.test.tsx`

**Coverage:**
- Geofence creation and editing
- Zone types (circular, polygonal)
- Entry/exit monitoring
- Alert configuration

**Test Count:** 15+ test stubs

## 🚀 Running Tests

### Run All Unit Tests
```bash
npm run test:unit
```

### Run Tests in Watch Mode
```bash
npm run test:unit:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npx vitest run src/components/__tests__/UniversalMap.test.tsx
```

### Run Tests Matching Pattern
```bash
npx vitest run --reporter=verbose --testNamePattern="Vehicle Markers"
```

## 📊 Coverage Goals

The test suite aims for **80%+ code coverage** across all map components:

- **Lines:** 80%+
- **Functions:** 80%+
- **Branches:** 80%+
- **Statements:** 80%+

Current configuration in `vitest.config.ts`:
```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  }
}
```

## 🧪 Test Categories

### Unit Tests
- Individual component rendering
- Prop validation
- State management
- Utility functions
- Error handling

### Integration Tests
- Component interaction with map libraries
- Data flow between components
- Event handlers and callbacks
- Map provider switching

### Accessibility Tests
- ARIA attributes
- Keyboard navigation
- Screen reader compatibility
- Focus management

### Performance Tests
- Large dataset rendering
- Update optimization
- Debouncing and throttling
- Memory leak prevention

### Error Handling Tests
- Invalid data handling
- Network errors
- API failures
- Graceful degradation

## 🛠️ Testing Utilities

### Mock Data Factories

```typescript
// Create mock vehicles
const vehicles = createMockVehicles(10)

// Create mock facilities
const facilities = createMockFacilities(5)

// Create mock cameras
const cameras = createMockCameras(8)

// Create custom vehicle
const customVehicle = createMockVehicle({
  status: 'emergency',
  location: { lat: 30.4383, lng: -84.2807, address: 'Custom' }
})
```

### Map Library Mocks

```typescript
// Setup Leaflet mocks
setupLeafletMocks()

// Setup Google Maps mocks
setupGoogleMapsMocks()

// Access mock instances
mockLeaflet.map(...)
mockGoogleMaps.Map(...)
```

### Environment Mocks

```typescript
// Mock environment variables
mockEnvVariables({
  VITE_GOOGLE_MAPS_API_KEY: 'test-key'
})

// Mock localStorage
const storage = mockLocalStorage()
storage.setItem('key', 'value')
```

### Assertion Helpers

```typescript
// Validate coordinates
expectValidCoordinates(30.4383, -84.2807)

// Check map creation
expectMapCreated(mockLeaflet.map)

// Check markers added
expectMarkersAdded(mockLeaflet.marker, 5)
```

## 📝 Test Structure

Each test file follows this structure:

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup mocks and environment
  })

  afterEach(() => {
    // Cleanup
  })

  describe('Feature Category', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

## 🔍 Key Testing Patterns

### 1. Async Operations
```typescript
await waitFor(() => {
  expect(screen.getByText('Map Ready')).toBeInTheDocument()
}, { timeout: 3000 })
```

### 2. User Interactions
```typescript
const user = userEvent.setup()
await user.click(screen.getByRole('button'))
```

### 3. Component Updates
```typescript
const { rerender } = render(<Component prop1="value1" />)
rerender(<Component prop1="value2" />)
```

### 4. Error Testing
```typescript
vi.mocked(mockFunction).mockImplementation(() => {
  throw new Error('Test error')
})
```

### 5. Cleanup Verification
```typescript
const { unmount } = render(<Component />)
unmount()
expect(cleanupFunction).toHaveBeenCalled()
```

## 🐛 Debugging Tests

### View Test Output
```bash
npx vitest run --reporter=verbose
```

### Debug Specific Test
```bash
npx vitest run --reporter=verbose --testNamePattern="should render without crashing"
```

### Enable Console Logs
Remove or comment out `mockConsole()` in tests to see console output.

### Inspect DOM
```typescript
import { screen } from '@testing-library/react'

screen.debug() // Print entire DOM
screen.debug(screen.getByRole('button')) // Print specific element
```

## 🎯 Best Practices

1. **Descriptive Test Names**
   - Use "should" statements
   - Be specific about what is tested
   - Include context when needed

2. **Test Isolation**
   - Each test should be independent
   - Clean up after tests
   - Don't rely on test execution order

3. **Mock External Dependencies**
   - Mock map libraries
   - Mock API calls
   - Mock timers and async operations

4. **Test User Behavior**
   - Focus on user interactions
   - Test what users see and do
   - Avoid testing implementation details

5. **Accessibility Testing**
   - Test ARIA attributes
   - Test keyboard navigation
   - Test screen reader compatibility

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm run test:unit

- name: Upload Coverage
  run: npm run test:coverage

- name: Check Coverage Thresholds
  run: npx vitest run --coverage
```

## 🔄 Updating Tests

When adding new features to map components:

1. Add tests to existing test file
2. Update mock data if needed
3. Add new test utilities if required
4. Update this README with new coverage
5. Ensure coverage thresholds are met

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Leaflet Documentation](https://leafletjs.com/)
- [Google Maps API](https://developers.google.com/maps/documentation)

## 🤝 Contributing

When contributing tests:

1. Follow existing test patterns
2. Maintain 80%+ coverage
3. Test edge cases
4. Include accessibility tests
5. Document complex test scenarios
6. Update this README

## ✅ Checklist for New Tests

- [ ] Component renders without crashing
- [ ] Props are validated
- [ ] Error states are handled
- [ ] Loading states are tested
- [ ] User interactions work
- [ ] Callbacks are called correctly
- [ ] Cleanup happens on unmount
- [ ] Accessibility attributes present
- [ ] Edge cases are covered
- [ ] Performance is acceptable
- [ ] Coverage thresholds met

---

**Total Test Files:** 10
**Total Tests:** 250+
**Coverage Target:** 80%+

Last Updated: November 16, 2025

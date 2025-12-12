
# Clean Architecture Implementation Guide for Mobile Apps

## Overview
This document outlines the clean architecture implementation for CTAFleet iOS and Android apps.

## Architecture Layers

### 1. Presentation Layer (UI)
**iOS:** `ViewControllers/`, `Views/`, `SwiftUI/`
**Android:** `ui/`, `activities/`, `fragments/`, `composables/`

- Contains only UI logic
- No direct database or API calls
- Uses ViewModels/Presenters

### 2. Domain Layer (Business Logic)
**iOS:** `Domain/UseCases/`, `Domain/Models/`
**Android:** `domain/usecases/`, `domain/models/`

- Pure business logic
- Platform-independent
- No UI or data dependencies

### 3. Data Layer
**iOS:** `Data/Repositories/`, `Data/DataSources/`
**Android:** `data/repositories/`, `data/datasources/`

- Repository pattern
- Remote and local data sources
- Data models to domain models mapping

## Example: Vehicle List Feature

### iOS Implementation

```swift
// Domain/Models/Vehicle.swift
struct Vehicle {
    let id: String
    let make: String
    let model: String
    let status: VehicleStatus
}

// Domain/UseCases/GetVehiclesUseCase.swift
protocol GetVehiclesUseCase {
    func execute(tenantId: String) async throws -> [Vehicle]
}

class GetVehiclesUseCaseImpl: GetVehiclesUseCase {
    private let repository: VehicleRepository

    init(repository: VehicleRepository) {
        self.repository = repository
    }

    func execute(tenantId: String) async throws -> [Vehicle] {
        return try await repository.getVehicles(tenantId: tenantId)
    }
}

// Presentation/ViewModels/VehicleListViewModel.swift
@MainActor
class VehicleListViewModel: ObservableObject {
    @Published var vehicles: [Vehicle] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let getVehiclesUseCase: GetVehiclesUseCase

    init(getVehiclesUseCase: GetVehiclesUseCase) {
        self.getVehiclesUseCase = getVehiclesUseCase
    }

    func loadVehicles(tenantId: String) async {
        isLoading = true
        do {
            vehicles = try await getVehiclesUseCase.execute(tenantId: tenantId)
        } catch {
            self.error = error
        }
        isLoading = false
    }
}

// Presentation/Views/VehicleListView.swift
struct VehicleListView: View {
    @StateObject var viewModel: VehicleListViewModel

    var body: some View {
        List(viewModel.vehicles) { vehicle in
            VehicleRow(vehicle: vehicle)
        }
        .task {
            await viewModel.loadVehicles(tenantId: currentTenantId)
        }
    }
}
```

### Android Implementation

```kotlin
// domain/models/Vehicle.kt
data class Vehicle(
    val id: String,
    val make: String,
    val model: String,
    val status: VehicleStatus
)

// domain/usecases/GetVehiclesUseCase.kt
interface GetVehiclesUseCase {
    suspend operator fun invoke(tenantId: String): Result<List<Vehicle>>
}

class GetVehiclesUseCaseImpl(
    private val repository: VehicleRepository
) : GetVehiclesUseCase {
    override suspend fun invoke(tenantId: String): Result<List<Vehicle>> {
        return repository.getVehicles(tenantId)
    }
}

// ui/viewmodels/VehicleListViewModel.kt
class VehicleListViewModel(
    private val getVehiclesUseCase: GetVehiclesUseCase
) : ViewModel() {

    private val _vehicles = MutableStateFlow<List<Vehicle>>(emptyList())
    val vehicles: StateFlow<List<Vehicle>> = _vehicles.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun loadVehicles(tenantId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            getVehiclesUseCase(tenantId)
                .onSuccess { _vehicles.value = it }
                .onFailure { /* Handle error */ }
            _isLoading.value = false
        }
    }
}

// ui/screens/VehicleListScreen.kt
@Composable
fun VehicleListScreen(
    viewModel: VehicleListViewModel = hiltViewModel()
) {
    val vehicles by viewModel.vehicles.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    LazyColumn {
        items(vehicles) { vehicle ->
            VehicleRow(vehicle = vehicle)
        }
    }

    LaunchedEffect(Unit) {
        viewModel.loadVehicles(currentTenantId)
    }
}
```

## Migration Steps

1. **Create Domain Layer**
   - Define business models
   - Create use cases for each feature

2. **Refactor Data Layer**
   - Implement repository pattern
   - Separate remote/local data sources

3. **Update Presentation Layer**
   - Move business logic to use cases
   - ViewModels/Presenters only handle UI state

4. **Dependency Injection**
   - iOS: Use protocol-based DI
   - Android: Use Hilt/Dagger

5. **Testing**
   - Unit test use cases
   - UI tests for presentation layer

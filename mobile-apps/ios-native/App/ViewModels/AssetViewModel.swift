import Foundation
import SwiftUI
import Combine

// MARK: - Asset View Model
@MainActor
class AssetViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var assets: [Asset] = []
    @Published var filteredAssets: [Asset] = []
    @Published var selectedAsset: Asset?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var searchText = ""
    @Published var selectedStatus: AssetStatus?
    @Published var selectedType: AssetType?
    @Published var sortOption: SortOption = .number

    // MARK: - Services
    private let networkManager = AzureNetworkManager()
    private let persistenceManager = DataPersistenceManager.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Sort Options
    enum SortOption: String, CaseIterable {
        case number = "Number"
        case name = "Name"
        case type = "Type"
        case status = "Status"
        case lastInspection = "Last Inspection"

        var systemImage: String {
            switch self {
            case .number: return "number"
            case .name: return "textformat.abc"
            case .type: return "cube.fill"
            case .status: return "info.circle"
            case .lastInspection: return "calendar"
            }
        }
    }

    // MARK: - Initialization
    init() {
        setupSearchAndFilter()
        loadCachedData()
    }

    // MARK: - Search and Filter Setup
    private func setupSearchAndFilter() {
        // Combine search text, status filter, and type filter
        Publishers.CombineLatest4(
            $assets,
            $searchText,
            $selectedStatus,
            $selectedType
        )
        .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
        .map { assets, searchText, status, type in
            var filtered = assets

            // Apply status filter
            if let status = status {
                filtered = filtered.filter { $0.status == status }
            }

            // Apply type filter
            if let type = type {
                filtered = filtered.filter { $0.type == type }
            }

            // Apply search filter
            if !searchText.isEmpty {
                filtered = filtered.filter { asset in
                    asset.number.localizedCaseInsensitiveContains(searchText) ||
                    asset.name.localizedCaseInsensitiveContains(searchText) ||
                    asset.type.displayName.localizedCaseInsensitiveContains(searchText) ||
                    (asset.serialNumber?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                    (asset.description?.localizedCaseInsensitiveContains(searchText) ?? false)
                }
            }

            return filtered
        }
        .assign(to: &$filteredAssets)

        // Apply sorting
        $filteredAssets
            .combineLatest($sortOption)
            .map { assets, sortOption in
                self.sortAssets(assets, by: sortOption)
            }
            .assign(to: &$filteredAssets)
    }

    // MARK: - Data Loading
    private func loadCachedData() {
        if let cachedAssets = persistenceManager.getCachedAssets() {
            assets = cachedAssets
        }
    }

    func fetchAssets(token: String? = nil) async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await networkManager.performRequest(
                endpoint: APIConfiguration.Endpoints.assets,
                method: .GET,
                token: token,
                responseType: AssetsResponse.self
            )

            assets = response.assets
            persistenceManager.cacheAssets(response.assets)
            isLoading = false

        } catch {
            handleError(error)

            // Fall back to cached data if available
            if let cachedAssets = persistenceManager.getCachedAssets() {
                assets = cachedAssets
                errorMessage = "Using cached data. \(error.localizedDescription)"
            }

            isLoading = false
        }
    }

    func fetchAsset(id: String, token: String? = nil) async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await networkManager.performRequest(
                endpoint: "\(APIConfiguration.Endpoints.assets)/\(id)",
                method: .GET,
                token: token,
                responseType: AssetResponse.self
            )

            selectedAsset = response.asset
            persistenceManager.cacheAsset(response.asset)

            // Update in the assets array
            if let index = assets.firstIndex(where: { $0.id == id }) {
                assets[index] = response.asset
            }

            isLoading = false

        } catch {
            handleError(error)
            isLoading = false
        }
    }

    // MARK: - CRUD Operations
    func addAsset(_ request: AssetCreateRequest, token: String? = nil) async throws {
        isLoading = true
        errorMessage = nil

        do {
            let requestDict: [String: Any] = [
                "number": request.number,
                "type": request.type.rawValue,
                "name": request.name,
                "description": request.description as Any,
                "serialNumber": request.serialNumber as Any,
                "make": request.make as Any,
                "model": request.model as Any,
                "status": request.status.rawValue,
                "condition": request.condition.rawValue,
                "location": [
                    "lat": request.location.lat as Any,
                    "lng": request.location.lng as Any,
                    "address": request.location.address as Any,
                    "facility": request.location.facility as Any
                ],
                "purchaseDate": request.purchaseDate as Any,
                "purchaseCost": request.purchaseCost as Any
            ]

            let response = try await networkManager.performRequest(
                endpoint: APIConfiguration.Endpoints.assets,
                method: .POST,
                body: requestDict,
                token: token,
                responseType: AssetResponse.self
            )

            assets.append(response.asset)
            persistenceManager.cacheAsset(response.asset)
            isLoading = false

        } catch {
            isLoading = false
            handleError(error)
            throw error
        }
    }

    func updateAsset(_ asset: Asset, token: String? = nil) async throws {
        isLoading = true
        errorMessage = nil

        do {
            let requestDict: [String: Any] = [
                "number": asset.number,
                "type": asset.type.rawValue,
                "name": asset.name,
                "description": asset.description as Any,
                "serialNumber": asset.serialNumber as Any,
                "make": asset.make as Any,
                "model": asset.model as Any,
                "status": asset.status.rawValue,
                "condition": asset.condition.rawValue,
                "location": [
                    "lat": asset.location.lat as Any,
                    "lng": asset.location.lng as Any,
                    "address": asset.location.address as Any,
                    "facility": asset.location.facility as Any
                ],
                "assignedTo": asset.assignedTo != nil ? [
                    "type": asset.assignedTo!.type.rawValue,
                    "id": asset.assignedTo!.id,
                    "name": asset.assignedTo!.name,
                    "date": asset.assignedTo!.date
                ] as Any : nil as Any,
                "lastInspection": asset.lastInspection as Any,
                "nextInspection": asset.nextInspection as Any
            ]

            let response = try await networkManager.performRequest(
                endpoint: "\(APIConfiguration.Endpoints.assets)/\(asset.id)",
                method: .PUT,
                body: requestDict,
                token: token,
                responseType: AssetResponse.self
            )

            // Update in array
            if let index = assets.firstIndex(where: { $0.id == asset.id }) {
                assets[index] = response.asset
            }

            selectedAsset = response.asset
            persistenceManager.cacheAsset(response.asset)
            isLoading = false

        } catch {
            isLoading = false
            handleError(error)
            throw error
        }
    }

    func deleteAsset(id: String, token: String? = nil) async throws {
        isLoading = true
        errorMessage = nil

        do {
            // DELETE request - no response body expected
            let _: EmptyResponse = try await networkManager.performRequest(
                endpoint: "\(APIConfiguration.Endpoints.assets)/\(id)",
                method: .DELETE,
                token: token,
                responseType: EmptyResponse.self
            )

            // Remove from array
            assets.removeAll { $0.id == id }

            // Clear from cache
            persistenceManager.deleteAsset(id: id)

            if selectedAsset?.id == id {
                selectedAsset = nil
            }

            isLoading = false

        } catch {
            isLoading = false
            handleError(error)
            throw error
        }
    }

    // MARK: - Sorting
    private func sortAssets(_ assets: [Asset], by option: SortOption) -> [Asset] {
        switch option {
        case .number:
            return assets.sorted { $0.number < $1.number }
        case .name:
            return assets.sorted { $0.name < $1.name }
        case .type:
            return assets.sorted { $0.type.displayName < $1.type.displayName }
        case .status:
            return assets.sorted { $0.status.rawValue < $1.status.rawValue }
        case .lastInspection:
            return assets.sorted { (lhs, rhs) in
                guard let lhsDate = lhs.lastInspection,
                      let rhsDate = rhs.lastInspection else {
                    return lhs.lastInspection != nil
                }
                return lhsDate > rhsDate
            }
        }
    }

    // MARK: - Filtering Helpers
    func getAssetsByStatus(_ status: AssetStatus) -> [Asset] {
        assets.filter { $0.status == status }
    }

    func getAssetsByType(_ type: AssetType) -> [Asset] {
        assets.filter { $0.type == type }
    }

    func getInspectionDueAssets() -> [Asset] {
        assets.filter { $0.isInspectionDue }
    }

    func getAvailableAssets() -> [Asset] {
        assets.filter { $0.status == .available }
    }

    // MARK: - Statistics
    func getAssetCount() -> Int {
        assets.count
    }

    func getAvailableCount() -> Int {
        assets.filter { $0.status == .available }.count
    }

    func getInUseCount() -> Int {
        assets.filter { $0.status == .inUse }.count
    }

    func getMaintenanceCount() -> Int {
        assets.filter { $0.status == .maintenance }.count
    }

    func getTotalValue() -> Double {
        assets.compactMap { $0.purchaseCost }.reduce(0, +)
    }

    // MARK: - Error Handling
    private func handleError(_ error: Error) {
        if let apiError = error as? APIError {
            errorMessage = apiError.errorDescription
        } else {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Refresh
    func refresh(token: String? = nil) async {
        await fetchAssets(token: token)
    }

    // MARK: - Clear Filters
    func clearFilters() {
        searchText = ""
        selectedStatus = nil
        selectedType = nil
    }
}

// MARK: - Empty Response for DELETE operations
private struct EmptyResponse: Codable {
    // Empty struct for DELETE operations that don't return data
}

// MARK: - Data Persistence Extension
extension DataPersistenceManager {
    private enum AssetStorageKeys {
        static let assets = "cached_assets"
    }

    func cacheAssets(_ assets: [Asset]) {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(assets)
            userDefaults.set(data, forKey: AssetStorageKeys.assets)
            updateLastSyncDate()
        } catch {
            print("Error caching assets: \(error.localizedDescription)")
        }
    }

    func getCachedAssets() -> [Asset]? {
        guard let data = userDefaults.data(forKey: AssetStorageKeys.assets) else {
            return nil
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let assets = try decoder.decode([Asset].self, from: data)
            return assets
        } catch {
            print("Error decoding cached assets: \(error.localizedDescription)")
            return nil
        }
    }

    func cacheAsset(_ asset: Asset) {
        var assets = getCachedAssets() ?? []

        // Update existing asset or add new one
        if let index = assets.firstIndex(where: { $0.id == asset.id }) {
            assets[index] = asset
        } else {
            assets.append(asset)
        }

        cacheAssets(assets)
    }

    func deleteAsset(id: String) {
        var assets = getCachedAssets() ?? []
        assets.removeAll { $0.id == id }
        cacheAssets(assets)
    }

    func clearAssetCache() {
        userDefaults.removeObject(forKey: AssetStorageKeys.assets)
    }
}

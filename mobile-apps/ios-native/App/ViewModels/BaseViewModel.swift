//
//  BaseViewModel.swift
//  Fleet Manager
//
//  Base ViewModel with caching, performance optimization, and state management
//

import Foundation
import Combine
import SwiftUI

// MARK: - LoadingState
enum LoadingState: Equatable {
    case idle
    case loading
    case loaded
    case error(String)

    var isLoading: Bool {
        if case .loading = self { return true }
        return false
    }

    var hasError: Bool {
        if case .error = self { return true }
        return false
    }
}

// MARK: - BaseViewModel
@MainActor
class BaseViewModel: ObservableObject {
    // MARK: - Properties
    @Published var loadingState: LoadingState = .idle
    @Published var errorMessage: String?

    // Cache management
    private var cache = NSCache<NSString, AnyObject>()
    private let cacheQueue = DispatchQueue(label: "com.fleet.cache", attributes: .concurrent)

    // Performance monitoring
    private var loadStartTime: Date?

    // Cancellables
    var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization
    init() {
        setupCache()
    }

    // MARK: - Cache Management
    private func setupCache() {
        cache.countLimit = 100
        cache.totalCostLimit = 50 * 1024 * 1024 // 50 MB
    }

    func cacheObject<T: AnyObject>(_ object: T, forKey key: String) {
        cacheQueue.async(flags: .barrier) {
            self.cache.setObject(object, forKey: NSString(string: key))
        }
    }

    func getCachedObject<T: AnyObject>(forKey key: String, type: T.Type) -> T? {
        var result: T?
        cacheQueue.sync {
            result = cache.object(forKey: NSString(string: key)) as? T
        }
        return result
    }

    func clearCache() {
        cacheQueue.async(flags: .barrier) {
            self.cache.removeAllObjects()
        }
    }

    // MARK: - Loading State Management
    func startLoading() {
        loadingState = .loading
        loadStartTime = Date()
    }

    func finishLoading() {
        loadingState = .loaded
        logPerformance()
    }

    func handleError(_ error: Error) {
        loadingState = .error(error.localizedDescription)
        errorMessage = error.localizedDescription
        logPerformance()
    }

    func handleErrorMessage(_ message: String) {
        loadingState = .error(message)
        errorMessage = message
        logPerformance()
    }

    func resetError() {
        loadingState = .idle
        errorMessage = nil
    }

    // MARK: - Performance Monitoring
    private func logPerformance() {
        #if DEBUG
        if let startTime = loadStartTime {
            let loadTime = Date().timeIntervalSince(startTime)
            print("⏱ Load time: \(String(format: "%.2f", loadTime))s - \(String(describing: type(of: self)))")
        }
        #endif
    }

    // MARK: - Async Operations
    func performAsync<T>(_ operation: @escaping () async throws -> T,
                        onSuccess: @escaping (T) -> Void,
                        onError: ((Error) -> Void)? = nil) {
        Task {
            do {
                startLoading()
                let result = try await operation()
                await MainActor.run {
                    onSuccess(result)
                    finishLoading()
                }
            } catch {
                await MainActor.run {
                    onError?(error)
                    handleError(error)
                }
            }
        }
    }

    // MARK: - Pagination Support
    func loadMoreIfNeeded<T: Identifiable>(currentItem item: T, in items: [T], threshold: Int = 5) -> Bool {
        guard let index = items.firstIndex(where: { $0.id == item.id }) else { return false }
        return index >= items.count - threshold
    }
}

// MARK: - Paginatable Protocol
protocol Paginatable {
    var currentPage: Int { get set }
    var hasMorePages: Bool { get set }
    var itemsPerPage: Int { get }
    var isLoadingMore: Bool { get set }

    func loadNextPage() async
    func resetPagination()
}

// MARK: - PaginatableViewModel
@MainActor
class PaginatableViewModel: BaseViewModel, Paginatable {
    @Published var currentPage = 1
    @Published var hasMorePages = true
    @Published var isLoadingMore = false

    let itemsPerPage = 20

    func loadNextPage() async {
        // Override in subclasses
    }

    func resetPagination() {
        currentPage = 1
        hasMorePages = true
        isLoadingMore = false
    }

    func startLoadingMore() {
        isLoadingMore = true
    }

    func finishLoadingMore(itemsReceived: Int) {
        isLoadingMore = false
        currentPage += 1
        hasMorePages = itemsReceived >= itemsPerPage
    }
}

// MARK: - Searchable Protocol
protocol Searchable {
    var searchText: String { get set }
    var isSearching: Bool { get set }

    func performSearch()
    func clearSearch()
}

// MARK: - SearchableViewModel
@MainActor
class SearchableViewModel: PaginatableViewModel, Searchable {
    @Published var searchText = ""
    @Published var isSearching = false

    private var searchDebouncer: AnyCancellable?

    override init() {
        super.init()
        setupSearchDebouncer()
    }

    private func setupSearchDebouncer() {
        searchDebouncer = $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] _ in
                self?.performSearch()
            }
    }

    func performSearch() {
        // Override in subclasses
    }

    func clearSearch() {
        searchText = ""
        isSearching = false
    }
}

// MARK: - RefreshableViewModel
@MainActor
class RefreshableViewModel: SearchableViewModel {
    @Published var isRefreshing = false
    @Published var lastRefreshTime: Date?

    func refresh() async {
        // Override in subclasses
    }

    func startRefreshing() {
        isRefreshing = true
    }

    func finishRefreshing() {
        isRefreshing = false
        lastRefreshTime = Date()
    }

    var needsRefresh: Bool {
        guard let lastRefresh = lastRefreshTime else { return true }
        return Date().timeIntervalSince(lastRefresh) > 300 // 5 minutes
    }
}
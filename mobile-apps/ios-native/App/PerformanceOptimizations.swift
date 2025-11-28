//
//  PerformanceOptimizations.swift
//  Fleet Manager - App Performance Optimizations
//
//  Implements various performance improvements for faster loading and smoother UX
//

import Foundation
import SwiftUI

// MARK: - Image Loading Optimization

/// Async image loader with caching
@MainActor
class OptimizedImageLoader: ObservableObject {
    @Published var image: UIImage?
    @Published var isLoading = false

    private static let cache = NSCache<NSString, UIImage>()

    func load(from urlString: String) async {
        // Check cache first
        if let cached = Self.cache.object(forKey: urlString as NSString) {
            self.image = cached
            return
        }

        guard let url = URL(string: urlString) else { return }

        isLoading = true
        defer { isLoading = false }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            if let uiImage = UIImage(data: data) {
                Self.cache.setObject(uiImage, forKey: urlString as NSString)
                self.image = uiImage
            }
        } catch {
            print("Image load error: \(error)")
        }
    }
}

// MARK: - View Rendering Optimization

/// Reusable card view with optimized rendering
struct OptimizedCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(.systemBackground))
                    .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
            )
            .drawingGroup() // Rasterize for better performance
    }
}

// MARK: - List Performance

/// High-performance list configuration
extension List {
    func optimizedForPerformance() -> some View {
        if #available(iOS 16.0, *) {
            return self
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
        } else {
            return self
                .listStyle(.plain)
        }
    }
}

// MARK: - Network Request Optimization

/// Debounced network requests to reduce API calls
@MainActor
class DebouncedSearch: ObservableObject {
    @Published var searchText = ""
    @Published var debouncedText = ""

    private var task: Task<Void, Never>?

    init() {
        // Observe searchText changes
        Task {
            for await text in $searchText.values {
                task?.cancel()
                task = Task {
                    try? await Task.sleep(nanoseconds: 500_000_000) // 0.5s delay
                    if !Task.isCancelled {
                        debouncedText = text
                    }
                }
            }
        }
    }
}

// MARK: - Memory Management

/// Memory-efficient data loading
actor DataCache<Key: Hashable, Value> {
    private var cache: [Key: Value] = [:]
    private let maxSize: Int

    init(maxSize: Int = 100) {
        self.maxSize = maxSize
    }

    func get(_ key: Key) -> Value? {
        return cache[key]
    }

    func set(_ key: Key, value: Value) {
        if cache.count >= maxSize {
            // Remove oldest entry
            if let firstKey = cache.keys.first {
                cache.removeValue(forKey: firstKey)
            }
        }
        cache[key] = value
    }

    func clear() {
        cache.removeAll()
    }
}

// MARK: - Lazy Loading Helper

/// Lazy load view models only when needed
@propertyWrapper
struct LazyLoaded<T> {
    private var value: T?
    private let initializer: () -> T

    init(wrappedValue initializer: @escaping @autoclosure () -> T) {
        self.initializer = initializer
    }

    var wrappedValue: T {
        mutating get {
            if value == nil {
                value = initializer()
            }
            return value!
        }
    }
}

// MARK: - Batch Operations

/// Batch API requests to reduce network overhead
actor BatchRequestManager {
    private var pendingRequests: [String: Task<Data?, Error>] = [:]

    func execute(_ endpoint: String, request: @escaping () async throws -> Data?) async throws -> Data? {
        // If request is already pending, return existing task
        if let existingTask = pendingRequests[endpoint] {
            return try await existingTask.value
        }

        // Create new task
        let task = Task {
            try await request()
        }

        pendingRequests[endpoint] = task
        defer { pendingRequests.removeValue(forKey: endpoint) }

        return try await task.value
    }
}

// MARK: - Animation Performance

/// Optimized animations that don't cause layout thrashing
extension Animation {
    static var optimized: Animation {
        .easeInOut(duration: 0.25)
    }

    static var optimizedSpring: Animation {
        .spring(response: 0.3, dampingFraction: 0.7)
    }
}

// MARK: - Background Task Optimization

/// Manage background tasks efficiently
actor BackgroundTaskQueue {
    private var tasks: [() async -> Void] = []
    private var isProcessing = false

    func enqueue(_ task: @escaping () async -> Void) {
        tasks.append(task)
        if !isProcessing {
            Task { await processTasks() }
        }
    }

    private func processTasks() async {
        isProcessing = true
        while !tasks.isEmpty {
            let task = tasks.removeFirst()
            await task()
        }
        isProcessing = false
    }
}

// MARK: - Usage Examples

/*

 EXAMPLE 1: Optimized Image Loading
 ```swift
 struct VehicleImageView: View {
     @StateObject private var loader = OptimizedImageLoader()

     var body: some View {
         Group {
             if let image = loader.image {
                 Image(uiImage: image)
                     .resizable()
                     .aspectRatio(contentMode: .fill)
             } else {
                 ProgressView()
             }
         }
         .task {
             await loader.load(from: "https://example.com/vehicle.jpg")
         }
     }
 }
 ```

 EXAMPLE 2: Optimized List
 ```swift
 List(vehicles) { vehicle in
     VehicleRow(vehicle: vehicle)
 }
 .optimizedForPerformance()
 ```

 EXAMPLE 3: Debounced Search
 ```swift
 struct SearchView: View {
     @StateObject private var search = DebouncedSearch()

     var body: some View {
         TextField("Search", text: $search.searchText)
         .onChange(of: search.debouncedText) { newValue in
             performSearch(newValue)
         }
     }
 }
 ```

 EXAMPLE 4: Lazy Loading
 ```swift
 struct MyView: View {
     @LazyLoaded var viewModel = HeavyViewModel()

     var body: some View {
         // viewModel is only created when first accessed
         Text(viewModel.data)
     }
 }
 ```

 */

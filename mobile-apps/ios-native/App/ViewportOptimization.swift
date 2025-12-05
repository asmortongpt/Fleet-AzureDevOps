//
//  ViewportOptimization.swift
//  Fleet Manager - Single Page View Optimization
//
//  Ensures all screens fit on one page without scrolling
//

import SwiftUI

// MARK: - Viewport Constants

enum ViewportConstants {
    /// iPhone screen heights (safe area)
    static let iPhoneSE: CGFloat = 568  // iPhone SE (1st gen)
    static let iPhone8: CGFloat = 667   // iPhone 8, SE (2nd/3rd gen)
    static let iPhoneX: CGFloat = 812   // iPhone X, 11 Pro, 12/13/14 mini
    static let iPhone14: CGFloat = 844  // iPhone 14, 15
    static let iPhone14Plus: CGFloat = 926  // iPhone 14/15 Plus
    static let iPhone14ProMax: CGFloat = 932  // iPhone 14/15 Pro Max

    /// Safe minimum height for all devices
    static let minSafeHeight: CGFloat = 568

    /// Maximum content height (leaves room for nav bar, tab bar)
    static let maxContentHeight: CGFloat = 500
}

// MARK: - Compact View Modifier

struct CompactViewModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .frame(maxHeight: ViewportConstants.maxContentHeight)
            .clipped()
    }
}

extension View {
    func compactView() -> some View {
        modifier(CompactViewModifier())
    }
}

// MARK: - Optimized ScrollView

struct OptimizedScrollView<Content: View>: View {
    let content: Content
    let disableScrolling: Bool

    init(disableScrolling: Bool = false, @ViewBuilder content: () -> Content) {
        self.content = content()
        self.disableScrolling = disableScrolling
    }

    var body: some View {
        GeometryReader { geometry in
            if disableScrolling || geometry.size.height >= ViewportConstants.maxContentHeight {
                // Content fits - no scrolling needed
                VStack {
                    content
                    Spacer()
                }
                .frame(maxHeight: .infinity, alignment: .top)
            } else {
                // Scrolling disabled by design - scale to fit
                content
                    .scaleEffect(calculateScale(for: geometry.size))
                    .frame(maxHeight: ViewportConstants.maxContentHeight)
            }
        }
    }

    private func calculateScale(for size: CGSize) -> CGFloat {
        let targetHeight = ViewportConstants.maxContentHeight
        if size.height < targetHeight {
            return size.height / targetHeight
        }
        return 1.0
    }
}

// MARK: - Compact Card

struct CompactCard<Content: View>: View {
    let title: String
    let content: Content
    let maxHeight: CGFloat

    init(title: String, maxHeight: CGFloat = 120, @ViewBuilder content: () -> Content) {
        self.title = title
        self.maxHeight = maxHeight
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.primary)

            content
                .frame(maxHeight: maxHeight)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 3, x: 0, y: 1)
        )
    }
}

// MARK: - Compact List Row

struct CompactListRow<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        HStack(spacing: 12) {
            content
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .frame(maxHeight: 60)
    }
}

// MARK: - Adaptive Spacing

struct AdaptiveVStack<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: calculateSpacing(for: geometry.size.height)) {
                content
            }
        }
    }

    private func calculateSpacing(for height: CGFloat) -> CGFloat {
        switch height {
        case ..<600:
            return 8
        case 600..<700:
            return 12
        case 700..<800:
            return 16
        default:
            return 20
        }
    }
}

// MARK: - Compact Font Sizes

extension Font {
    static var compactTitle: Font {
        .system(size: 20, weight: .bold)
    }

    static var compactHeadline: Font {
        .system(size: 16, weight: .semibold)
    }

    static var compactBody: Font {
        .system(size: 14)
    }

    static var compactCaption: Font {
        .system(size: 12)
    }
}

// MARK: - No-Scroll Container

struct NoScrollContainer<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                content
            }
            .frame(width: geometry.size.width, height: geometry.size.height, alignment: .top)
        }
    }
}

// MARK: - Usage Examples

/*

 EXAMPLE 1: Compact Dashboard
 ```swift
 struct CompactDashboardView: View {
     var body: some View {
         NoScrollContainer {
             VStack(spacing: 12) {
                 CompactCard(title: "Fleet Status", maxHeight: 100) {
                     HStack {
                         StatItem(label: "Active", value: "24")
                         StatItem(label: "Idle", value: "6")
                         StatItem(label: "Maintenance", value: "2")
                     }
                 }

                 CompactCard(title: "Quick Actions", maxHeight: 80) {
                     HStack {
                         LegacyQuickActionButton(icon: "car", title: "Start Trip")
                         LegacyQuickActionButton(icon: "wrench", title: "Maintenance")
                         LegacyQuickActionButton(icon: "doc.text", title: "Reports")
                     }
                 }
             }
             .padding()
         }
     }
 }
 ```

 EXAMPLE 2: Compact List
 ```swift
 struct CompactVehicleListView: View {
     var body: some View {
         NoScrollContainer {
             VStack(spacing: 0) {
                 ForEach(vehicles.prefix(6)) { vehicle in
                     CompactListRow {
                         VehicleIcon()
                         VStack(alignment: .leading, spacing: 4) {
                             Text(vehicle.name).font(.compactHeadline)
                             Text(vehicle.status).font(.compactCaption)
                         }
                         Spacer()
                         StatusBadge(status: vehicle.status)
                     }
                     Divider()
                 }
             }
         }
     }
 }
 ```

 EXAMPLE 3: Compact Form
 ```swift
 struct CompactLoginView: View {
     var body: some View {
         NoScrollContainer {
             VStack(spacing: 16) {
                 // Logo (compact)
                 Image(systemName: "car.fill")
                     .font(.system(size: 50))

                 // Form fields (compact)
                 TextField("Email", text: $email)
                     .textFieldStyle(.roundedBorder)
                     .frame(height: 44)

                 SecureField("Password", text: $password)
                     .textFieldStyle(.roundedBorder)
                     .frame(height: 44)

                 // Buttons (compact)
                 Button("Sign In") { }
                     .frame(height: 44)

                 Button("Sign in with Microsoft") { }
                     .frame(height: 44)
             }
             .padding()
         }
     }
 }
 ```

 */

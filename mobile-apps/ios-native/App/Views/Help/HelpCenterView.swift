//
//  HelpCenterView.swift
//  Fleet Management iOS App
//
//  In-app help center with searchable articles, FAQ, and support
//  WCAG 2.1 AA compliant with VoiceOver support
//

import SwiftUI

// MARK: - Help Center Main View
struct HelpCenterView: View {
    @StateObject private var viewModel = HelpCenterViewModel()
    @State private var searchText = ""
    @State private var selectedCategory: HelpCategory?
    @State private var selectedArticle: HelpArticle?
    @State private var showContactSupport = false
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                ModernTheme.Colors.groupedBackground
                    .ignoresSafeArea()

                contentView
            }
            .navigationTitle("Help Center")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                    .accessibilityLabel("Close help center")
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showContactSupport = true }) {
                        Image(systemName: "envelope.fill")
                            .foregroundColor(ModernTheme.Colors.primary)
                    }
                    .accessibilityLabel("Contact support")
                    .accessibilityHint("Double tap to email support team")
                }
            }
            .searchable(text: $searchText, prompt: "Search help articles")
            .onChange(of: searchText) { newValue in
                viewModel.searchArticles(query: newValue)
            }
            .sheet(item: $selectedArticle) { article in
                HelpArticleDetailView(article: article)
            }
            .sheet(isPresented: $showContactSupport) {
                ContactSupportView()
            }
        }
        .onAppear {
            viewModel.loadHelpContent()
        }
    }

    // MARK: - Content View

    @ViewBuilder
    private var contentView: some View {
        if searchText.isEmpty {
            mainContentView
        } else {
            searchResultsView
        }
    }

    // MARK: - Main Content View

    private var mainContentView: some View {
        ScrollView {
            VStack(spacing: ModernTheme.Spacing.xl) {
                // Quick Actions
                quickActionsSection

                // Popular Articles
                popularArticlesSection

                // Categories
                categoriesSection

                // Video Tutorials
                videoTutorialsSection

                // FAQ
                faqSection

                // Contact Support
                contactSupportBanner
            }
            .padding(.vertical, ModernTheme.Spacing.lg)
        }
    }

    // MARK: - Quick Actions Section

    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Quick Help")
                .font(ModernTheme.Typography.title2)
                .fontWeight(.bold)
                .foregroundColor(ModernTheme.Colors.primaryText)
                .padding(.horizontal, ModernTheme.Spacing.lg)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: ModernTheme.Spacing.md) {
                    QuickHelpButton(
                        title: "Getting Started",
                        icon: "play.circle.fill",
                        color: .blue
                    ) {
                        selectedArticle = viewModel.getArticle(byId: "getting-started")
                    }

                    QuickHelpButton(
                        title: "Add Vehicle",
                        icon: "plus.circle.fill",
                        color: .green
                    ) {
                        selectedArticle = viewModel.getArticle(byId: "add-vehicle")
                    }

                    QuickHelpButton(
                        title: "Track Trips",
                        icon: "location.circle.fill",
                        color: .orange
                    ) {
                        selectedArticle = viewModel.getArticle(byId: "trip-tracking")
                    }

                    QuickHelpButton(
                        title: "OBD2 Setup",
                        icon: "antenna.radiowaves.left.and.right.circle.fill",
                        color: .purple
                    ) {
                        selectedArticle = viewModel.getArticle(byId: "obd2-setup")
                    }
                }
                .padding(.horizontal, ModernTheme.Spacing.lg)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Quick help topics")
    }

    // MARK: - Popular Articles Section

    private var popularArticlesSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Label("Popular Articles", systemImage: "star.fill")
                    .font(ModernTheme.Typography.title2)
                    .fontWeight(.bold)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Spacer()
            }
            .padding(.horizontal, ModernTheme.Spacing.lg)

            VStack(spacing: ModernTheme.Spacing.sm) {
                ForEach(viewModel.popularArticles) { article in
                    HelpArticleRow(article: article)
                        .onTapGesture {
                            selectedArticle = article
                        }
                }
            }
            .padding(.horizontal, ModernTheme.Spacing.lg)
        }
    }

    // MARK: - Categories Section

    private var categoriesSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Browse by Category")
                .font(ModernTheme.Typography.title2)
                .fontWeight(.bold)
                .foregroundColor(ModernTheme.Colors.primaryText)
                .padding(.horizontal, ModernTheme.Spacing.lg)

            LazyVGrid(
                columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ],
                spacing: ModernTheme.Spacing.md
            ) {
                ForEach(HelpCategory.allCases, id: \.self) { category in
                    CategoryCard(category: category, articleCount: viewModel.getArticleCount(for: category))
                        .onTapGesture {
                            selectedCategory = category
                        }
                }
            }
            .padding(.horizontal, ModernTheme.Spacing.lg)
        }
        .sheet(item: $selectedCategory) { category in
            CategoryArticlesView(category: category, viewModel: viewModel)
        }
    }

    // MARK: - Video Tutorials Section

    private var videoTutorialsSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Label("Video Tutorials", systemImage: "play.rectangle.fill")
                    .font(ModernTheme.Typography.title2)
                    .fontWeight(.bold)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Spacer()

                Button("View All") {
                    // Navigate to full video library
                }
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.primary)
            }
            .padding(.horizontal, ModernTheme.Spacing.lg)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: ModernTheme.Spacing.md) {
                    ForEach(viewModel.videoTutorials) { video in
                        VideoTutorialCard(video: video)
                    }
                }
                .padding(.horizontal, ModernTheme.Spacing.lg)
            }
        }
    }

    // MARK: - FAQ Section

    private var faqSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Label("Frequently Asked Questions", systemImage: "questionmark.circle.fill")
                    .font(ModernTheme.Typography.title2)
                    .fontWeight(.bold)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Spacer()

                NavigationLink(destination: FullFAQView(viewModel: viewModel)) {
                    Text("View All")
                        .font(ModernTheme.Typography.subheadline)
                        .foregroundColor(ModernTheme.Colors.primary)
                }
            }
            .padding(.horizontal, ModernTheme.Spacing.lg)

            VStack(spacing: ModernTheme.Spacing.sm) {
                ForEach(viewModel.topFAQs) { faq in
                    FAQRow(faq: faq)
                }
            }
            .padding(.horizontal, ModernTheme.Spacing.lg)
        }
    }

    // MARK: - Contact Support Banner

    private var contactSupportBanner: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Image(systemName: "bubble.left.and.bubble.right.fill")
                .font(.system(size: 50))
                .foregroundColor(ModernTheme.Colors.primary)

            Text("Still need help?")
                .font(ModernTheme.Typography.title3)
                .fontWeight(.semibold)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text("Our support team is here to assist you")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)

            Button(action: { showContactSupport = true }) {
                Text("Contact Support")
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(ModernTheme.Colors.primary)
                    .cornerRadius(ModernTheme.CornerRadius.md)
            }
        }
        .padding(ModernTheme.Spacing.xl)
        .background(Color(.systemBackground))
        .cornerRadius(ModernTheme.CornerRadius.lg)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        .padding(.horizontal, ModernTheme.Spacing.lg)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Need more help? Contact our support team")
        .accessibilityAddTraits(.isButton)
    }

    // MARK: - Search Results View

    private var searchResultsView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                Text("\(viewModel.searchResults.count) results for '\(searchText)'")
                    .font(ModernTheme.Typography.subheadline)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .padding(.horizontal, ModernTheme.Spacing.lg)

                if viewModel.searchResults.isEmpty {
                    emptySearchView
                } else {
                    VStack(spacing: ModernTheme.Spacing.sm) {
                        ForEach(viewModel.searchResults) { article in
                            HelpArticleRow(article: article, highlightTerm: searchText)
                                .onTapGesture {
                                    selectedArticle = article
                                }
                        }
                    }
                    .padding(.horizontal, ModernTheme.Spacing.lg)
                }
            }
            .padding(.vertical, ModernTheme.Spacing.lg)
        }
    }

    private var emptySearchView: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("No results found")
                .font(ModernTheme.Typography.title3)
                .fontWeight(.semibold)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text("Try different keywords or browse categories below")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, ModernTheme.Spacing.xxxl)
    }
}

// MARK: - Quick Help Button

struct QuickHelpButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: ModernTheme.Spacing.sm) {
                Image(systemName: icon)
                    .font(.title)
                    .foregroundColor(color)

                Text(title)
                    .font(ModernTheme.Typography.caption1)
                    .fontWeight(.medium)
                    .foregroundColor(ModernTheme.Colors.primaryText)
                    .multilineTextAlignment(.center)
            }
            .frame(width: 100, height: 100)
            .background(color.opacity(0.1))
            .cornerRadius(ModernTheme.CornerRadius.md)
            .overlay(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .stroke(color.opacity(0.3), lineWidth: 1)
            )
        }
        .accessibilityLabel(title)
        .accessibilityHint("Double tap to view article")
    }
}

// MARK: - Category Card

struct CategoryCard: View {
    let category: HelpCategory
    let articleCount: Int

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Image(systemName: category.icon)
                    .font(.title2)
                    .foregroundColor(category.color)

                Spacer()

                Text("\(articleCount)")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            Text(category.title)
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text(category.description)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .lineLimit(2)
        }
        .padding(ModernTheme.Spacing.md)
        .background(Color(.systemBackground))
        .cornerRadius(ModernTheme.CornerRadius.md)
        .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(category.title), \(articleCount) articles")
        .accessibilityAddTraits(.isButton)
    }
}

// MARK: - Help Article Row

struct HelpArticleRow: View {
    let article: HelpArticle
    var highlightTerm: String = ""

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            Image(systemName: article.icon)
                .font(.title3)
                .foregroundColor(article.category.color)
                .frame(width: 40, height: 40)
                .background(article.category.color.opacity(0.1))
                .cornerRadius(ModernTheme.CornerRadius.sm)

            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xxs) {
                Text(article.title)
                    .font(ModernTheme.Typography.body)
                    .fontWeight(.medium)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Text(article.summary)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .lineLimit(2)

                if !article.tags.isEmpty {
                    HStack(spacing: ModernTheme.Spacing.xs) {
                        ForEach(article.tags.prefix(2), id: \.self) { tag in
                            Text(tag)
                                .font(.system(size: 10))
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color(.systemGray5))
                                .cornerRadius(4)
                        }
                    }
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .padding(ModernTheme.Spacing.md)
        .background(Color(.systemBackground))
        .cornerRadius(ModernTheme.CornerRadius.md)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(article.title). \(article.summary)")
        .accessibilityAddTraits(.isButton)
    }
}

// MARK: - Video Tutorial Card

struct VideoTutorialCard: View {
    let video: VideoTutorial

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            ZStack {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.8)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 200, height: 112)
                    .cornerRadius(ModernTheme.CornerRadius.md)

                VStack(spacing: ModernTheme.Spacing.xs) {
                    Image(systemName: "play.circle.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.white)

                    Text(video.duration)
                        .font(ModernTheme.Typography.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                }
            }

            Text(video.title)
                .font(ModernTheme.Typography.subheadline)
                .fontWeight(.medium)
                .foregroundColor(ModernTheme.Colors.primaryText)
                .lineLimit(2)
                .frame(width: 200, alignment: .leading)

            Text(video.description)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .lineLimit(2)
                .frame(width: 200, alignment: .leading)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(video.title). Duration: \(video.duration)")
        .accessibilityAddTraits(.isButton)
    }
}

// MARK: - FAQ Row

struct FAQRow: View {
    let faq: FAQ
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Button(action: {
                withAnimation(.spring()) {
                    isExpanded.toggle()
                }
            }) {
                HStack(alignment: .top) {
                    Text(faq.question)
                        .font(ModernTheme.Typography.body)
                        .fontWeight(.medium)
                        .foregroundColor(ModernTheme.Colors.primaryText)
                        .multilineTextAlignment(.leading)

                    Spacer()

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            if isExpanded {
                Text(faq.answer)
                    .font(ModernTheme.Typography.subheadline)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .transition(.opacity)
            }
        }
        .padding(ModernTheme.Spacing.md)
        .background(Color(.systemBackground))
        .cornerRadius(ModernTheme.CornerRadius.md)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(faq.question)
        .accessibilityHint(isExpanded ? "Double tap to collapse answer" : "Double tap to expand answer")
        .accessibilityAddTraits(.isButton)
    }
}

// MARK: - Help Center View Model

class HelpCenterViewModel: ObservableObject {
    @Published var popularArticles: [HelpArticle] = []
    @Published var searchResults: [HelpArticle] = []
    @Published var topFAQs: [FAQ] = []
    @Published var videoTutorials: [VideoTutorial] = []

    private var allArticles: [HelpArticle] = []
    private var allFAQs: [FAQ] = []

    func loadHelpContent() {
        loadArticles()
        loadFAQs()
        loadVideoTutorials()
    }

    func searchArticles(query: String) {
        if query.isEmpty {
            searchResults = []
            return
        }

        searchResults = allArticles.filter { article in
            article.title.localizedCaseInsensitiveContains(query) ||
            article.summary.localizedCaseInsensitiveContains(query) ||
            article.content.localizedCaseInsensitiveContains(query) ||
            article.tags.contains(where: { $0.localizedCaseInsensitiveContains(query) })
        }
    }

    func getArticleCount(for category: HelpCategory) -> Int {
        allArticles.filter { $0.category == category }.count
    }

    func getArticle(byId id: String) -> HelpArticle? {
        allArticles.first { $0.id == id }
    }

    private func loadArticles() {
        // Load help articles (in production, load from JSON or API)
        allArticles = HelpArticle.sampleArticles
        popularArticles = Array(allArticles.filter { $0.isPopular }.prefix(5))
    }

    private func loadFAQs() {
        allFAQs = FAQ.sampleFAQs
        topFAQs = Array(allFAQs.prefix(5))
    }

    private func loadVideoTutorials() {
        videoTutorials = VideoTutorial.sampleTutorials
    }
}

// MARK: - Models

enum HelpCategory: String, CaseIterable, Identifiable {
    case gettingStarted = "Getting Started"
    case vehicles = "Vehicles"
    case trips = "Trips"
    case maintenance = "Maintenance"
    case inspections = "Inspections"
    case obd2 = "OBD2 Diagnostics"
    case settings = "Settings"
    case troubleshooting = "Troubleshooting"

    var id: String { rawValue }

    var title: String { rawValue }

    var description: String {
        switch self {
        case .gettingStarted:
            return "Learn the basics and get started quickly"
        case .vehicles:
            return "Add, manage, and track your fleet"
        case .trips:
            return "Track journeys and analyze routes"
        case .maintenance:
            return "Schedule and manage vehicle service"
        case .inspections:
            return "Conduct thorough vehicle inspections"
        case .obd2:
            return "Connect and interpret diagnostic data"
        case .settings:
            return "Customize app preferences"
        case .troubleshooting:
            return "Solve common issues"
        }
    }

    var icon: String {
        switch self {
        case .gettingStarted:
            return "play.circle.fill"
        case .vehicles:
            return "car.fill"
        case .trips:
            return "map.fill"
        case .maintenance:
            return "wrench.and.screwdriver.fill"
        case .inspections:
            return "checkmark.seal.fill"
        case .obd2:
            return "antenna.radiowaves.left.and.right"
        case .settings:
            return "gearshape.fill"
        case .troubleshooting:
            return "exclamationmark.triangle.fill"
        }
    }

    var color: Color {
        switch self {
        case .gettingStarted:
            return .blue
        case .vehicles:
            return .green
        case .trips:
            return .orange
        case .maintenance:
            return .purple
        case .inspections:
            return .cyan
        case .obd2:
            return .indigo
        case .settings:
            return .gray
        case .troubleshooting:
            return .red
        }
    }
}

struct HelpArticle: Identifiable {
    let id: String
    let category: HelpCategory
    let title: String
    let summary: String
    let content: String
    let icon: String
    let tags: [String]
    let isPopular: Bool

    static let sampleArticles: [HelpArticle] = [
        HelpArticle(
            id: "getting-started",
            category: .gettingStarted,
            title: "Getting Started with Fleet Management",
            summary: "Learn how to set up your account and add your first vehicle",
            content: "Welcome to Fleet Management! This guide will help you get started...",
            icon: "play.circle.fill",
            tags: ["setup", "account", "beginner"],
            isPopular: true
        ),
        HelpArticle(
            id: "add-vehicle",
            category: .vehicles,
            title: "How to Add a Vehicle",
            summary: "Step-by-step guide to adding vehicles to your fleet",
            content: "Adding a vehicle is easy. Tap 'Add Vehicle' from the dashboard...",
            icon: "plus.circle.fill",
            tags: ["vehicle", "add", "setup"],
            isPopular: true
        ),
        HelpArticle(
            id: "trip-tracking",
            category: .trips,
            title: "Trip Tracking Basics",
            summary: "Start, pause, and stop trips with GPS tracking",
            content: "Trip tracking helps you monitor vehicle usage...",
            icon: "location.circle.fill",
            tags: ["trip", "GPS", "tracking"],
            isPopular: true
        ),
        HelpArticle(
            id: "obd2-setup",
            category: .obd2,
            title: "Connecting Your OBD2 Adapter",
            summary: "Set up and connect Bluetooth OBD2 adapters",
            content: "OBD2 provides real-time diagnostic data...",
            icon: "antenna.radiowaves.left.and.right",
            tags: ["OBD2", "Bluetooth", "diagnostics"],
            isPopular: true
        ),
        HelpArticle(
            id: "maintenance-schedule",
            category: .maintenance,
            title: "Scheduling Maintenance",
            summary: "Create and manage maintenance schedules",
            content: "Stay on top of vehicle maintenance with scheduling...",
            icon: "calendar",
            tags: ["maintenance", "schedule", "service"],
            isPopular: true
        )
    ]
}

struct FAQ: Identifiable {
    let id = UUID()
    let question: String
    let answer: String
    let category: HelpCategory

    static let sampleFAQs: [FAQ] = [
        FAQ(
            question: "How do I reset my password?",
            answer: "On the login screen, tap 'Forgot Password' and enter your email. You'll receive a reset link via email.",
            category: .gettingStarted
        ),
        FAQ(
            question: "Does the app work offline?",
            answer: "Yes! The app works fully offline. All data is cached locally and syncs when you reconnect to the internet.",
            category: .gettingStarted
        ),
        FAQ(
            question: "How accurate is GPS tracking?",
            answer: "GPS accuracy is typically within 30 feet. Distance calculations are accurate within 1-2% compared to odometer readings.",
            category: .trips
        ),
        FAQ(
            question: "Which OBD2 adapters are compatible?",
            answer: "The app works with Bluetooth OBD2 adapters using the ELM327 protocol. We recommend BAFX, BlueDriver, or Veepeak adapters.",
            category: .obd2
        ),
        FAQ(
            question: "How do I export trip data?",
            answer: "Open any trip and tap the Share button. You can export as PDF, CSV, or GPX format.",
            category: .trips
        )
    ]
}

struct VideoTutorial: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let duration: String
    let url: String

    static let sampleTutorials: [VideoTutorial] = [
        VideoTutorial(
            title: "Getting Started",
            description: "Set up your account and add your first vehicle",
            duration: "2:00",
            url: "https://www.youtube.com/watch?v=example1"
        ),
        VideoTutorial(
            title: "Vehicle Setup & OBD2",
            description: "Connect OBD2 and view diagnostics",
            duration: "3:00",
            url: "https://www.youtube.com/watch?v=example2"
        ),
        VideoTutorial(
            title: "Trip Tracking",
            description: "Track trips and view history",
            duration: "2:00",
            url: "https://www.youtube.com/watch?v=example3"
        ),
        VideoTutorial(
            title: "Vehicle Inspections",
            description: "Conduct thorough inspections with photos",
            duration: "3:00",
            url: "https://www.youtube.com/watch?v=example4"
        ),
        VideoTutorial(
            title: "Maintenance Management",
            description: "Schedule and track maintenance",
            duration: "2:00",
            url: "https://www.youtube.com/watch?v=example5"
        )
    ]
}

// MARK: - Supporting Views

struct HelpArticleDetailView: View {
    let article: HelpArticle
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.lg) {
                    Text(article.content)
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.primaryText)
                }
                .padding(ModernTheme.Spacing.lg)
            }
            .navigationTitle(article.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct CategoryArticlesView: View {
    let category: HelpCategory
    @ObservedObject var viewModel: HelpCenterViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            List {
                // Implementation for category-specific articles
            }
            .navigationTitle(category.title)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct FullFAQView: View {
    @ObservedObject var viewModel: HelpCenterViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        List {
            // Implementation for full FAQ list
        }
        .navigationTitle("Frequently Asked Questions")
    }
}

struct ContactSupportView: View {
    @Environment(\.dismiss) var dismiss
    @State private var subject = ""
    @State private var message = ""
    @State private var email = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Contact Information")) {
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }

                Section(header: Text("Issue Details")) {
                    TextField("Subject", text: $subject)

                    TextEditor(text: $message)
                        .frame(height: 150)
                }

                Section {
                    Button("Send Message") {
                        // Send support request
                        dismiss()
                    }
                    .disabled(email.isEmpty || subject.isEmpty || message.isEmpty)
                }
            }
            .navigationTitle("Contact Support")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview

struct HelpCenterView_Previews: PreviewProvider {
    static var previews: some View {
        HelpCenterView()
    }
}

import SwiftUI

/// EmptyStateCard - Reusable component for displaying empty states
struct EmptyStateCard: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text(title)
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text(message)
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(ModernTheme.Spacing.xl)
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.lg)
    }
}

#Preview {
    EmptyStateCard(
        icon: "tray.fill",
        title: "No Data",
        message: "There's nothing to display at the moment."
    )
    .padding()
}

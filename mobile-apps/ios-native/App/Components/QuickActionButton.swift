import SwiftUI

/// QuickActionButton - Reusable button component for dashboard quick actions
struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: ModernTheme.Spacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)

                Text(title)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(ModernTheme.Spacing.md)
            .background(ModernTheme.Colors.secondaryBackground)
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    QuickActionButton(title: "Start Trip", icon: "play.circle.fill", color: .green) {
        print("Action tapped")
    }
    .padding()
}

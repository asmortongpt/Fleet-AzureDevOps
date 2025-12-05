import SwiftUI

// MARK: - Quick Action Button Component
struct LegacyQuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    init(icon: String, title: String, color: Color = .blue, action: @escaping () -> Void) {
        self.icon = icon
        self.title = title
        self.color = color
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 28))
                    .foregroundColor(.white)
                    .frame(width: 60, height: 60)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [color, color.opacity(0.7)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .cornerRadius(16)
                    .shadow(color: color.opacity(0.3), radius: 8, x: 0, y: 4)

                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(width: 80)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

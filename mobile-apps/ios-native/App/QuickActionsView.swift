import SwiftUI

// MARK: - Quick Actions View
struct QuickActionsView: View {
    // MARK: - Properties
    let onActionTap: (QuickActionType) -> Void

    // MARK: - Body
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Section Header
            Text("Quick Actions")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.primary)
                .accessibilityAddTraits(.isHeader)

            // Action Buttons - Simplified to avoid redeclaration issues
            VStack(spacing: 12) {
                ForEach(QuickActionType.allCases, id: \.self) { action in
                    Button(action: { onActionTap(action) }) {
                        HStack(spacing: 16) {
                            Image(systemName: action.icon)
                                .font(.system(size: 24, weight: .semibold))
                                .foregroundColor(.blue)
                                .frame(width: 48, height: 48)

                            Text(action.title)
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundColor(.primary)
                                .frame(maxWidth: .infinity, alignment: .leading)

                            Image(systemName: "chevron.right")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
    }
}

// MARK: - Preview
struct QuickActionsView_Previews: PreviewProvider {
    static var previews: some View {
        QuickActionsView { action in
            print("Action tapped: \(action.rawValue)")
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}

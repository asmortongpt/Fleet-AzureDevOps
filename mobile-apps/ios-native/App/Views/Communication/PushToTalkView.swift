import SwiftUI

/// Push-to-Talk (PTT) View - Stub implementation for initial build
struct PushToTalkView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                Image(systemName: "mic.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.blue)

                Text("Push-to-Talk")
                    .font(.title)
                    .fontWeight(.bold)

                Text("Feature coming soon")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()

                // PTT Button Placeholder
                Button(action: {
                    // Placeholder action
                }) {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 150, height: 150)
                        .overlay(
                            VStack(spacing: 8) {
                                Image(systemName: "mic.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(.white)
                                Text("Press to Talk")
                                    .font(.caption)
                                    .foregroundColor(.white)
                            }
                        )
                }
                .disabled(true)

                Spacer()
            }
            .padding()
            .navigationTitle("Push-to-Talk")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    PushToTalkView()
}

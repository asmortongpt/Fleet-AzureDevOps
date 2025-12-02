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

                Text("Radio communication system")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()

                // PTT Status
                HStack(spacing: 8) {
                    Circle()
                        .fill(Color.gray)
                        .frame(width: 8, height: 8)
                    Text("Not Connected")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.bottom, 20)

                // PTT Button
                Button(action: {
                    // PTT action - requires radio hardware integration
                }) {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 150, height: 150)
                        .overlay(
                            VStack(spacing: 8) {
                                Image(systemName: "mic.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(.gray)
                                Text("Press to Talk")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                        )
                }
                .disabled(true)

                Text("Requires radio hardware connection")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 10)

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

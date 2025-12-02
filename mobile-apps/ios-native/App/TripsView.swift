import SwiftUI

// MARK: - Simple Trips View Stub
struct TripsView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "map.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)

                Text("Trips & Routes")
                    .font(.title.bold())

                Text("Track vehicle trips and analyze routes")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                Button("Start New Trip") {
                    // TODO: Navigate to trip creation
                }
                .buttonStyle(.borderedProminent)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .navigationTitle("Trips")
        }
    }
}

#if DEBUG
struct TripsView_Previews: PreviewProvider {
    static var previews: some View {
        TripsView()
    }
}
#endif

import SwiftUI

struct DriverManagementView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "person.3.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.green)

                Text("Driver Management")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text("Manage fleet drivers and assignments")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()

                Text("Coming Soon")
                    .font(.title2)
                    .foregroundColor(.gray)

                Spacer()
            }
            .padding()
            .navigationTitle("Drivers")
        }
    }
}

#if DEBUG
struct DriverManagementView_Previews: PreviewProvider {
    static var previews: some View {
        DriverManagementView()
    }
}
#endif

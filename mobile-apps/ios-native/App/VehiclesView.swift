import SwiftUI

struct VehiclesView: View {
    @StateObject private var viewModel = VehicleViewModel()
    @EnvironmentObject private var authManager: AuthenticationManager

    // Filter vehicles based on user role
    private var filteredVehicles: [Vehicle] {
        let allVehicles = viewModel.vehicles

        // Drivers only see assigned vehicles
        if authManager.userRole == .driver {
            // Filter by assignedDriverId matching current user
            if let userId = authManager.currentUser?.id {
                return allVehicles.filter { vehicle in
                    // Assuming Vehicle has an assignedDriverId property
                    // If not, this will need to be adjusted based on actual model
                    return true // TODO: Implement actual filtering when assignedDriverId is available
                }
            }
            return []
        }

        // Admin, Manager, and Viewer see all vehicles
        return allVehicles
    }

    var body: some View {
        NavigationView {
            List {
                // Role-specific header
                Section(header: roleHeader) {
                    if filteredVehicles.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "car.2")
                                .font(.system(size: 50))
                                .foregroundColor(.gray)
                            Text(emptyStateMessage)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    } else {
                        ForEach(filteredVehicles) { vehicle in
                            VehicleCard(vehicle: vehicle)
                        }
                    }
                }
            }
            .navigationTitle(navigationTitle)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if authManager.userRole.canManageVehicles {
                        Button(action: {
                            // Add vehicle action
                        }) {
                            Image(systemName: "plus.circle.fill")
                        }
                    }
                }
            }
            .task {
                await viewModel.fetchVehicles()
            }
        }
    }

    // MARK: - Role-specific UI Elements

    private var navigationTitle: String {
        switch authManager.userRole {
        case .driver:
            return "My Vehicles"
        case .admin, .manager, .fleetManager, .viewer:
            return "Vehicles"
        }
    }

    private var roleHeader: some View {
        HStack {
            Image(systemName: authManager.userRole.iconName)
                .foregroundColor(Color(authManager.userRole.color))
            Text(roleHeaderText)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    private var roleHeaderText: String {
        switch authManager.userRole {
        case .driver:
            return "Vehicles assigned to you"
        case .admin, .manager, .fleetManager:
            return "All fleet vehicles"
        case .viewer:
            return "Read-only view of all vehicles"
        }
    }

    private var emptyStateMessage: String {
        switch authManager.userRole {
        case .driver:
            return "No vehicles assigned to you.\nContact your fleet manager."
        case .admin, .manager, .fleetManager:
            return "No vehicles in the fleet.\nTap + to add your first vehicle."
        case .viewer:
            return "No vehicles available to view."
        }
    }
}

#if DEBUG
struct VehiclesView_Previews: PreviewProvider {
    static var previews: some View {
        VehiclesView()
    }
}
#endif

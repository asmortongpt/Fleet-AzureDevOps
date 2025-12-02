import SwiftUI

// Main Fleet Management App View
// This view serves as a wrapper for the root navigation structure
struct FleetManagementAppView: View {
    @StateObject private var navigationCoordinator = NavigationCoordinator()
    // Note: Network manager functionality is integrated into APIConfiguration
    // @StateObject private var networkManager = AzureNetworkManager()

    var body: some View {
        RootView()
            .environmentObject(navigationCoordinator)
            // .environmentObject(networkManager)
    }
}

#if DEBUG
struct FleetManagementAppView_Previews: PreviewProvider {
    static var previews: some View {
        FleetManagementAppView()
    }
}
#endif

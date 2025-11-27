t
//
//  DriverListView.swift
//  Fleet Manager
//
//  Shows a list of drivers with their profiles and performance metrics
//

import SwiftUI
import Combine

// MARK: - Driver Model
struct Driver: Identifiable {
    let id: UUID
    let name: String
    let profileImage: UIImage
    let performanceMetrics: PerformanceMetrics
}

struct PerformanceMetrics {
    let tripsCompleted: Int
    let alertsReceived: Int
    let incidentsReported: Int
}

// MARK: - ViewModel
class DriverListViewModel: ObservableObject {
    @Published var drivers = [Driver]()
    // TODO: Replace with real data source
    private var dataSource: AnyPublisher<[Driver], Never> = Just([Driver.example]).eraseToAnyPublisher()
    private var cancellables = Set<AnyCancellable>()

    init() {
        dataSource
            .receive(on: DispatchQueue.main)
            .sink { [weak self] receivedDrivers in
                self?.drivers = receivedDrivers
            }
            .store(in: &cancellables)
    }
}

// MARK: - View
struct DriverListView: View {
    @StateObject private var viewModel = DriverListViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.drivers) { driver in
                    DriverCard(driver: driver)
                }
            }
            .navigationTitle("Drivers")
        }
    }
}

// MARK: - Driver Card View
struct DriverCard: View {
    let driver: Driver

    var body: some View {
        HStack {
            Image(uiImage: driver.profileImage)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 60, height: 60)
                .clipShape(Circle())
            VStack(alignment: .leading) {
                Text(driver.name)
                    .font(.headline)
                Text("Trips Completed: \(driver.performanceMetrics.tripsCompleted)")
                Text("Alerts Received: \(driver.performanceMetrics.alertsReceived)")
                Text("Incidents Reported: \(driver.performanceMetrics.incidentsReported)")
            }
            Spacer()
        }
        .padding()
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(driver.name), Trips Completed: \(driver.performanceMetrics.tripsCompleted), Alerts Received: \(driver.performanceMetrics.alertsReceived), Incidents Reported: \(driver.performanceMetrics.incidentsReported)")
    }
}

// MARK: - Preview
#if DEBUG
struct DriverListView_Previews: PreviewProvider {
    static var previews: some View {
        DriverListView()
    }
}
#endif
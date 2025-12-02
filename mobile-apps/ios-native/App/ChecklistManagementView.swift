//
//  ChecklistManagementView.swift
//  Fleet Manager
//
//  Checklist Management Interface
//

import SwiftUI

struct ChecklistManagementView: View {
    @StateObject private var viewModel = ChecklistViewModel()

    var body: some View {
        List {
            Section(header: Text("Pending Checklists")) {
                if viewModel.pendingChecklists.isEmpty {
                    Text("No pending checklists")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(viewModel.pendingChecklists) { checklist in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(checklist.templateName)
                                    .font(.headline)
                                Text(checklist.driverName)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            Text(checklist.status.rawValue)
                                .font(.caption)
                                .foregroundColor(.blue)
                        }
                    }
                }
            }

            Section(header: Text("Completed Checklists")) {
                if viewModel.completedChecklists.isEmpty {
                    Text("No completed checklists")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(viewModel.completedChecklists) { checklist in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(checklist.templateName)
                                    .font(.headline)
                                Text(checklist.driverName)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            Text(checklist.status.rawValue)
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                    }
                }
            }
        }
        .navigationTitle("Checklists")
        .onAppear {
            Task {
                await viewModel.loadChecklists()
            }
        }
    }
}

#Preview {
    NavigationView {
        ChecklistManagementView()
    }
}

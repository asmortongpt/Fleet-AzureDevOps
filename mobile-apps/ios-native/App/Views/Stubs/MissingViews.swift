/**
 * Missing View Stubs
 * Placeholder views for features not yet implemented
 */

import SwiftUI

// MARK: - Personal Use Dashboard
struct PersonalUseDashboardView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.crop.circle")
                .font(.system(size: 60))
                .foregroundColor(.blue)

            Text("Personal Use Dashboard")
                .font(.title)

            Text("Track your personal vehicle usage and mileage")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .navigationTitle("Personal Use")
    }
}

// MARK: - Reimbursement Queue
struct ReimbursementQueueView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "dollarsign.circle")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("Reimbursement Queue")
                .font(.title)

            Text("Manage and track reimbursement requests")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .navigationTitle("Reimbursements")
    }
}

// MARK: - Help Center
struct HelpCenterView: View {
    var body: some View {
        List {
            Section("Getting Started") {
                NavigationLink("Quick Start Guide") {
                    Text("Quick start guide content")
                }
                NavigationLink("Video Tutorials") {
                    Text("Video tutorials")
                }
            }

            Section("Common Questions") {
                NavigationLink("How to log a trip") {
                    Text("Trip logging help")
                }
                NavigationLink("Reporting issues") {
                    Text("Issue reporting help")
                }
                NavigationLink("Vehicle reservations") {
                    Text("Reservation help")
                }
            }

            Section("Contact Support") {
                Link("Email Support", destination: URL(string: "mailto:support@fleet.com")!)
                Link("Call Support", destination: URL(string: "tel:1-800-FLEET-01")!)
            }
        }
        .navigationTitle("Help Center")
    }
}

// MARK: - Support Ticket
struct SupportTicketView: View {
    @State private var subject = ""
    @State private var description = ""
    @State private var priority = "Normal"
    @Environment(\.dismiss) private var dismiss

    let priorities = ["Low", "Normal", "High", "Urgent"]

    var body: some View {
        Form {
            Section("Ticket Details") {
                TextField("Subject", text: $subject)

                Picker("Priority", selection: $priority) {
                    ForEach(priorities, id: \.self) { priority in
                        Text(priority).tag(priority)
                    }
                }

                TextEditor(text: $description)
                    .frame(height: 150)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                    )
            }

            Section {
                Button("Submit Ticket") {
                    submitTicket()
                }
                .frame(maxWidth: .infinity)
                .disabled(subject.isEmpty || description.isEmpty)
            }
        }
        .navigationTitle("New Support Ticket")
    }

    private func submitTicket() {
        // Submit ticket logic here
        print("Submitting ticket: \(subject)")
        dismiss()
    }
}

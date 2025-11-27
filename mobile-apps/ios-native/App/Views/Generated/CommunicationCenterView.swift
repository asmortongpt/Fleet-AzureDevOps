t
//
//  CommunicationCenterView.swift
//  Fleet Manager
//
//  Communication center for team messages and notifications
//

import SwiftUI

// Message Model
struct Message: Identifiable {
    let id = UUID()
    let timestamp: Date
    let sender: String
    let content: String
}

// ViewModel
class CommunicationCenterViewModel: ObservableObject {
    @Published var messages = [Message]()
    @Published var isLoading = false
    @Published var error: Error?
    
    // Fetch messages from backend 
    func fetchMessages() {
        // Implement backend call here with proper input validation and parameterized queries
        // Upon successful completion, assign result to self.messages
        // In case of error, assign error to self.error
        // Use isLoading to manage loading state
    }
}

struct CommunicationCenterView: View {
    @StateObject private var viewModel = CommunicationCenterViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.messages) { message in
                    MessageCard(message: message)
                }
            }
            .navigationTitle("Communication Center")
            .onAppear(perform: viewModel.fetchMessages)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: viewModel.fetchMessages) {
                        Image(systemName: "arrow.clockwise")
                            .accessibilityLabel("Refresh messages")
                    }
                }
            }
        }
        .alert(isPresented: Binding<Bool>.constant(viewModel.error != nil)) {
            Alert(title: Text("Error"),
                  message: Text(viewModel.error?.localizedDescription ?? "Unknown"),
                  dismissButton: .default(Text("OK")))
        }
        .overlay(
            Group {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
        )
    }
}

struct MessageCard: View {
    let message: Message

    var body: some View {
        VStack(alignment: .leading) {
            Text(message.sender)
                .font(.headline)
            Text(message.content)
                .font(.subheadline)
            Text("\(message.timestamp)")
                .font(.caption)
                .foregroundColor(.gray)
        }
    }
}

#if DEBUG
struct CommunicationCenterView_Previews: PreviewProvider {
    static var previews: some View {
        CommunicationCenterView()
    }
}
#endif
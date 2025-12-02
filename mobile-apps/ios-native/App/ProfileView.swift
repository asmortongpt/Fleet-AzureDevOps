import SwiftUI

struct ProfileView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile Header
                    VStack(spacing: 12) {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.blue)

                        Text("Driver Profile")
                            .font(.title)
                            .fontWeight(.bold)

                        Text("View and manage your profile information")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 20)

                    // Profile Information Section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Personal Information")
                            .font(.headline)
                            .padding(.horizontal)

                        VStack(spacing: 0) {
                            ProfileRow(icon: "person", label: "Name", value: "Driver Name")
                            Divider()
                            ProfileRow(icon: "envelope", label: "Email", value: "driver@example.com")
                            Divider()
                            ProfileRow(icon: "phone", label: "Phone", value: "+1 (555) 123-4567")
                            Divider()
                            ProfileRow(icon: "briefcase", label: "License", value: "DL-123456")
                        }
                        .background(Color(.systemBackground))
                        .cornerRadius(10)
                        .padding(.horizontal)
                    }

                    Spacer()
                }
            }
            .navigationTitle("Profile")
        }
    }
}

struct ProfileRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.body)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

#if DEBUG
struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
    }
}
#endif

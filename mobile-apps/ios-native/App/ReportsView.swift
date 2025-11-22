import SwiftUI

struct ReportsView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 12) {
                        Image(systemName: "doc.text.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.purple)

                        Text("Fleet Reports")
                            .font(.largeTitle)
                            .fontWeight(.bold)

                        Text("Analytics and reporting for fleet operations")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 20)

                    // Report Categories
                    VStack(spacing: 16) {
                        ReportCard(
                            icon: "car.2.fill",
                            title: "Vehicle Reports",
                            description: "Fleet status, utilization, and efficiency",
                            color: .blue
                        )

                        ReportCard(
                            icon: "person.3.fill",
                            title: "Driver Reports",
                            description: "Performance, hours, and compliance",
                            color: .green
                        )

                        ReportCard(
                            icon: "wrench.and.screwdriver.fill",
                            title: "Maintenance Reports",
                            description: "Service history and upcoming maintenance",
                            color: .orange
                        )

                        ReportCard(
                            icon: "dollarsign.circle.fill",
                            title: "Financial Reports",
                            description: "Costs, expenses, and budget analysis",
                            color: .red
                        )

                        ReportCard(
                            icon: "chart.line.uptrend.xyaxis",
                            title: "Analytics Dashboard",
                            description: "Real-time metrics and trends",
                            color: .purple
                        )
                    }
                    .padding(.horizontal)

                    // Coming Soon Notice
                    VStack(spacing: 12) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.secondary)

                        Text("Advanced Reporting Coming Soon")
                            .font(.headline)
                            .foregroundColor(.secondary)

                        Text("Export to PDF, schedule reports, and more")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    .padding(.top, 20)

                    Spacer()
                }
            }
            .navigationTitle("Reports")
        }
    }
}

struct ReportCard: View {
    let icon: String
    let title: String
    let description: String
    let color: Color

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundColor(.white)
                .frame(width: 60, height: 60)
                .background(color)
                .cornerRadius(12)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

#if DEBUG
struct ReportsView_Previews: PreviewProvider {
    static var previews: some View {
        ReportsView()
    }
}
#endif

import SwiftUI

struct ShiftManagementView: View {
    @StateObject private var viewModel = ShiftManagementViewModel()
    @State private var showingCreateShift = false
    @State private var showingClockInOut = false
    @State private var showingSwapRequests = false
    @State private var showingReport = false
    @State private var selectedShift: Shift?

    var body: some View {
        NavigationView {
            ZStack {
                VStack(spacing: 0) {
                        }
}

}

// MARK: - Break Entry Row
struct BreakEntryRow: View {
    let breakEntry: BreakEntry

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(breakEntry.type.displayName)
                    .font(.caption)
                    .bold()

                Text(timeFormatter.string(from: breakEntry.startTime))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(breakEntry.formattedDuration)
                    .font(.caption)
                    .bold()

                Text(breakEntry.isPaid ? "Paid" : "Unpaid")
                    .font(.caption2)
                    .foregroundColor(breakEntry.isPaid ? .green : .orange)
            }
        }
        .padding(.vertical, 4)
    }

    private let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }()
}

// MARK: - Preview
struct ShiftManagementView_Previews: PreviewProvider {
    static var previews: some View {
        ShiftManagementView()
    }
}

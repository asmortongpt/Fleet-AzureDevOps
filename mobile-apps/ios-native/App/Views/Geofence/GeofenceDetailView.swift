) {
            VStack(spacing: ModernTheme.Spacing.xs) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)

                Text(label)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.primaryText)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, ModernTheme.Spacing.md)
            .background(color.opacity(0.1))
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
    }
}

}

// MARK: - Error State View
struct ErrorStateView: View {
    let message: String

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.warning)

            Text("Error")
                .font(ModernTheme.Typography.title2)

            Text(message)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
    }
}

// MARK: - Preview
#if DEBUG
struct GeofenceDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            GeofenceDetailView(geofenceId: "GEO-001")
                .environmentObject(NavigationCoordinator())
        }
    }
}
#endif

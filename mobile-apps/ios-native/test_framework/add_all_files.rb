#!/usr/bin/env ruby
# Add all missing Swift files to Xcode project using xcodeproj gem

require 'xcodeproj'

# Path to project
project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
workspace_root = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native'

# Files to add (from diagnostic report)
files_to_add = [
  'App/TripTrackingView.swift',
  'App/OBD2DiagnosticsView.swift',
  'App/BuildConfiguration.swift',
  'App/ConflictResolver.swift',
  'App/DocumentScannerView.swift',
  'App/AuditLogger.swift',
  'App/SyncQueue.swift',
  'App/MaintenanceModel.swift',
  'App/TripHistoryView.swift',
  'App/TripModel.swift',
  'App/LoginView.swift',
  'App/OfflineIndicatorView.swift',
  'App/BarcodeScannerView.swift',
  'App/VehicleModel.swift',
  'App/ImageUploadService.swift',
  'App/ErrorHandler.swift',
  'App/DatabaseMigration.swift',
  'App/TripDetailView.swift',
  'App/PhotoCaptureView.swift',
  'App/TripTrackingService.swift',
  'App/PerformanceMonitor.swift',
  'App/SecurityLogger.swift',
  'App/JailbreakDetector.swift',
  'App/FeatureFlags.swift',
  'App/MetricsCollector.swift',
  'App/QuickActionsView.swift',
  'App/Utilities/LocalizationManager.swift',
  'App/Utilities/AccessibilityManager.swift',
  'App/Components/VehicleCard.swift',
  'App/Monitoring/TelemetryExporter.swift',
  'App/Performance/PerformanceOptimizer.swift',
  'App/Performance/UIPerformanceMonitor.swift',
  'App/Performance/AdvancedCacheManager.swift',
  'App/Performance/NetworkOptimizer.swift',
  'App/Views/AccessibleVehicleListView.swift',
  'App/Views/VehicleDetailView.swift',
  'App/Views/AccessibleLoginView.swift',
  'App/Views/VehicleInspectionView.swift',
  'App/Views/ErrorView.swift',
  'App/Views/Support/SupportTicketView.swift',
  'App/Views/Help/HelpCenterView.swift',
  'App/Views/Help/OnboardingView.swift',
]

# Open project
project = Xcodeproj::Project.open(project_path)

# Get the App target
target = project.targets.find { |t| t.name == 'App' }

# Get the main App group
app_group = project.main_group.find_subpath('App', true)

added_count = 0
skipped_count = 0

files_to_add.each do |file_path|
  full_path = File.join(workspace_root, file_path)

  # Check if file exists on filesystem
  unless File.exist?(full_path)
    puts "⚠️  File not found: #{file_path}"
    skipped_count += 1
    next
  end

  # Add file reference to project
  file_ref = app_group.new_reference(full_path)

  # Add file to target's build phase
  target.source_build_phase.add_file_reference(file_ref)

  puts "✅ Added: #{file_path}"
  added_count += 1
end

# Save project
project.save

puts ""
puts "="*60
puts "SUMMARY"
puts "="*60
puts "✅ Added: #{added_count} files"
puts "⚠️  Skipped: #{skipped_count} files"
puts ""
puts "Project saved successfully!"

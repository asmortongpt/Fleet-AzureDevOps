#!/usr/bin/env ruby

require 'xcodeproj'

# Open the Xcode project
project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target (assuming it's named "App")
target = project.targets.find { |t| t.name == 'App' }
unless target
  puts "Error: Could not find target 'App'"
  exit 1
end

# Get the App group
app_group = project.main_group.find_subpath('App', true)
unless app_group
  puts "Error: Could not find 'App' group"
  exit 1
end

# Files to add
files_to_add = [
  "App/TripTrackingView.swift",
  "App/OBD2DiagnosticsView.swift",
  "App/NIST_INTEGRATION_GUIDE.swift",
  "App/BuildConfiguration.swift",
  "App/CameraMediaExamples.swift",
  "App/ConflictResolver.swift",
  "App/DocumentScannerView.swift",
  "App/AuditLogger.swift",
  "App/SyncQueue.swift",
  "App/MonitoringIntegrationExample.swift",
  "App/MaintenanceModel.swift",
  "App/TripHistoryView.swift",
  "App/TripModel.swift",
  "App/NISTCompliance.swift",
  "App/LoginView.swift",
  "App/OfflineIndicatorView.swift",
  "App/BarcodeScannerView.swift",
  "App/VehicleModel.swift",
  "App/ImageUploadService.swift",
  "App/ErrorHandler.swift",
  "App/DatabaseMigration.swift",
  "App/TripDetailView.swift",
  "App/PhotoCaptureView.swift",
  "App/TripTrackingService.swift",
  "App/PerformanceMonitor.swift",
  "App/SecurityLogger.swift",
  "App/JailbreakDetector.swift",
  "App/FeatureFlags.swift",
  "App/MetricsCollector.swift",
  "App/QuickActionsView.swift",
  "App/Tests/ProductionValidationTests.swift",
  "App/Utilities/LocalizationManager.swift",
  "App/Utilities/AccessibilityManager.swift",
  "App/Components/VehicleCard.swift",
  "App/Monitoring/TelemetryExporter.swift",
  "App/Performance/PerformanceOptimizer.swift",
  "App/Performance/UIPerformanceMonitor.swift",
  "App/Performance/AdvancedCacheManager.swift",
  "App/Performance/NetworkOptimizer.swift",
  "App/Views/AccessibleVehicleListView.swift",
  "App/Views/VehicleDetailView.swift",
  "App/Views/AccessibleLoginView.swift",
  "App/Views/VehicleInspectionView.swift",
  "App/Views/ErrorView.swift",
  "App/Views/Support/SupportTicketView.swift",
  "App/Views/Help/HelpCenterView.swift",
  "App/Views/Help/OnboardingView.swift"
]

added_count = 0
skipped_count = 0

files_to_add.each do |file_path|
  # Check if file exists
  unless File.exist?(file_path)
    puts "Warning: File does not exist: #{file_path}"
    skipped_count += 1
    next
  end

  # Check if file is already in project
  if target.source_build_phase.files.any? { |bf| bf.file_ref && bf.file_ref.path == file_path.sub('App/', '') }
    puts "Skipping (already in project): #{file_path}"
    skipped_count += 1
    next
  end

  # Determine the appropriate group based on path structure
  relative_path = file_path.sub('App/', '')
  path_components = relative_path.split('/')

  current_group = app_group

  # Navigate/create nested groups if needed
  if path_components.length > 1
    # Create nested groups (e.g., "Views", "Support", etc.)
    path_components[0...-1].each do |component|
      subgroup = current_group.find_subpath(component, false)
      unless subgroup
        subgroup = current_group.new_group(component)
      end
      current_group = subgroup
    end
  end

  # Add the file reference
  file_ref = current_group.new_file(file_path)

  # Add to build phase (compile sources)
  target.source_build_phase.add_file_reference(file_ref)

  puts "Added: #{file_path}"
  added_count += 1
end

# Save the project
project.save

puts "\n=== Summary ==="
puts "Files added: #{added_count}"
puts "Files skipped: #{skipped_count}"
puts "Project saved successfully!"

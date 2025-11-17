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

removed_count = 0
added_count = 0

# Files that need to be fixed (they were added with wrong paths)
files_to_fix = [
  "TripTrackingView.swift",
  "OBD2DiagnosticsView.swift",
  "NIST_INTEGRATION_GUIDE.swift",
  "BuildConfiguration.swift",
  "CameraMediaExamples.swift",
  "ConflictResolver.swift",
  "DocumentScannerView.swift",
  "AuditLogger.swift",
  "SyncQueue.swift",
  "MonitoringIntegrationExample.swift",
  "MaintenanceModel.swift",
  "TripHistoryView.swift",
  "TripModel.swift",
  "NISTCompliance.swift",
  "LoginView.swift",
  "OfflineIndicatorView.swift",
  "BarcodeScannerView.swift",
  "VehicleModel.swift",
  "ImageUploadService.swift",
  "ErrorHandler.swift",
  "DatabaseMigration.swift",
  "TripDetailView.swift",
  "PhotoCaptureView.swift",
  "TripTrackingService.swift",
  "PerformanceMonitor.swift",
  "SecurityLogger.swift",
  "JailbreakDetector.swift",
  "FeatureFlags.swift",
  "MetricsCollector.swift",
  "QuickActionsView.swift"
]

# Remove incorrectly added files from the build phase
target.source_build_phase.files.to_a.each do |build_file|
  next unless build_file.file_ref

  # Check if this is one of our problem files
  file_path = build_file.file_ref.real_path.to_s

  if file_path.include?('/App/App/')
    puts "Removing incorrectly referenced file: #{file_path}"
    build_file.remove_from_project
    removed_count += 1
  end
end

# Also remove the file references themselves
app_group.recursive_children.to_a.each do |item|
  next unless item.is_a?(Xcodeproj::Project::Object::PBXFileReference)

  if item.real_path && item.real_path.to_s.include?('/App/App/')
    puts "Removing file reference: #{item.real_path}"
    item.remove_from_project
    removed_count += 1
  end
end

# Now add them back with correct paths
files_with_correct_paths = [
  { path: "App/TripTrackingView.swift", group_path: [] },
  { path: "App/OBD2DiagnosticsView.swift", group_path: [] },
  { path: "App/NIST_INTEGRATION_GUIDE.swift", group_path: [] },
  { path: "App/BuildConfiguration.swift", group_path: [] },
  { path: "App/CameraMediaExamples.swift", group_path: [] },
  { path: "App/ConflictResolver.swift", group_path: [] },
  { path: "App/DocumentScannerView.swift", group_path: [] },
  { path: "App/AuditLogger.swift", group_path: [] },
  { path: "App/SyncQueue.swift", group_path: [] },
  { path: "App/MonitoringIntegrationExample.swift", group_path: [] },
  { path: "App/MaintenanceModel.swift", group_path: [] },
  { path: "App/TripHistoryView.swift", group_path: [] },
  { path: "App/TripModel.swift", group_path: [] },
  { path: "App/NISTCompliance.swift", group_path: [] },
  { path: "App/LoginView.swift", group_path: [] },
  { path: "App/OfflineIndicatorView.swift", group_path: [] },
  { path: "App/BarcodeScannerView.swift", group_path: [] },
  { path: "App/VehicleModel.swift", group_path: [] },
  { path: "App/ImageUploadService.swift", group_path: [] },
  { path: "App/ErrorHandler.swift", group_path: [] },
  { path: "App/DatabaseMigration.swift", group_path: [] },
  { path: "App/TripDetailView.swift", group_path: [] },
  { path: "App/PhotoCaptureView.swift", group_path: [] },
  { path: "App/TripTrackingService.swift", group_path: [] },
  { path: "App/PerformanceMonitor.swift", group_path: [] },
  { path: "App/SecurityLogger.swift", group_path: [] },
  { path: "App/JailbreakDetector.swift", group_path: [] },
  { path: "App/FeatureFlags.swift", group_path: [] },
  { path: "App/MetricsCollector.swift", group_path: [] },
  { path: "App/QuickActionsView.swift", group_path: [] },
  { path: "App/Tests/ProductionValidationTests.swift", group_path: ["Tests"] },
  { path: "App/Utilities/LocalizationManager.swift", group_path: ["Utilities"] },
  { path: "App/Utilities/AccessibilityManager.swift", group_path: ["Utilities"] },
  { path: "App/Components/VehicleCard.swift", group_path: ["Components"] },
  { path: "App/Monitoring/TelemetryExporter.swift", group_path: ["Monitoring"] },
  { path: "App/Performance/PerformanceOptimizer.swift", group_path: ["Performance"] },
  { path: "App/Performance/UIPerformanceMonitor.swift", group_path: ["Performance"] },
  { path: "App/Performance/AdvancedCacheManager.swift", group_path: ["Performance"] },
  { path: "App/Performance/NetworkOptimizer.swift", group_path: ["Performance"] },
  { path: "App/Views/AccessibleVehicleListView.swift", group_path: ["Views"] },
  { path: "App/Views/VehicleDetailView.swift", group_path: ["Views"] },
  { path: "App/Views/AccessibleLoginView.swift", group_path: ["Views"] },
  { path: "App/Views/VehicleInspectionView.swift", group_path: ["Views"] },
  { path: "App/Views/ErrorView.swift", group_path: ["Views"] },
  { path: "App/Views/Support/SupportTicketView.swift", group_path: ["Views", "Support"] },
  { path: "App/Views/Help/HelpCenterView.swift", group_path: ["Views", "Help"] },
  { path: "App/Views/Help/OnboardingView.swift", group_path: ["Views", "Help"] }
]

files_with_correct_paths.each do |file_info|
  file_path = file_info[:path]

  # Check if file exists
  unless File.exist?(file_path)
    puts "Warning: File does not exist: #{file_path}"
    next
  end

  # Navigate to the appropriate group
  current_group = app_group
  file_info[:group_path].each do |group_name|
    subgroup = current_group.find_subpath(group_name, false)
    unless subgroup
      subgroup = current_group.new_group(group_name)
    end
    current_group = subgroup
  end

  # Check if already exists with correct path
  file_name = File.basename(file_path)
  exists = current_group.files.any? { |f| f.path == file_name }

  if exists
    puts "Skipping (already exists correctly): #{file_path}"
    next
  end

  # Add the file reference with just the filename (relative to group)
  file_ref = current_group.new_file(file_path)

  # Add to build phase (compile sources)
  target.source_build_phase.add_file_reference(file_ref)

  puts "Added: #{file_path}"
  added_count += 1
end

# Save the project
project.save

puts "\n=== Summary ==="
puts "Files removed: #{removed_count}"
puts "Files added: #{added_count}"
puts "Project saved successfully!"

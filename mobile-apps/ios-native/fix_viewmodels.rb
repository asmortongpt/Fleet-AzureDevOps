#!/usr/bin/env ruby
require 'xcodeproj'

# Open the Xcode project
project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target (assuming first target is the app target)
target = project.targets.first
puts "Target: #{target.name}"

# Find the App group and ViewModels group
app_group = project.main_group.find_subpath('App', false)
if app_group.nil?
  puts "ERROR: App group not found!"
  exit 1
end

viewmodels_group = app_group.find_subpath('ViewModels', false)
if viewmodels_group.nil?
  puts "Creating ViewModels group..."
  viewmodels_group = app_group.new_group('ViewModels', 'ViewModels')
end

puts "App group path: #{app_group.path || '(root)'}"
puts "ViewModels group path: #{viewmodels_group.path}"

# List of ViewModel files to add (just filename)
viewmodel_files = [
  'BaseViewModel.swift',
  'ChecklistViewModel.swift',
  'DashboardViewModel.swift',
  'DashboardViewModelExtensions.swift',
  'DocumentsViewModel.swift',
  'DriversViewModel.swift',
  'EnhancedViewModels.swift',
  'FuelViewModel.swift',
  'GeofenceViewModel.swift',
  'IncidentViewModel.swift',
  'MaintenanceViewModel.swift',
  'MaintenanceViewModelExtensions.swift',
  'NotificationsViewModel.swift',
  'ReportsViewModel.swift',
  'ScheduleViewModel.swift',
  'TripsViewModel.swift',
  'VehiclesViewModel.swift',
  'VehiclesViewModelExtensions.swift',
  'VehicleViewModel.swift'
]

added_count = 0
already_exists_count = 0

viewmodel_files.each do |file_name|
  # Check if file already exists in the project
  existing_file = viewmodels_group.files.find { |f| f.path == file_name }

  if existing_file
    puts "✓ Already in project: #{file_name}"
    already_exists_count += 1

    # Ensure it's in the build phase
    build_file = target.source_build_phase.files.find { |bf| bf.file_ref == existing_file }
    if build_file.nil?
      target.source_build_phase.add_file_reference(existing_file)
      puts "  Added to build phase: #{file_name}"
    end
  else
    # Add the file reference to the ViewModels group
    # The path should be relative to the group's location
    file_ref = viewmodels_group.new_file(file_name)

    # Add to the target's source build phase
    target.source_build_phase.add_file_reference(file_ref)

    puts "✓ Added to project: #{file_name}"
    added_count += 1
  end
end

# Save the project
project.save

puts "\n" + "="*60
puts "SUMMARY:"
puts "  Files already in project: #{already_exists_count}"
puts "  Files newly added: #{added_count}"
puts "  Total ViewModel files: #{viewmodel_files.length}"
puts "="*60
puts "\nProject saved successfully!"

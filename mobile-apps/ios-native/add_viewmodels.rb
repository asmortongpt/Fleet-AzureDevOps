#!/usr/bin/env ruby
require 'xcodeproj'

# Open the Xcode project
project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target (assuming first target is the app target)
target = project.targets.first
puts "Target: #{target.name}"

# Find or create ViewModels group
app_group = project.main_group.find_subpath('App', true)
viewmodels_group = app_group.find_subpath('ViewModels', true)

puts "\nViewModels group found: #{viewmodels_group.path}"

# List of ViewModel files to add (relative to App directory)
viewmodel_files = [
  'ViewModels/BaseViewModel.swift',
  'ViewModels/ChecklistViewModel.swift',
  'ViewModels/DashboardViewModel.swift',
  'ViewModels/DashboardViewModelExtensions.swift',
  'ViewModels/DocumentsViewModel.swift',
  'ViewModels/DriversViewModel.swift',
  'ViewModels/EnhancedViewModels.swift',
  'ViewModels/FuelViewModel.swift',
  'ViewModels/GeofenceViewModel.swift',
  'ViewModels/IncidentViewModel.swift',
  'ViewModels/MaintenanceViewModel.swift',
  'ViewModels/MaintenanceViewModelExtensions.swift',
  'ViewModels/NotificationsViewModel.swift',
  'ViewModels/ReportsViewModel.swift',
  'ViewModels/ScheduleViewModel.swift',
  'ViewModels/TripsViewModel.swift',
  'ViewModels/VehiclesViewModel.swift',
  'ViewModels/VehiclesViewModelExtensions.swift',
  'ViewModels/VehicleViewModel.swift'
]

added_count = 0
already_exists_count = 0

viewmodel_files.each do |relative_path|
  file_name = File.basename(relative_path)

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
    file_ref = viewmodels_group.new_file("../App/#{relative_path}")

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

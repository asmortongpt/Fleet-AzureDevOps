#!/usr/bin/env ruby

require 'xcodeproj'

# Open the Xcode project
project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
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

new_files = [
  "App/VehiclesView.swift",
  "App/TripsView.swift",
  "App/MoreView.swift",
  "App/MaintenanceDetailView.swift",
  "App/AddVehicleView.swift",
  "App/AddTripView.swift",
  "App/NotificationsView.swift",
  "App/AboutView.swift",
  "App/HelpView.swift"
]

added_count = 0

new_files.each do |file_path|
  # Check if file exists
  unless File.exist?(file_path)
    puts "Warning: File does not exist: #{file_path}"
    next
  end

  # Check if already in project
  file_name = File.basename(file_path)
  exists = app_group.files.any? { |f| f.path == file_name }

  if exists
    puts "Skipping (already in project): #{file_path}"
    next
  end

  # Add the file reference
  file_ref = app_group.new_file(file_path)

  # Add to build phase
  target.source_build_phase.add_file_reference(file_ref)

  puts "Added: #{file_path}"
  added_count += 1
end

# Save the project
project.save

puts "\n=== Summary ==="
puts "Files added: #{added_count}"
puts "Project saved successfully!"

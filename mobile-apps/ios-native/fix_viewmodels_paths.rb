#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the App target
target = project.targets.first

# Remove the incorrectly added files
bad_paths = [
  'App/ViewModels/App/ViewModels/TripsViewModel.swift',
  'App/ViewModels/App/ViewModels/AddTripViewModel.swift'
]

bad_paths.each do |bad_path|
  file_ref = project.files.find { |f| f.path == bad_path }
  if file_ref
    file_ref.remove_from_project
    puts "Removed bad path: #{bad_path}"
  end
end

# Find or create the ViewModels group
app_group = project.main_group['App']
viewmodels_group = app_group['ViewModels'] || app_group.new_group('ViewModels', 'App/ViewModels')

# Add files with correct paths
correct_files = [
  'ViewModels/TripsViewModel.swift',
  'ViewModels/AddTripViewModel.swift'
]

correct_files.each do |path|
  file_name = File.basename(path)

  # Skip if already exists
  existing_file = viewmodels_group.files.find { |f| f.path == file_name }
  if existing_file
    puts "#{file_name} already exists, skipping"
    next
  end

  # Add file reference with correct path
  file_ref = viewmodels_group.new_file(path)

  # Add to build phase
  target.source_build_phase.add_file_reference(file_ref)

  puts "Added #{file_name} with path #{path}"
end

project.save

puts "Project saved successfully"

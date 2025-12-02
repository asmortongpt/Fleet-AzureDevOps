#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the App target
target = project.targets.first

# Find or create the ViewModels group
app_group = project.main_group['App']
viewmodels_group = app_group['ViewModels'] || app_group.new_group('ViewModels', 'App/ViewModels')

# ViewModels to add
viewmodels = [
  'App/ViewModels/TripsViewModel.swift',
  'App/ViewModels/AddTripViewModel.swift'
]

viewmodels.each do |path|
  file_name = File.basename(path)

  # Skip if already exists
  existing_file = viewmodels_group.files.find { |f| f.path == file_name }
  next if existing_file

  # Add file reference
  file_ref = viewmodels_group.new_file(path)

  # Add to build phase
  target.source_build_phase.add_file_reference(file_ref)

  puts "Added #{file_name}"
end

project.save

puts "Project saved successfully"

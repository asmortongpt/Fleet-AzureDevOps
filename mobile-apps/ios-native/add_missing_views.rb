#!/usr/bin/env ruby
require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first
puts "Target: #{target.name}"

# Find or create the Views group
views_group = project.main_group['App']&.[]('Views')
if views_group.nil?
  puts "ERROR: Views group not found"
  exit 1
end

# Find or create the ViewModels group
viewmodels_group = project.main_group['App']&.[]('ViewModels')
if viewmodels_group.nil?
  puts "ERROR: ViewModels group not found"
  exit 1
end

# Define the files to add
files_to_add = [
  {
    path: 'App/Views/FleetMapView.swift',
    group: views_group,
    name: 'FleetMapView.swift'
  },
  {
    path: 'App/ViewModels/TripsViewModel.swift',
    group: viewmodels_group,
    name: 'TripsViewModel.swift'
  }
]

files_to_add.each do |file_info|
  file_path = file_info[:path]
  group = file_info[:group]
  file_name = file_info[:name]

  # Check if file already exists in project
  existing_file = group.files.find { |f| f.path == file_name }

  if existing_file
    puts "File already in project: #{file_name}"

    # Ensure it's in build phase
    unless target.source_build_phase.files_references.include?(existing_file)
      target.source_build_phase.add_file_reference(existing_file)
      puts "  Added to compile sources: #{file_name}"
    end
  else
    # Add file reference to the group
    file_ref = group.new_reference(file_path)
    puts "Added file reference: #{file_name}"

    # Add to compile sources build phase
    target.source_build_phase.add_file_reference(file_ref)
    puts "  Added to compile sources: #{file_name}"
  end
end

# Save the project
project.save
puts "\nProject saved successfully!"
puts "Files added to Xcode project."

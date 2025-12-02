#!/usr/bin/env ruby
require 'xcodeproj'

# Open the Xcode project
project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first
puts "Target: #{target.name}"

# Find the App group
app_group = project.main_group.find_subpath('App', false)

# Find DashboardViewModel.swift in the App group (not in ViewModels subgroup)
duplicate_file = app_group.files.find { |f| f.path == 'DashboardViewModel.swift' }

if duplicate_file
  puts "Found duplicate DashboardViewModel.swift in App group"
  puts "  Path: #{duplicate_file.real_path}"

  # Remove from build phase
  target.source_build_phase.files.each do |build_file|
    if build_file.file_ref == duplicate_file
      puts "  Removing from build phase..."
      target.source_build_phase.files.delete(build_file)
    end
  end

  # Remove the file reference
  puts "  Removing file reference..."
  duplicate_file.remove_from_project

  puts "✓ Duplicate removed successfully"
else
  puts "No duplicate found in App group"
end

# Save the project
project.save
puts "\nProject saved!"

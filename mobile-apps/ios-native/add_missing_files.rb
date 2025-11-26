#!/usr/bin/env ruby

require 'xcodeproj'

# Open the Xcode project
project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target (assuming it's named "App")
target = project.targets.find { |t| t.name == 'App' }

if target.nil?
  puts "Error: Could not find target 'App'"
  puts "Available targets: #{project.targets.map(&:name).join(', ')}"
  exit 1
end

# Files to add with their paths
files_to_add = [
  { path: 'App/VehiclesView.swift', group_path: 'App' },
  { path: 'App/TripsView.swift', group_path: 'App' },
  { path: 'App/Views/TripDetailView.swift', group_path: 'App/Views' },
  { path: 'App/Views/Driver/DriverDetailView.swift', group_path: 'App/Views/Driver' },
  { path: 'App/Views/VehicleDetailView.swift', group_path: 'App/Views' }
]

# Helper function to find or create group
def find_or_create_group(project, path)
  parts = path.split('/')
  current_group = project.main_group

  parts.each do |part|
    next_group = current_group.groups.find { |g| g.display_name == part || g.path == part }
    if next_group.nil?
      next_group = current_group.new_group(part, part)
    end
    current_group = next_group
  end

  current_group
end

# Add each file
files_to_add.each do |file_info|
  file_path = file_info[:path]
  group_path = file_info[:group_path]

  # Check if file exists on disk
  unless File.exist?(file_path)
    puts "Warning: File does not exist: #{file_path}"
    next
  end

  # Find or create the group
  group = find_or_create_group(project, group_path)

  # Check if file is already in the project
  existing_file = group.files.find { |f| f.path == File.basename(file_path) }

  if existing_file
    puts "File already exists in group: #{file_path}"

    # Check if it's in the build phase
    build_file = target.source_build_phase.files.find do |bf|
      bf.file_ref == existing_file
    end

    if build_file.nil?
      puts "  Adding to compile sources: #{file_path}"
      target.source_build_phase.add_file_reference(existing_file)
    else
      puts "  Already in compile sources: #{file_path}"
    end
  else
    puts "Adding new file: #{file_path}"

    # Add file reference to the group
    file_ref = group.new_file(file_path)

    # Add to compile sources build phase
    target.source_build_phase.add_file_reference(file_ref)

    puts "  Successfully added: #{file_path}"
  end
end

# Save the project
project.save

puts "\n✅ Project updated successfully!"
puts "\nVerifying files are in project:"
files_to_add.each do |file_info|
  count = `grep -c "#{File.basename(file_info[:path])}" App.xcodeproj/project.pbxproj`.strip.to_i
  puts "  #{File.basename(file_info[:path])}: #{count} references"
end

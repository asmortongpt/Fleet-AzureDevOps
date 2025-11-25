#!/usr/bin/env ruby

require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first
puts "Target: #{target.name}"

# Additional files to add
files_to_add = [
  'App/Models/Schedule/ScheduleModels.swift',
  'App/Models/Checklist/ChecklistModels.swift',
  'App/Models/FuelModels.swift',
  'App/Services/ScheduleService.swift',
  'App/Services/ChecklistService.swift'
]

# Get the main group
main_group = project.main_group

puts "\nAdding files to project..."

files_to_add.each do |file_path|
  absolute_path = File.join('/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native', file_path)

  unless File.exist?(absolute_path)
    puts "WARNING: File does not exist: #{absolute_path}"
    next
  end

  # Parse the path to find/create appropriate groups
  path_components = file_path.split('/')
  file_name = path_components.last
  dir_components = path_components[0..-2]

  # Navigate/create group hierarchy
  current_group = main_group
  dir_components.each do |dir_name|
    existing_group = current_group.children.find { |child| child.is_a?(Xcodeproj::Project::Object::PBXGroup) && child.display_name == dir_name }

    if existing_group
      current_group = existing_group
    else
      # Create new group
      new_group = current_group.new_group(dir_name, dir_name)
      current_group = new_group
    end
  end

  # Check if file already exists in project
  existing_file = current_group.children.find { |child| child.respond_to?(:display_name) && child.display_name == file_name }

  if existing_file
    puts "File already in project: #{file_path}"

    # Make sure it's in the build phase
    build_file = target.source_build_phase.files.find { |bf| bf.file_ref == existing_file }
    if build_file.nil?
      target.source_build_phase.add_file_reference(existing_file)
      puts "  -> Added to build phase"
    else
      puts "  -> Already in build phase"
    end
  else
    # Add new file reference
    file_ref = current_group.new_file(file_name)
    puts "Added file reference: #{file_path}"

    # Add to build phase (compile sources)
    if file_name.end_with?('.swift', '.m', '.mm', '.cpp', '.c')
      target.source_build_phase.add_file_reference(file_ref)
      puts "  -> Added to build phase"
    end
  end
end

# Save the project
project.save
puts "\nProject saved successfully!"
puts "Added files are now part of the Xcode project."

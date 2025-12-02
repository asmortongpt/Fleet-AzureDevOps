#!/usr/bin/env ruby

require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first
puts "Target: #{target.name}"

# Find and remove DateRange.swift
puts "\nSearching for DateRange.swift..."

def find_file_reference(group, filename)
  group.children.each do |child|
    if child.is_a?(Xcodeproj::Project::Object::PBXFileReference) && child.display_name == filename
      return child
    elsif child.is_a?(Xcodeproj::Project::Object::PBXGroup)
      found = find_file_reference(child, filename)
      return found if found
    end
  end
  nil
end

file_ref = find_file_reference(project.main_group, 'DateRange.swift')

if file_ref
  puts "Found DateRange.swift in project"
  
  # Remove from build phase
  target.source_build_phase.files.each do |build_file|
    if build_file.file_ref == file_ref
      target.source_build_phase.files.delete(build_file)
      puts "  -> Removed from build phase"
    end
  end
  
  # Remove file reference
  file_ref.remove_from_project
  puts "  -> Removed file reference from project"
  
  # Save project
  project.save
  puts "\nProject saved successfully!"
else
  puts "DateRange.swift not found in project"
end

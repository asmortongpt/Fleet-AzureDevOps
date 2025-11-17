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

removed = false

# Find and remove ProductionValidationTests.swift from build phases
target.source_build_phase.files.to_a.each do |build_file|
  next unless build_file.file_ref

  if build_file.file_ref.path && build_file.file_ref.path.include?('ProductionValidationTests.swift')
    puts "Removing ProductionValidationTests.swift from build phase"
    build_file.remove_from_project
    removed = true
  end
end

# Save the project
project.save

if removed
  puts "Successfully removed ProductionValidationTests.swift from compilation"
else
  puts "ProductionValidationTests.swift not found in build phases"
end

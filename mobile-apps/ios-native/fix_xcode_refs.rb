#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the App target
target = project.targets.find { |t| t.name == 'App' }

# Get the compile sources build phase
sources_phase = target.source_build_phase

# Files to remove (invalid paths)
invalid_paths = [
  'App/App/Views/TripDetailView.swift',
  'App/Driver/App/Views/Driver/DriverDetailView.swift',
  'App/App/Views/VehicleDetailView.swift'
]

removed_count = 0

# Remove invalid file references from build phase
sources_phase.files.each do |build_file|
  next unless build_file.file_ref

  file_path = build_file.file_ref.real_path.to_s rescue nil

  invalid_paths.each do |invalid_path|
    if file_path&.include?(invalid_path) || build_file.file_ref.path&.include?(invalid_path)
      puts "Removing invalid reference: #{build_file.file_ref.path}"
      sources_phase.remove_file_reference(build_file.file_ref)
      removed_count += 1
      break
    end
  end
end

# Also remove any file references that don't exist on disk
sources_phase.files.each do |build_file|
  next unless build_file.file_ref

  real_path = build_file.file_ref.real_path.to_s rescue nil
  if real_path && !File.exist?(real_path)
    puts "Removing non-existent file: #{build_file.file_ref.path}"
    sources_phase.remove_file_reference(build_file.file_ref)
    removed_count += 1
  end
end

# Save the project
project.save

puts "\n✅ Fixed Xcode project!"
puts "   Removed #{removed_count} invalid file references"
puts "   Project saved to: #{project_path}"

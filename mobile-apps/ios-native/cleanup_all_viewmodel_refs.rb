#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the App target
target = project.targets.first

# Remove ALL references to TripsViewModel and AddTripViewModel
puts "Removing all existing references..."

# Find all file references
all_refs = []
project.files.each do |file|
  if file.path && (file.path.include?('TripsViewModel') || file.path.include?('AddTripViewModel'))
    all_refs << file
    puts "Found reference: #{file.path}"
  end
end

# Remove from build phase first
build_phase = target.source_build_phase
all_refs.each do |ref|
  build_file = build_phase.files.find { |bf| bf.file_ref == ref }
  if build_file
    build_phase.files.delete(build_file)
    puts "Removed from build phase: #{ref.path}"
  end
end

# Remove file references
all_refs.each do |ref|
  ref.remove_from_project
  puts "Removed reference: #{ref.path}"
end

project.save
puts "\nAll ViewModel references removed. Project saved."
puts "\nNow run Xcode and manually add the files:"
puts "  App/ViewModels/TripsViewModel.swift"
puts "  App/ViewModels/AddTripViewModel.swift"

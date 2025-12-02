#!/usr/bin/env ruby
require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first
puts "Target: #{target.name}"

# Find the Views and ViewModels groups
views_group = project.main_group['App']&.[]('Views')
viewmodels_group = project.main_group['App']&.[]('ViewModels')

if views_group.nil? || viewmodels_group.nil?
  puts "ERROR: Required groups not found"
  exit 1
end

puts "\n=== CLEANING UP DUPLICATES ==="

# Remove ALL FleetMapView references
fleet_map_refs = []
project.files.each do |file|
  if file.path&.include?('FleetMapView.swift')
    fleet_map_refs << file
    puts "Found FleetMapView reference: #{file.real_path}"
  end
end

fleet_map_refs.each do |ref|
  puts "  Removing: #{ref.real_path}"
  ref.remove_from_project
end

# Remove ALL TripsViewModel references
trips_vm_refs = []
project.files.each do |file|
  if file.path&.include?('TripsViewModel.swift')
    trips_vm_refs << file
    puts "Found TripsViewModel reference: #{file.real_path}"
  end
end

trips_vm_refs.each do |ref|
  puts "  Removing: #{ref.real_path}"
  ref.remove_from_project
end

puts "\n=== ADDING CORRECT REFERENCES ==="

# Add FleetMapView with correct path
fleet_map_file = views_group.new_file('FleetMapView.swift')
fleet_map_file.source_tree = '<group>'
target.source_build_phase.add_file_reference(fleet_map_file)
puts "  Added: FleetMapView.swift to Views group"

# Add TripsViewModel with correct path
trips_vm_file = viewmodels_group.new_file('TripsViewModel.swift')
trips_vm_file.source_tree = '<group>'
target.source_build_phase.add_file_reference(trips_vm_file)
puts "  Added: TripsViewModel.swift to ViewModels group"

# Save the project
project.save
puts "\n=== Project saved successfully! ==="

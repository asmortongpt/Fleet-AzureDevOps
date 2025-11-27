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

# Remove any existing bad references
puts "\nRemoving bad file references..."
views_group.files.each do |file|
  if file.path == 'FleetMapView.swift' && file.real_path.to_s.include?('App/App/')
    puts "  Removing bad FleetMapView.swift reference"
    file.remove_from_project
  end
end

viewmodels_group.files.each do |file|
  if file.path == 'TripsViewModel.swift' && file.real_path.to_s.include?('App/App/')
    puts "  Removing bad TripsViewModel.swift reference"
    file.remove_from_project
  end
end

# Also remove VehicleDetailView if it has bad path
views_group.files.each do |file|
  if file.path == 'VehicleDetailView.swift' && file.real_path.to_s.include?('App/App/')
    puts "  Removing bad VehicleDetailView.swift reference"
    file.remove_from_project
  end
end

# Add correct file references
puts "\nAdding correct file references..."

# FleetMapView.swift
fleet_map_ref = views_group.new_file('../App/Views/FleetMapView.swift')
target.source_build_phase.add_file_reference(fleet_map_ref)
puts "  Added: FleetMapView.swift"

# TripsViewModel.swift
trips_vm_ref = viewmodels_group.new_file('../App/ViewModels/TripsViewModel.swift')
target.source_build_phase.add_file_reference(trips_vm_ref)
puts "  Added: TripsViewModel.swift"

# Save the project
project.save
puts "\nProject saved successfully!"

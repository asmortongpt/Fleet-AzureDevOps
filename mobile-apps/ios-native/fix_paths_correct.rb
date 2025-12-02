#!/usr/bin/env ruby
require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first
puts "Target: #{target.name}"

puts "\n=== Finding and removing problematic files ==="

# Get all file references (not build files)
project.main_group.recursive_children.select { |child| child.is_a?(Xcodeproj::Project::Object::PBXFileReference) }.each do |file|
  begin
    real_path_str = file.real_path.to_s
    if real_path_str.include?('App/App/') || (real_path_str.include?('TripsViewModel') && real_path_str.include?('App/ViewModels'))
      puts "  Removing: #{real_path_str}"
      file.remove_from_project
    end
  rescue => e
    # Skip files that can't resolve their path
  end
end

# Find the groups
app_group = project.main_group['App']
views_group = app_group['Views']
viewmodels_group = app_group['ViewModels']

puts "\n=== Adding files with correct paths ==="

# Add FleetMapView.swift
if views_group
  fleet_map = views_group.new_reference('Views/FleetMapView.swift')
  target.source_build_phase.add_file_reference(fleet_map)
  puts "  Added: FleetMapView.swift (path: Views/FleetMapView.swift)"
end

# Add TripsViewModel.swift
if viewmodels_group
  trips_vm = viewmodels_group.new_reference('ViewModels/TripsViewModel.swift')
  target.source_build_phase.add_file_reference(trips_vm)
  puts "  Added: TripsViewModel.swift (path: ViewModels/TripsViewModel.swift)"
end

# Save the project
project.save
puts "\n=== SUCCESS: Project saved ==="

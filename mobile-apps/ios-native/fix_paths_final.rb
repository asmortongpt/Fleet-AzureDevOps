#!/usr/bin/env ruby
require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first
puts "Target: #{target.name}"

# Find problematic file references by their real path
files_to_fix = []
project.files.each do |file|
  if file.real_path.to_s.include?('App/App/') || file.real_path.to_s.include?('App/ViewModels/TripsViewModel')
    files_to_fix << file
    puts "Found problematic file: #{file.real_path}"
  end
end

# Remove them
files_to_fix.each do |file|
  file.remove_from_project
  puts "  Removed: #{file.real_path}"
end

# Find the Views and ViewModels groups
app_group = project.main_group['App']
views_group = app_group['Views']
viewmodels_group = app_group['ViewModels']

puts "\n=== Adding files with correct paths ==="

# Add FleetMapView.swift - it should be in Views group with path "Views/FleetMapView.swift"
if views_group
  fleet_map = views_group.new_reference('Views/FleetMapView.swift')
  fleet_map.source_tree = '<group>'
  target.source_build_phase.add_file_reference(fleet_map)
  puts "  Added FleetMapView.swift with path: Views/FleetMapView.swift"
end

# Add TripsViewModel.swift - it should be in ViewModels group with path "ViewModels/TripsViewModel.swift"
if viewmodels_group
  trips_vm = viewmodels_group.new_reference('ViewModels/TripsViewModel.swift')
  trips_vm.source_tree = '<group>'
  target.source_build_phase.add_file_reference(trips_vm)
  puts "  Added TripsViewModel.swift with path: ViewModels/TripsViewModel.swift"
end

# Save the project
project.save
puts "\n=== Project saved ==="#

#!/usr/bin/env ruby
require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

puts "Fixing FleetMapViewModel duplicate references..."

# Find all references to FleetMapViewModel.swift
fleet_map_refs = []
project.files.each do |file|
  if file.path == 'ViewModels/FleetMapViewModel.swift'
    fleet_map_refs << file
  end
end

puts "Found #{fleet_map_refs.count} FleetMapViewModel references"

# Keep only the first one, remove duplicates
if fleet_map_refs.count > 1
  keeper = fleet_map_refs.first
  fleet_map_refs[1..-1].each do |dup|
    puts "Removing duplicate reference: #{dup.uuid}"
    dup.remove_from_project
  end
end

# Save the project
project.save
puts "Project saved successfully!"

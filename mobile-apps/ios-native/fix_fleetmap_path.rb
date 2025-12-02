#!/usr/bin/env ruby
require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

puts "Fixing FleetMapViewModel path..."

# Find the FleetMapViewModel file reference
project.files.each do |file|
  if file.path == 'ViewModels/FleetMapViewModel.swift'
    puts "Found file with path: #{file.path}"
    puts "Updating to: App/ViewModels/FleetMapViewModel.swift"
    file.path = 'App/ViewModels/FleetMapViewModel.swift'
  end
end

# Save the project
project.save
puts "Project saved successfully!"

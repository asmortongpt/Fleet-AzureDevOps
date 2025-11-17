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

# Get the App group
app_group = project.main_group.find_subpath('App', true)
unless app_group
  puts "Error: Could not find 'App' group"
  exit 1
end

fixed_count = 0

# Fix all file references that have paths starting with "App/"
# They should be relative to their parent group
app_group.recursive_children.each do |item|
  next unless item.is_a?(Xcodeproj::Project::Object::PBXFileReference)
  next unless item.path

  # If the path starts with "App/", we need to fix it
  if item.path.start_with?('App/')
    old_path = item.path
    # Remove the "App/" prefix to make it relative to the App group
    new_path = item.path.sub(/^App\//, '')

    # Special handling for nested paths
    if new_path.include?('/')
      # For paths like "Views/Support/SupportTicketView.swift"
      # The file should be in the appropriate subgroup
      # We'll just remove the leading "App/" and keep the rest
      item.path = new_path
    else
      # For simple files like "TripTrackingView.swift"
      item.path = new_path
    end

    puts "Fixed: #{old_path} -> #{item.path}"
    fixed_count += 1
  end
end

# Save the project
project.save

puts "\n=== Summary ==="
puts "Fixed #{fixed_count} file path references"
puts "Project saved successfully!"

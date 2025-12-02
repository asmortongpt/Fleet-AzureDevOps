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

# File to add
file_path = "App/Views/PlaceholderViews.swift"
relative_path = "Views/PlaceholderViews.swift"

# Check if file exists
unless File.exist?(file_path)
  puts "Error: File does not exist: #{file_path}"
  exit 1
end

# Check if file is already in project - first remove it if exists
to_remove = []
target.source_build_phase.files.each do |build_file|
  if build_file.file_ref && build_file.file_ref.path && build_file.file_ref.path.include?('PlaceholderViews.swift')
    to_remove << build_file
  end
end
to_remove.each do |build_file|
  target.source_build_phase.files.delete(build_file)
  puts "Removed existing reference to PlaceholderViews.swift"
end

# Get or create Views group
views_group = app_group.find_subpath('Views', false)
unless views_group
  views_group = app_group.new_group('Views')
end

# Add the file reference with relative path
file_ref = views_group.new_file(relative_path)

# Add to build phase
target.source_build_phase.add_file_reference(file_ref)

# Save the project
project.save

puts "Successfully added #{file_path} to project!"

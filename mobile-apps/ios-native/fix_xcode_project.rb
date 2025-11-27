#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find and remove the DriverDetailView.swift file reference
files_to_remove = []
project.files.each do |file|
  if file.path&.include?('DriverDetailView.swift')
    puts "Found file reference: #{file.path}"
    files_to_remove << file
  end
end

files_to_remove.each do |file|
  puts "Removing: #{file.path}"
  file.remove_from_project
end

# Add SharedComponents.swift if not already added
shared_components_path = 'App/Views/Components/SharedComponents.swift'
unless project.files.find { |f| f.path == shared_components_path }
  puts "Adding SharedComponents.swift to project"

  # Find the Views/Components group or create it
  app_group = project.main_group.find_subpath('App', true)
  views_group = app_group.find_subpath('Views', true)
  components_group = views_group.find_subpath('Components', true)

  # Add the file
  file_ref = components_group.new_reference(shared_components_path)

  # Add to App target
  target = project.targets.first
  target.add_file_references([file_ref])
end

project.save

puts "Project updated successfully!"

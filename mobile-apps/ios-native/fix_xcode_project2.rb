#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find and fix SharedComponents.swift file reference
files_to_fix = []
project.files.each do |file|
  if file.path&.include?('SharedComponents.swift')
    puts "Found file reference: #{file.path}"
    files_to_fix << file
  end
end

files_to_fix.each do |file|
  puts "Removing incorrect: #{file.path}"
  file.remove_from_project
end

# Add SharedComponents.swift with correct path
puts "Adding SharedComponents.swift with correct path"

# Find the Views/Components group or create it
app_group = project.main_group.find_subpath('App', false)
if app_group.nil?
  puts "ERROR: Could not find App group"
  exit 1
end

views_group = app_group.find_subpath('Views', false) || app_group.new_group('Views')
components_group = views_group.find_subpath('Components', false) || views_group.new_group('Components')

# Add the file with CORRECT relative path
file_ref = components_group.new_file('Views/Components/SharedComponents.swift')

# Add to App target
target = project.targets.first
build_file = target.source_build_phase.add_file_reference(file_ref)

project.save

puts "Project updated successfully!"
puts "File path in project: #{file_ref.path}"

#!/usr/bin/env ruby
require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

puts "Removing duplicate file references..."

# Group files by path
files_by_path = {}
project.files.each do |file|
  path = file.path
  files_by_path[path] ||= []
  files_by_path[path] << file
end

# Remove duplicates
removed_count = 0
files_by_path.each do |path, files|
  if files.count > 1
    puts "Found #{files.count} references to: #{path}"
    # Keep the first, remove the rest
    files[1..-1].each do |dup|
      puts "  Removing duplicate: #{dup.uuid}"
      dup.remove_from_project
      removed_count += 1
    end
  end
end

puts "\nRemoved #{removed_count} duplicate references"

# Save the project
project.save
puts "Project saved successfully!"

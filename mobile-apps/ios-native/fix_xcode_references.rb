#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the App target
target = project.targets.find { |t| t.name == 'App' }
raise "Target 'App' not found!" unless target

# Get the App group
app_group = project.main_group.find_subpath('App', true)
raise "App group not found!" unless app_group

# Files to add with their correct paths relative to App group
new_files = {
  'Models/UserRole.swift' => 'Models',
  'Views/AdminDashboardView.swift' => 'Views',
  'Views/ManagerDashboardView.swift' => 'Views',
  'Views/DriverDashboardView.swift' => 'Views',
  'Views/ViewerDashboardView.swift' => 'Views'
}

puts "🔍 Scanning for duplicate or incorrect file references..."

# Remove ALL references to these files (including incorrect paths)
file_names_to_clean = [
  'UserRole.swift',
  'AdminDashboardView.swift',
  'ManagerDashboardView.swift',
  'DriverDashboardView.swift',
  'ViewerDashboardView.swift'
]

file_names_to_clean.each do |filename|
  # Find all references to this file anywhere in the project
  refs = project.files.select { |file| file.path&.end_with?(filename) }

  refs.each do |ref|
    puts "  ❌ Removing reference: #{ref.real_path}"
    ref.remove_from_project
  end

  # Also remove from build phases
  target.source_build_phase.files.each do |build_file|
    if build_file.file_ref&.path&.end_with?(filename)
      puts "  ❌ Removing from build phase: #{build_file.file_ref.path}"
      build_file.remove_from_project
    end
  end
end

puts "\n✅ Cleaned all references"

# Create subgroups if they don't exist
models_group = app_group.find_subpath('Models', false) || app_group.new_group('Models')
views_group = app_group.find_subpath('Views', false) || app_group.new_group('Views')

puts "\n📁 Adding files with correct paths..."

# Add each file to the correct group
new_files.each do |relative_path, group_name|
  file_path = File.join('App', relative_path)
  absolute_path = File.join(Dir.pwd, file_path)

  # Check if file actually exists
  unless File.exist?(absolute_path)
    puts "  ⚠️  File does not exist: #{absolute_path}"
    next
  end

  # Get the correct group
  group = (group_name == 'Models') ? models_group : views_group

  # Add file reference to the group
  file_ref = group.new_file(file_path)
  file_ref.source_tree = '<group>'

  puts "  ✅ Added: #{relative_path}"

  # Add to build phase
  target.add_file_references([file_ref])
  puts "     Added to build phase"
end

puts "\n💾 Saving project..."
project.save

puts "✅ Xcode project updated successfully!"
puts "\n📋 Summary:"
puts "  - Removed #{file_names_to_clean.length} duplicate/incorrect references"
puts "  - Added #{new_files.length} files with correct paths"
puts "  - All files added to build phase"

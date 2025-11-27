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

puts "🔍 Searching for role-based files..."

# Files to fix with their CORRECT relative paths from the App group
files_to_fix = {
  'UserRole.swift' => { group: 'Models', relative_path: 'Models/UserRole.swift' },
  'AdminDashboardView.swift' => { group: 'Views', relative_path: 'Views/AdminDashboardView.swift' },
  'ManagerDashboardView.swift' => { group: 'Views', relative_path: 'Views/ManagerDashboardView.swift' },
  'DriverDashboardView.swift' => { group: 'Views', relative_path: 'Views/DriverDashboardView.swift' },
  'ViewerDashboardView.swift' => { group: 'Views', relative_path: 'Views/ViewerDashboardView.swift' }
}

# Remove ALL existing references
files_to_fix.each do |filename, _info|
  refs = project.files.select { |file| file.path&.end_with?(filename) }
  refs.each do |ref|
    puts "  ❌ Removing: #{ref.real_path}"
    ref.remove_from_project
  end

  # Remove from build phases
  target.source_build_phase.files.each do |build_file|
    if build_file.file_ref&.path&.end_with?(filename)
      puts "  ❌ Removing from build: #{build_file.file_ref.path}"
      build_file.remove_from_project
    end
  end
end

puts "\n📁 Adding files with CORRECT relative paths..."

# Ensure groups exist
models_group = app_group.find_subpath('Models', false) || app_group.new_group('Models', 'Models')
views_group = app_group.find_subpath('Views', false) || app_group.new_group('Views', 'Views')

files_to_fix.each do |filename, info|
  # Full path from project root
  full_path = File.join('App', info[:relative_path])
  absolute_path = File.join(Dir.pwd, full_path)

  unless File.exist?(absolute_path)
    puts "  ⚠️  File missing: #{absolute_path}"
    next
  end

  # Get correct group
  group = (info[:group] == 'Models') ? models_group : views_group

  # Add file reference with path relative to the App group
  file_ref = group.new_reference(info[:relative_path])
  file_ref.source_tree = '<group>'
  file_ref.explicit_file_type = 'sourcecode.swift'

  puts "  ✅ Added: #{filename} (path=#{info[:relative_path]})"

  # Add to build phase
  target.source_build_phase.add_file_reference(file_ref)
  puts "     Added to build phase"
end

puts "\n💾 Saving project..."
project.save

puts "✅ Project fixed successfully!"
puts "\n🔍 Verifying..."

# Verify the paths
files_to_fix.each do |filename, _info|
  ref = project.files.find { |file| file.path&.end_with?(filename) }
  if ref
    puts "  ✅ #{filename}: path=#{ref.path}, sourceTree=#{ref.source_tree}"
  else
    puts "  ❌ #{filename}: NOT FOUND"
  end
end

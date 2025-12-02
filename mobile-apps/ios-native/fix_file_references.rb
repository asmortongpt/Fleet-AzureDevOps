#!/usr/bin/env ruby
# frozen_string_literal: true

require 'xcodeproj'

PROJECT_PATH = 'App.xcodeproj'

puts "🔧 Fixing file references in Xcode project..."

project = Xcodeproj::Project.open(PROJECT_PATH)

# Find and remove duplicate file references
files_to_remove = []

project.files.each do |file|
  # Look for files with duplicate path prefixes like "App/App/Services"
  if file.real_path && file.real_path.to_s.include?('/App/App/')
    puts "❌ Found duplicate path: #{file.real_path}"
    files_to_remove << file
  end
end

# Remove the bad references
files_to_remove.each do |file|
  puts "🗑️  Removing: #{file.display_name}"
  file.remove_from_project
end

project.save

puts "\n✅ Fixed #{files_to_remove.count} file references"
puts "📝 Run add_hardware_features_fixed.rb to re-add files correctly"

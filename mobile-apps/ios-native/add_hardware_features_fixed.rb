#!/usr/bin/env ruby
# frozen_string_literal: true

require 'xcodeproj'

PROJECT_PATH = 'App.xcodeproj'
TARGET_NAME = 'App'

# Define files with CORRECT absolute paths from project root
NEW_FILES = {
  'WeatherService.swift' => 'App/Services/WeatherService.swift',
  'EnhancedPhotoCapture.swift' => 'App/Services/EnhancedPhotoCapture.swift',
  'VehicleMaintenancePhotoView.swift' => 'App/Views/VehicleMaintenancePhotoView.swift',
  'HardwareQuickActionsView.swift' => 'App/Views/HardwareQuickActionsView.swift',
  'EnhancedTripTrackingView.swift' => 'App/EnhancedTripTrackingView.swift',
  'NavigationDestinationView.swift' => 'App/NavigationDestinationView.swift'
}

puts "🚀 Adding hardware integration files (FIXED)..."

project = Xcodeproj::Project.open(PROJECT_PATH)

target = project.targets.find { |t| t.name == TARGET_NAME }
unless target
  puts "❌ Target '#{TARGET_NAME}' not found"
  exit 1
end

app_group = project.main_group.find_subpath('App', true)

# Get or create Services group under App
services_group = app_group.find_subpath('Services', true) || app_group.new_group('Services')

# Get or create Views group under App
views_group = app_group.find_subpath('Views', true) || app_group.new_group('Views')

added_count = 0

NEW_FILES.each do |file_name, file_path|
  unless File.exist?(file_path)
    puts "⚠️  File not found: #{file_path}"
    next
  end

  # Check if already exists
  existing = project.files.find { |f| f.display_name == file_name }
  if existing && !existing.real_path.to_s.include?('/App/App/')
    puts "⏭️  Already exists: #{file_name}"
    next
  end

  # Determine group
  group = if file_path.include?('/Services/')
            services_group
          elsif file_path.include?('/Views/')
            views_group
          else
            app_group
          end

  # Add file reference with correct path
  file_ref = group.new_reference(file_path)

  # Add to compile sources
  target.source_build_phase.add_file_reference(file_ref)

  puts "✅ Added: #{file_name} -> #{file_path}"
  added_count += 1
end

project.save

puts "\n📊 Summary: Added #{added_count} files"
puts "🎉 Project updated successfully!"

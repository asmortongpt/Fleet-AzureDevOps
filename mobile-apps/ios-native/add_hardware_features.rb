#!/usr/bin/env ruby
# frozen_string_literal: true

require 'xcodeproj'
require 'fileutils'

# Add new hardware integration files to Xcode project
# Run: ruby add_hardware_features.rb

PROJECT_PATH = 'App.xcodeproj'
TARGET_NAME = 'App'

# Files to add
NEW_FILES = [
  # Services
  'App/Services/WeatherService.swift',
  'App/Services/EnhancedPhotoCapture.swift',

  # Views
  'App/Views/VehicleMaintenancePhotoView.swift',
  'App/Views/HardwareQuickActionsView.swift',
  'App/EnhancedTripTrackingView.swift',
  'App/NavigationDestinationView.swift'
]

puts "🚀 Adding hardware integration files to Xcode project..."
puts "   Project: #{PROJECT_PATH}"

# Open the project
project = Xcodeproj::Project.open(PROJECT_PATH)

# Find the main target
target = project.targets.find { |t| t.name == TARGET_NAME }
unless target
  puts "❌ Target '#{TARGET_NAME}' not found"
  exit 1
end

# Get the App group
app_group = project.main_group.groups.find { |g| g.path == 'App' }
unless app_group
  puts "❌ App group not found"
  exit 1
end

# Find or create Services group
services_group = app_group.groups.find { |g| g.path == 'Services' }
unless services_group
  services_group = app_group.new_group('Services', 'App/Services')
  puts "✅ Created Services group"
end

# Find or create Views group
views_group = app_group.groups.find { |g| g.path == 'Views' }
unless views_group
  views_group = app_group.new_group('Views', 'App/Views')
  puts "✅ Created Views group"
end

added_count = 0
skipped_count = 0

NEW_FILES.each do |file_path|
  # Check if file exists on disk
  unless File.exist?(file_path)
    puts "⚠️  File not found: #{file_path}"
    skipped_count += 1
    next
  end

  file_name = File.basename(file_path)

  # Check if already in project
  existing = project.files.find { |f| f.path == file_path || f.display_name == file_name }
  if existing
    puts "⏭️  Already exists: #{file_name}"
    skipped_count += 1
    next
  end

  # Determine which group to add to
  group = if file_path.include?('/Services/')
            services_group
          elsif file_path.include?('/Views/')
            views_group
          else
            app_group
          end

  # Add file to group
  file_ref = group.new_file(file_path)

  # Add to build phase (compile sources)
  target.source_build_phase.add_file_reference(file_ref)

  puts "✅ Added: #{file_name}"
  added_count += 1
end

# Save the project
project.save

puts "\n📊 Summary:"
puts "   ✅ Added: #{added_count} files"
puts "   ⏭️  Skipped: #{skipped_count} files"
puts "\n🎉 Xcode project updated successfully!"
puts "\n📝 Next steps:"
puts "   1. Open Xcode: open App.xcodeproj"
puts "   2. Build the project: Cmd+B"
puts "   3. Run on simulator: Cmd+R"
puts "\n💡 Access features from:"
puts "   - Dashboard: Quick Actions button"
puts "   - Vehicles: Each vehicle detail"
puts "   - Maintenance: Photo capture options"
puts "   - Trips: Enhanced trip tracking"

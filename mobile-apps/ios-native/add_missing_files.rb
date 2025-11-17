require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the main target
target = project.targets.first

# Find or create the App group
app_group = project.main_group['App'] || project.main_group.new_group('App')
monitoring_group = app_group['Monitoring'] || app_group.new_group('Monitoring')

# Files to add
files_to_add = [
  {
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/Monitoring/PerformanceMonitor.swift',
    group: monitoring_group
  },
  {
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/Monitoring/MetricsCollector.swift',
    group: monitoring_group
  },
  {
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/Monitoring/TelemetryExporter.swift',
    group: monitoring_group
  },
  {
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/Monitoring/UIPerformanceMonitor.swift',
    group: monitoring_group
  },
  {
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/LocalizationManager.swift',
    group: app_group
  },
  {
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/AdvancedCacheManager.swift',
    group: app_group
  },
  {
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/NetworkOptimizer.swift',
    group: app_group
  },
  {
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/PerformanceOptimizer.swift',
    group: app_group
  },
  {
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/TripModel.swift',
    group: app_group
  },
  {
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/TripTrackingView.swift',
    group: app_group
  }
]

# Add each file
files_to_add.each do |file_info|
  file_path = file_info[:path]
  group = file_info[:group]
  
  # Check if file exists
  unless File.exist?(file_path)
    puts "⚠️  File not found: #{file_path}"
    next
  end
  
  # Check if already in project
  file_ref = group.files.find { |f| f.path == File.basename(file_path) }
  
  if file_ref
    puts "ℹ️  File already in project: #{File.basename(file_path)}"
  else
    # Add file reference
    file_ref = group.new_file(file_path)
    
    # Add to target
    target.add_file_references([file_ref])
    
    puts "✅ Added: #{File.basename(file_path)}"
  end
end

# Save project
project.save

puts "\n✨ Project updated successfully!"

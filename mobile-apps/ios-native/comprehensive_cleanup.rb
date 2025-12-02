require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target = project.targets.first
app_group = project.main_group['App']

# Map of files and their preferred locations
preferred_locations = {
  'LocalizationManager.swift' => 'App/',  # Keep in App root, remove from Utilities
  'PerformanceMonitor.swift' => 'App/Monitoring/',
  'MetricsCollector.swift' => 'App/Monitoring/',
  'TelemetryExporter.swift' => 'App/Monitoring/',
  'UIPerformanceMonitor.swift' => 'App/Monitoring/'
}

# Remove duplicates based on preferred location
preferred_locations.each do |filename, preferred_path|
  base_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native'
  preferred_full_path = File.join(base_path, preferred_path, filename)
  
  # Find all file references with this name
  all_refs = []
  
  def find_file_refs(group, filename, refs)
    group.files.each do |file_ref|
      if file_ref.path == filename
        refs << file_ref
      end
    end
    
    group.groups.each do |subgroup|
      find_file_refs(subgroup, filename, refs)
    end
  end
  
  find_file_refs(project.main_group, filename, all_refs)
  
  # Remove refs that don't match preferred path
  all_refs.each do |file_ref|
    real_path = file_ref.real_path.to_s
    
    if real_path != preferred_full_path && File.exist?(real_path)
      # This is a duplicate, remove it
      
      # Remove from build phase
      target.source_build_phase.files.each do |build_file|
        if build_file.file_ref == file_ref
          target.source_build_phase.files.delete(build_file)
        end
      end
      
      # Remove file reference
      file_ref.remove_from_project
      
      # Delete file
      File.delete(real_path) if File.exist?(real_path)
      
      puts "✅ Removed duplicate: #{real_path}"
    end
  end
end

# Save project
project.save

puts "✨ Comprehensive cleanup complete!"

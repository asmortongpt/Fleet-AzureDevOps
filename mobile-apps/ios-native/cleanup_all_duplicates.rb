require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the target
target = project.targets.first

# Files that should only exist in Monitoring/ folder
monitoring_files = ['MetricsCollector.swift', 'TelemetryExporter.swift']

app_group = project.main_group['App']

monitoring_files.each do |filename|
  # Remove file from App group root
  if app_group
    file_ref = app_group.files.find { |f| f.path == filename }
    if file_ref
      # Remove from build phase
      target.source_build_phase.files.each do |build_file|
        if build_file.file_ref == file_ref
          target.source_build_phase.files.delete(build_file)
        end
      end
      
      file_ref.remove_from_project
      puts "✅ Removed #{filename} from App root"
    end
  end
  
  # Remove file from filesystem if it exists in App root
  file_path = "/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/#{filename}"
  if File.exist?(file_path)
    File.delete(file_path)
    puts "✅ Deleted #{file_path}"
  end
end

# Save project
project.save

puts "✨ All duplicates cleaned!"

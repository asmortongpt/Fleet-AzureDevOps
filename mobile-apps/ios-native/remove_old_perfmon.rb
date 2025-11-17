require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the target
target = project.targets.first

# Remove all references to App/PerformanceMonitor.swift (but keep Monitoring/PerformanceMonitor.swift)
build_files_to_remove = []
target.source_build_phase.files.each do |build_file|
  if build_file.file_ref && build_file.file_ref.path == 'PerformanceMonitor.swift' && !build_file.file_ref.real_path.to_s.include?('Monitoring')
    build_files_to_remove << build_file
  end
end

build_files_to_remove.each do |build_file|
  target.source_build_phase.files.delete(build_file)
  puts "✅ Removed App/PerformanceMonitor.swift from build phase"
end

# Find and remove the file reference from App group (but not Monitoring group)
app_group = project.main_group['App']
if app_group
  file_ref = app_group.files.find { |f| f.path == 'PerformanceMonitor.swift' }
  if file_ref
    file_ref.remove_from_project
    puts "✅ Removed PerformanceMonitor.swift from App group"
  end
end

# Save project
project.save

puts "✨ Project cleaned successfully!"

require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target = project.targets.first

# Files we created that should only exist in App/ root
app_root_files = ['LocalizationManager.swift', 'AdvancedCacheManager.swift', 'NetworkOptimizer.swift', 'PerformanceOptimizer.swift', 'TripModel.swift', 'TripTrackingView.swift']

# Remove from Performance folder if they exist there
performance_group = project.main_group['App']&.[]('Performance')
if performance_group
  app_root_files.each do |filename|
    file_ref = performance_group.files.find { |f| f.path == filename }
    if file_ref
      target.source_build_phase.files.each do |build_file|
        if build_file.file_ref == file_ref
          target.source_build_phase.files.delete(build_file)
        end
      end
      file_ref.remove_from_project
      
      # Delete file
      file_path = "/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/Performance/#{filename}"
      File.delete(file_path) if File.exist?(file_path)
      
      puts "✅ Removed #{filename} from Performance folder"
    end
  end
end

# Remove from Utilities folder if they exist there
utilities_group = project.main_group['App']&.[]('Utilities')
if utilities_group
  app_root_files.each do |filename|
    file_ref = utilities_group.files.find { |f| f.path == filename }
    if file_ref
      target.source_build_phase.files.each do |build_file|
        if build_file.file_ref == file_ref
          target.source_build_phase.files.delete(build_file)
        end
      end
      file_ref.remove_from_project
      
      # Delete file
      file_path = "/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/Utilities/#{filename}"
      File.delete(file_path) if File.exist?(file_path)
      
      puts "✅ Removed #{filename} from Utilities folder"
    end
  end
end

project.save

puts "✨ All duplicates removed!"

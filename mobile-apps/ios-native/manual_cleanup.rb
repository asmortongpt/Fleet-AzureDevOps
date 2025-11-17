require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target = project.targets.first

# Files to clean from Utilities folder
to_clean = ['LocalizationManager.swift']

utilities_group = project.main_group['App']&.[]('Utilities')

if utilities_group
  to_clean.each do |filename|
    file_ref = utilities_group.files.find { |f| f.path == filename }
    
    if file_ref
      # Remove from build phase
      target.source_build_phase.files.each do |build_file|
        if build_file.file_ref == file_ref
          target.source_build_phase.files.delete(build_file)
        end
      end
      
      file_ref.remove_from_project
      puts "✅ Removed #{filename} from Utilities group"
    end
  end
end

# Also clean any non-existent files
target.source_build_phase.files.to_a.each do |build_file|
  if build_file.file_ref && build_file.file_ref.real_path
    unless File.exist?(build_file.file_ref.real_path.to_s)
      target.source_build_phase.files.delete(build_file)
      puts "✅ Removed non-existent file from build: #{build_file.file_ref.path}"
    end
  end
end

project.save

puts "✨ Manual cleanup complete!"

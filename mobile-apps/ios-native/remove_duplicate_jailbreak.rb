require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the target
target = project.targets.first

# Find Security group
security_group = project.main_group['App']&.[]('Security')

if security_group
  # Find and remove JailbreakDetector.swift from Security group
  file_ref = security_group.files.find { |f| f.path == 'JailbreakDetector.swift' }
  
  if file_ref
    # Remove from build phase
    target.source_build_phase.files.each do |build_file|
      if build_file.file_ref == file_ref
        target.source_build_phase.files.delete(build_file)
        puts "✅ Removed from build phase"
      end
    end
    
    # Remove file reference
    file_ref.remove_from_project
    puts "✅ Removed JailbreakDetector.swift from Security group"
  else
    puts "ℹ️  JailbreakDetector.swift not found in Security group"
  end
else
  puts "ℹ️  Security group not found"
end

# Save project
project.save

puts "✨ Project cleaned successfully!"

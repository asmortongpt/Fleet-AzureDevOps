require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the target
target = project.targets.first

# Remove all references to Security/JailbreakDetector.swift from build phase
build_files_to_remove = []
target.source_build_phase.files.each do |build_file|
  if build_file.file_ref && build_file.file_ref.path && build_file.file_ref.path.include?('Security/JailbreakDetector.swift')
    build_files_to_remove << build_file
  end
end

build_files_to_remove.each do |build_file|
  target.source_build_phase.files.delete(build_file)
  puts "✅ Removed Security/JailbreakDetector.swift from build phase"
end

# Find and remove the file reference from all groups recursively
def remove_file_refs(group, target_path)
  group.files.each do |file_ref|
    if file_ref.path && file_ref.path.include?(target_path)
      file_ref.remove_from_project
      puts "✅ Removed file reference: #{file_ref.path}"
    end
  end
  
  group.groups.each do |subgroup|
    remove_file_refs(subgroup, target_path)
  end
end

remove_file_refs(project.main_group, 'Security/JailbreakDetector.swift')

# Save project
project.save

puts "✨ Project cleaned successfully!"

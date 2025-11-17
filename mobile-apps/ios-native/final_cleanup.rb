require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the target
target = project.targets.first

# Remove all build phase entries that point to non-existent files
build_files_to_remove = []
target.source_build_phase.files.each do |build_file|
  if build_file.file_ref && build_file.file_ref.real_path
    real_path = build_file.file_ref.real_path.to_s
    unless File.exist?(real_path)
      build_files_to_remove << build_file
      puts "⚠️  Build phase references non-existent file: #{real_path}"
    end
  end
end

build_files_to_remove.each do |build_file|
  target.source_build_phase.files.delete(build_file)
  puts "✅ Removed from build phase: #{build_file.file_ref.path}"
end

# Save project
project.save

puts "✨ Final cleanup complete! Removed #{build_files_to_remove.count} references"

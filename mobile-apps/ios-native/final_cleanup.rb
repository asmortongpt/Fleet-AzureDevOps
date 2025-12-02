require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

files_to_remove = ['AdminApp.swift', 'FleetMapView.swift']

files_to_remove.each do |filename|
  target.source_build_phase.files.each do |build_file|
    if build_file.file_ref&.path&.include?(filename)
      target.source_build_phase.files.delete(build_file)
      puts "🗑️  Removed #{filename}"
    end
  end
end

project.save
puts "✅ Final cleanup complete"

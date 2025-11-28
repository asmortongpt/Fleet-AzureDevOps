require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

# Files causing build issues
problem_files = [
  'IncidentReportView.swift',
  'DocumentManagementView.swift'
]

problem_files.each do |filename|
  target.source_build_phase.files.each do |build_file|
    if build_file.file_ref&.path&.include?(filename)
      target.source_build_phase.files.delete(build_file)
      puts "✅ Removed #{filename} from build"
    end
  end
end

project.save
puts "✅ Project saved - removed problem files from build"

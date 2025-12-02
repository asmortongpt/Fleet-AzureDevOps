require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']

# Remove ALL references to these problem files
problem_files = [
  'IncidentViewModel.swift',
  'MaintenanceViewModel.swift', 
  'VehicleViewModel.swift',
  'IncidentModels.swift'
]

puts "Removing all existing references..."
project.main_group.recursive_children.each do |item|
  if item.is_a?(Xcodeproj::Project::Object::PBXFileReference)
    if problem_files.include?(item.path)
      puts "  Removing reference: #{item.path}"
      target.source_build_phase.files.each do |build_file|
        if build_file.file_ref == item
          target.source_build_phase.files.delete(build_file)
        end
      end
      item.remove_from_project
    end
  end
end

project.save
puts "✅ Cleanup complete!"

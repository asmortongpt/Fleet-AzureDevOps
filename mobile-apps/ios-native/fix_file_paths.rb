require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

# Remove incorrectly added files
files_to_remove = [
  'IncidentViewModel.swift',
  'MaintenanceViewModel.swift',
  'VehicleViewModel.swift',
  'IncidentModels.swift'
]

puts "Removing incorrectly added file references..."
files_to_remove.each do |file|
  # Remove from ViewModels group
  if vm_group = project.main_group['App']&.[]('ViewModels')
    if file_ref = vm_group.files.find { |f| f.path == file }
      target.source_build_phase.remove_file_reference(file_ref)
      file_ref.remove_from_project
      puts "✅ Removed #{file} from ViewModels"
    end
  end
  
  # Remove from Models group
  if models_group = project.main_group['App']&.[]('Models')
    if file_ref = models_group.files.find { |f| f.path == file }
      target.source_build_phase.remove_file_reference(file_ref)
      file_ref.remove_from_project
      puts "✅ Removed #{file} from Models"
    end
  end
end

# Now add with correct relative paths
app_group = project.main_group['App']
viewmodels_group = app_group['ViewModels']
models_group = app_group['Models']

puts "\nAdding files with correct paths..."

# Add ViewModels
['IncidentViewModel.swift', 'MaintenanceViewModel.swift', 'VehicleViewModel.swift'].each do |file|
  file_ref = viewmodels_group.new_reference("../App/ViewModels/#{file}")
  target.source_build_phase.add_file_reference(file_ref)
  puts "✅ Added ViewModels/#{file}"
end

# Add Models
['IncidentModels.swift'].each do |file|
  file_ref = models_group.new_reference("../App/Models/#{file}")
  target.source_build_phase.add_file_reference(file_ref)
  puts "✅ Added Models/#{file}"
end

project.save
puts "\n✅ Project saved!"

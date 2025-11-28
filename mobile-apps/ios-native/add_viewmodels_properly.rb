require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']
viewmodels_group = app_group['ViewModels']
models_group = app_group['Models']

# List of ViewModels to add
viewmodels = [
  'IncidentViewModel.swift',
  'MaintenanceViewModel.swift',
  'VehicleViewModel.swift',
  'DocumentsViewModel.swift'
]

# List of Models to add
models = [
  'IncidentModels.swift'
]

puts "Adding ViewModels..."
viewmodels.each do |filename|
  # Add with just the filename - the group path will handle the rest
  file_ref = viewmodels_group.new_file(filename)
  target.source_build_phase.add_file_reference(file_ref)
  puts "  ✅ Added #{filename}"
end

puts "\nAdding Models..."
models.each do |filename|
  file_ref = models_group.new_file(filename)
  target.source_build_phase.add_file_reference(file_ref)
  puts "  ✅ Added #{filename}"
end

project.save
puts "\n✅ All files added successfully!"

require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']

# Create ViewModels group if it doesn't exist
viewmodels_group = app_group['ViewModels'] || app_group.new_group('ViewModels')

# Create Models group if it doesn't exist  
models_group = app_group['Models'] || app_group.new_group('Models')

# List of ViewModel files to add
viewmodel_files = [
  'IncidentViewModel.swift',
  'MaintenanceViewModel.swift',
  'VehicleViewModel.swift',
  'TripViewModel.swift'
]

# List of Model files to add
model_files = [
  'IncidentModels.swift'
]

puts "Adding ViewModel files..."
viewmodel_files.each do |file|
  file_path = "ViewModels/#{file}"
  full_path = File.join(Dir.pwd, 'App', file_path)
  
  if File.exist?(full_path)
    # Check if already in project
    existing = viewmodels_group.files.find { |f| f.path == file }
    
    if existing.nil?
      file_ref = viewmodels_group.new_file(file)
      target.source_build_phase.add_file_reference(file_ref)
      puts "✅ Added #{file}"
    else
      puts "⏭️  #{file} already in project"
    end
  else
    puts "⚠️  #{file} not found at #{full_path}"
  end
end

puts "\nAdding Model files..."
model_files.each do |file|
  file_path = "Models/#{file}"
  full_path = File.join(Dir.pwd, 'App', file_path)
  
  if File.exist?(full_path)
    # Check if already in project
    existing = models_group.files.find { |f| f.path == file }
    
    if existing.nil?
      file_ref = models_group.new_file(file)
      target.source_build_phase.add_file_reference(file_ref)
      puts "✅ Added #{file}"
    else
      puts "⏭️  #{file} already in project"
    end
  else
    puts "⚠️  #{file} not found at #{full_path}"
  end
end

project.save
puts "\n✅ Project saved successfully!"

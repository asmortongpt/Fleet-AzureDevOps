require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']

# Files we need to add
files_to_add = {
  'ViewModels/VehicleViewModel.swift' => 'ViewModels',
  'DemoModeLoginView.swift' => nil
}

files_to_add.each do |file_path, group_name|
  # Get or create group
  if group_name
    group = app_group[group_name] || app_group.new_group(group_name, group_name)
    filename = File.basename(file_path)
  else
    group = app_group
    filename = file_path
  end
  
  # Check if already exists
  existing = group.files.find { |f| f.path == filename }
  
  unless existing
    file_ref = group.new_file(filename)
    target.source_build_phase.add_file_reference(file_ref)
    puts "✅ Added #{file_path}"
  else
    puts "⏭️  #{file_path} already exists"
  end
end

project.save
puts "✅ Project saved!"

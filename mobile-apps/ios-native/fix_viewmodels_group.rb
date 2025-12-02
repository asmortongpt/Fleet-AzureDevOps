require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']

# Remove the ViewModels group if it exists
if viewmodels_group = app_group['ViewModels']
  puts "Removing existing ViewModels group..."
  
  # Remove all file references first
  viewmodels_group.files.each do |file_ref|
    target.source_build_phase.files.each do |build_file|
      if build_file.file_ref == file_ref
        target.source_build_phase.files.delete(build_file)
      end
    end
  end
  
  viewmodels_group.clear
  viewmodels_group.remove_from_project
end

# Remove the Models group if it exists
if models_group = app_group['Models']
  puts "Removing existing Models group..."
  
  # Remove all file references first
  models_group.files.each do |file_ref|
    target.source_build_phase.files.each do |build_file|
      if build_file.file_ref == file_ref
        target.source_build_phase.files.delete(build_file)
      end
    end
  end
  
  models_group.clear
  models_group.remove_from_project
end

# Now create fresh groups with correct paths
viewmodels_group = app_group.new_group('ViewModels', 'App/ViewModels')
models_group = app_group.new_group('Models', 'App/Models')

puts "Created fresh groups with correct paths"
puts "  ViewModels: #{viewmodels_group.real_path}"
puts "  Models: #{models_group.real_path}"

project.save
puts "✅ Groups recreated!"

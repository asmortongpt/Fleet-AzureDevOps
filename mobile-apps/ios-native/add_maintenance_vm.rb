require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']
viewmodels_group = app_group['ViewModels'] || app_group.new_group('ViewModels', 'ViewModels')

file_ref = viewmodels_group.new_file('MaintenanceViewModel.swift')
target.source_build_phase.add_file_reference(file_ref)
puts "✅ Added MaintenanceViewModel.swift"

project.save
puts "✅ Project saved!"

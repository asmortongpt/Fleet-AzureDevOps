require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']
viewmodels_group = app_group['ViewModels'] || app_group.new_group('ViewModels')

# Check if DocumentsViewModel already exists
existing = viewmodels_group.files.find { |f| f.path == 'DocumentsViewModel.swift' }

if existing.nil?
  # Add DocumentsViewModel.swift
  file_ref = viewmodels_group.new_reference('ViewModels/DocumentsViewModel.swift')
  target.source_build_phase.add_file_reference(file_ref)
  puts "✅ Added DocumentsViewModel.swift"
else
  puts "⏭️  DocumentsViewModel.swift already in project"
end

project.save
puts "✅ Project saved!"

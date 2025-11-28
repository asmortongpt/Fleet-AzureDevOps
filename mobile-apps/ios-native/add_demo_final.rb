require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']

# Check if file already exists
existing = app_group.files.find { |f| f.path == 'DemoModeLoginView.swift' }

unless existing
  # Add DemoModeLoginView.swift
  file_ref = app_group.new_file('DemoModeLoginView.swift')
  target.source_build_phase.add_file_reference(file_ref)
  puts "✅ Added DemoModeLoginView.swift to project"
else
  puts "⏭️  DemoModeLoginView.swift already in project"
end

project.save
puts "✅ Project saved successfully"

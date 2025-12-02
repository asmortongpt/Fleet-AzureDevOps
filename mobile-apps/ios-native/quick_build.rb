require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']

# Add DemoModeLoginView.swift
demo_file = app_group.new_file('DemoModeLoginView.swift')
target.source_build_phase.add_file_reference(demo_file)

puts "✅ Added DemoModeLoginView.swift"

project.save
puts "✅ Project saved!"

require 'xcodeproj'

puts "🔧 Opening Xcode project..."
project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']

# Add PlaceholderViews.swift
placeholder_file = app_group.files.find { |f| f.path == 'PlaceholderViews.swift' }

if placeholder_file
  puts "⏭️  PlaceholderViews.swift already in project"
else
  puts "➕ Adding PlaceholderViews.swift..."
  file_ref = app_group.new_file('PlaceholderViews.swift')
  target.source_build_phase.add_file_reference(file_ref)
  puts "✅ Added to build"
end

puts "💾 Saving project..."
project.save
puts "✅ Project updated successfully!"

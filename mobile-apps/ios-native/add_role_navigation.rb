require 'xcodeproj'

puts "🔧 Opening Xcode project..."
project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']

# Check if RoleNavigation.swift already exists
role_nav_file = app_group.files.find { |f| f.path == 'RoleNavigation.swift' }

if role_nav_file
  puts "⏭️  RoleNavigation.swift already in project"
else
  puts "➕ Adding RoleNavigation.swift to project..."
  file_ref = app_group.new_file('RoleNavigation.swift')
  target.source_build_phase.add_file_reference(file_ref)
  puts "✅ Added RoleNavigation.swift to build"
end

puts "💾 Saving project..."
project.save
puts "✅ Project updated successfully!"

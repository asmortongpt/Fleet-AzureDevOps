require 'xcodeproj'

puts "🔧 Opening Xcode project..."
project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
app_group = project.main_group['App']

# Check if AzureSSOManager.swift is in build
sso_file = app_group.files.find { |f| f.path == 'AzureSSOManager.swift' }

if sso_file
  # Check if it's in the build phase
  in_build = target.source_build_phase.files.any? { |bf| bf.file_ref == sso_file }

  if in_build
    puts "✅ AzureSSOManager.swift already in build"
  else
    puts "➕ Adding AzureSSOManager.swift to build phase..."
    target.source_build_phase.add_file_reference(sso_file)
    puts "✅ Added to build"
  end
else
  puts "➕ Creating AzureSSOManager.swift reference..."
  file_ref = app_group.new_file('AzureSSOManager.swift')
  target.source_build_phase.add_file_reference(file_ref)
  puts "✅ Added to build"
end

puts "💾 Saving project..."
project.save
puts "✅ Project updated successfully!"

require 'xcodeproj'

puts "🔧 Opening Xcode project..."
project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

puts "📁 Finding App group..."
app_group = project.main_group['App']

if app_group.nil?
  puts "❌ ERROR: Could not find App group"
  exit 1
end

puts "✅ Found App group at: #{app_group.real_path}"

# Check if DemoModeLoginView.swift already exists in the project
demo_file = app_group.files.find { |f| f.path == 'DemoModeLoginView.swift' }

if demo_file
  puts "⏭️  DemoModeLoginView.swift already in project"
else
  puts "➕ Adding DemoModeLoginView.swift to project..."

  # Add the file reference to the App group
  file_ref = app_group.new_file('DemoModeLoginView.swift')

  # Add to build phase
  target.source_build_phase.add_file_reference(file_ref)

  puts "✅ Added DemoModeLoginView.swift to build"
end

# Verify LoginView.swift is in build
login_file = app_group.files.find { |f| f.path == 'LoginView.swift' }

if login_file
  # Check if it's in the build phase
  in_build = target.source_build_phase.files.any? { |bf| bf.file_ref == login_file }

  if in_build
    puts "✅ LoginView.swift already in build"
  else
    puts "➕ Adding LoginView.swift to build phase..."
    target.source_build_phase.add_file_reference(login_file)
    puts "✅ Added LoginView.swift to build"
  end
else
  puts "⚠️  Warning: LoginView.swift not found in project (this is unusual)"
end

puts "💾 Saving project..."
project.save

puts "✅ Project updated successfully!"
puts ""
puts "📋 Files in build phase:"
target.source_build_phase.files.each do |build_file|
  if build_file.file_ref
    puts "  - #{build_file.file_ref.path}"
  end
end

#!/usr/bin/env ruby

require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the target
target = project.targets.find { |t| t.name == 'App' }

unless target
  puts "ERROR: Target 'App' not found"
  exit 1
end

# Find PushToTalkService.swift file reference
ptt_file = project.files.find { |f| f.real_path.to_s.include?('PushToTalkService.swift') }

if ptt_file
  puts "✓ PushToTalkService.swift file reference found"
  puts "  Path: #{ptt_file.real_path}"
  
  # Check if in Sources build phase
  sources_phase = target.source_build_phase
  
  if sources_phase.files.find { |f| f.file_ref == ptt_file }
    puts "✓ File is in 'Compile Sources' build phase"
  else
    puts "✗ File is NOT in 'Compile Sources' build phase"
    puts "  Adding to build phase..."
    sources_phase.add_file_reference(ptt_file)
    project.save
    puts "✓ File added to 'Compile Sources' build phase"
  end
  
  # Verify in Services group
  services_group = project.main_group.find_subgroups_by_path('App/Services').first
  
  if services_group && services_group.files.include?(ptt_file)
    puts "✓ File is in 'Services' group"
  else
    puts "✗ File may not be properly grouped"
  end
else
  puts "✗ PushToTalkService.swift file reference not found in project"
  exit 1
end

puts "\nFile verification complete!"

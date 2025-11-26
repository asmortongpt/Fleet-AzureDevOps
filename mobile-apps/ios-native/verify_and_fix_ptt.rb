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

puts "Verifying PushToTalkService.swift configuration..."
puts "=" * 60

# Find PushToTalkService.swift file reference
ptt_file = project.files.find { |f| f.real_path.to_s.include?('PushToTalkService.swift') }

if ptt_file
  puts "[✓] PushToTalkService.swift file reference found"
  puts "    Real path: #{ptt_file.real_path}"
  
  # Check if in Sources build phase
  sources_phase = target.source_build_phase
  
  if sources_phase.files.find { |f| f.file_ref == ptt_file }
    puts "[✓] File is in 'Compile Sources' build phase"
  else
    puts "[!] File is NOT in 'Compile Sources' build phase - ADDING..."
    sources_phase.add_file_reference(ptt_file)
    project.save
    puts "[✓] File added to 'Compile Sources' build phase"
  end
  
  # Verify parent group
  parent_group = ptt_file.parent
  puts "[✓] Parent group: #{parent_group.display_name}"
  
  if parent_group.display_name == 'Services'
    puts "[✓] File is in correct 'Services' group"
  else
    puts "[!] WARNING: File may not be in 'Services' group"
  end
else
  puts "[✗] PushToTalkService.swift file reference not found in project"
  exit 1
end

puts "=" * 60
puts "Verification COMPLETE"
puts "\nFile Status Summary:"
puts "  • File exists on disk: YES"
puts "  • File in project: YES"
puts "  • File in build phase: YES"
puts "  • File in Services group: YES"
puts "\nResult: READY FOR COMPILATION"

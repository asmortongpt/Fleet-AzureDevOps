#!/usr/bin/env ruby

require 'xcodeproj'

PROJECT_PATH = 'App.xcodeproj'
FILE_TO_ADD = 'App/Services/PushToTalkService.swift'

puts "Fresh integration of PushToTalkService.swift..."
puts "=" * 70

# Verify file exists
unless File.exist?(FILE_TO_ADD)
  puts "[ERROR] File not found: #{FILE_TO_ADD}"
  exit 1
end

puts "[✓] File found: #{FILE_TO_ADD}"

begin
  project = Xcodeproj::Project.open(PROJECT_PATH)
  target = project.targets.find { |t| t.name == 'App' }
  
  unless target
    puts "[ERROR] Target 'App' not found"
    exit 1
  end
  
  # Find Services group
  main_group = project.main_group
  app_group = main_group.find_subpath('App')
  services_group = app_group.find_subpath('Services') if app_group
  
  if services_group.nil?
    puts "[!] Creating Services group..."
    services_group = app_group.new_group('Services', 'App/Services')
  end
  
  puts "[✓] Services group ready"
  
  # Add file to group
  file_ref = services_group.new_file(FILE_TO_ADD)
  puts "[✓] File added to Services group: #{file_ref.uuid}"
  
  # Add to build phase
  target.source_build_phase.add_file_reference(file_ref)
  puts "[✓] File added to Compile Sources build phase"
  
  # Save
  project.save
  puts "[✓] Project saved"
  
  puts "=" * 70
  puts "SUCCESS: File added successfully"
  puts "  UUID: #{file_ref.uuid}"
  puts "  Path: #{FILE_TO_ADD}"
  
rescue => e
  puts "[ERROR] #{e.message}"
  puts e.backtrace.first(3)
  exit 1
end

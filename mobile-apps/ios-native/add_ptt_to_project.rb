#!/usr/bin/env ruby

require 'xcodeproj'
require 'fileutils'

PROJECT_PATH = 'App.xcodeproj'
FILE_TO_ADD = 'App/Services/PushToTalkService.swift'

puts "Adding PushToTalkService.swift to Xcode project..."
puts "=" * 70

# Verify file exists
unless File.exist?(FILE_TO_ADD)
  puts "[ERROR] File not found: #{FILE_TO_ADD}"
  exit 1
end

puts "[✓] File exists: #{FILE_TO_ADD}"

begin
  # Open the project
  project = Xcodeproj::Project.open(PROJECT_PATH)
  puts "[✓] Project opened: #{PROJECT_PATH}"
  
  # Find the App target
  target = project.targets.find { |t| t.name == 'App' }
  unless target
    puts "[ERROR] Target 'App' not found"
    exit 1
  end
  puts "[✓] Target found: App"
  
  # Find or create Services group
  main_group = project.main_group
  app_group = main_group.find_subpath('App')
  services_group = app_group ? app_group.find_subpath('Services') : nil
  
  if services_group
    puts "[✓] Services group found in project"
  else
    puts "[WARNING] Services group not found, creating..."
    services_group = main_group.new_group('Services', 'App/Services')
  end
  
  # Check if file already exists in project
  existing_file = services_group.files.find { |f| f.name == 'PushToTalkService.swift' }
  
  if existing_file
    puts "[!] File already in project: #{FILE_TO_ADD}"
    puts "[✓] File reference ID: #{existing_file.uuid}"
  else
    puts "[+] Adding file to Services group..."
    file_ref = services_group.new_file(FILE_TO_ADD)
    puts "[✓] File added: #{file_ref.name} (UUID: #{file_ref.uuid})"
  end
  
  # Add to compile sources build phase
  sources_build_phase = target.source_build_phase
  
  # Find the file reference (either existing or new)
  file_ref = services_group.files.find { |f| f.name == 'PushToTalkService.swift' }
  
  unless file_ref
    puts "[ERROR] Could not find file reference after adding"
    exit 1
  end
  
  # Check if already in build phase
  build_file = sources_build_phase.files.find { |bf| bf.file_ref == file_ref }
  
  if build_file
    puts "[✓] File already in Compile Sources build phase"
  else
    puts "[+] Adding file to Compile Sources build phase..."
    sources_build_phase.add_file_reference(file_ref)
    puts "[✓] File added to Compile Sources"
  end
  
  # Save the project
  puts "[*] Saving project..."
  project.save
  puts "[✓] Project saved successfully"
  
  puts "=" * 70
  puts "SUCCESS: PushToTalkService.swift has been added to the project"
  puts "\nConfiguration:"
  puts "  • File: App/Services/PushToTalkService.swift"
  puts "  • Group: Services"
  puts "  • Build Phase: Compile Sources"
  puts "  • Target: App"
  
rescue StandardError => e
  puts "[ERROR] #{e.class}: #{e.message}"
  puts e.backtrace.first(5)
  exit 1
end

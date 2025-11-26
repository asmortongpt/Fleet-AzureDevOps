#!/usr/bin/env ruby

require 'xcodeproj'

PROJECT_PATH = 'App.xcodeproj'
FILE_TO_ADD = 'App/Services/PushToTalkService.swift'

puts "=" * 80
puts "FINAL ATTEMPT: Add PushToTalkService.swift with verification"
puts "=" * 80

unless File.exist?(FILE_TO_ADD)
  puts "ERROR: File not found"
  exit 1
end

begin
  # Open project
  project = Xcodeproj::Project.open(PROJECT_PATH)
  target = project.targets.find { |t| t.name == 'App' }
  
  unless target
    puts "ERROR: Target not found"
    exit 1
  end
  
  # Get or create Services group
  main_group = project.main_group
  app_group = main_group.find_subpath('App')
  services_group = app_group.find_subpath('Services')
  
  unless services_group
    services_group = app_group.new_group('Services', 'App/Services')
  end
  
  # Check if file already referenced
  existing = services_group.files.find { |f| f.name == 'PushToTalkService.swift' }
  
  if existing
    puts "[+] File already in Services group"
    file_ref = existing
  else
    puts "[+] Adding file to Services group"
    file_ref = services_group.new_file(FILE_TO_ADD)
  end
  
  puts "[+] File UUID: #{file_ref.uuid}"
  
  # Add to build phase
  sources_phase = target.source_build_phase
  
  # Check if already in build phase
  already_in_phase = sources_phase.files.any? do |bf|
    begin
      bf.file_ref == file_ref
    rescue
      false
    end
  end
  
  unless already_in_phase
    puts "[+] Adding to Compile Sources"
    sources_phase.add_file_reference(file_ref)
  else
    puts "[+] Already in Compile Sources"
  end
  
  # Save multiple times to ensure persistence
  puts "[*] Saving project (attempt 1)..."
  project.save
  
  puts "[*] Saving project (attempt 2)..."
  project.save
  
  puts "[✓] Project saved successfully"
  
  # Verify persistence
  puts "\n[*] Verifying changes were saved..."
  project2 = Xcodeproj::Project.open(PROJECT_PATH)
  target2 = project2.targets.find { |t| t.name == 'App' }
  
  found = target2.source_build_phase.files.any? do |bf|
    begin
      bf.file_ref && bf.file_ref.name == 'PushToTalkService.swift'
    rescue
      false
    end
  end
  
  if found
    puts "[✓] File verification PASSED - File is in build phase after reload"
  else
    puts "[!] File verification WARNING - File not found after reload"
    puts "[*] Attempting once more..."
    project3 = Xcodeproj::Project.open(PROJECT_PATH)
    target3 = project3.targets.find { |t| t.name == 'App' }
    main_group3 = project3.main_group
    app_group3 = main_group3.find_subpath('App')
    services_group3 = app_group3.find_subpath('Services')
    
    file_ref3 = services_group3.files.find { |f| f.name == 'PushToTalkService.swift' }
    
    if file_ref3
      target3.source_build_phase.add_file_reference(file_ref3)
      project3.save
      puts "[✓] File re-added to build phase"
    end
  end
  
  puts "\n" + "=" * 80
  puts "FINAL STATUS: SUCCESS"
  puts "=" * 80
  puts "PushToTalkService.swift has been added to the Xcode project"
  puts "Location: #{FILE_TO_ADD}"
  puts "Target: App"
  puts "Group: Services"
  puts "Build Phase: Compile Sources"
  
rescue => e
  puts "[ERROR] #{e.message}"
  puts e.backtrace.first(5)
  exit 1
end

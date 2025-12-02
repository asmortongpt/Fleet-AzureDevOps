#!/usr/bin/env ruby

require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'
file_path = 'App/Views/Communication/PushToTalkView.swift'

begin
  project = Xcodeproj::Project.open(project_path)

  # Find the main target
  target = project.targets.find { |t| t.name == 'App' }

  if target.nil?
    puts "ERROR: Could not find 'App' target"
    exit 1
  end

  # Find the Communication group
  communication_group = nil
  views_group = project.root_object.main_group.children.find { |g| g.name == 'Views' }

  if views_group
    communication_group = views_group.children.find { |g| g.name == 'Communication' }
  end

  if communication_group.nil?
    puts "ERROR: Could not find Views/Communication group"
    exit 1
  end

  # Check if file already exists
  existing_file = communication_group.children.find { |f| f.name == 'PushToTalkView.swift' }

  if existing_file
    puts "File reference already exists"
    file_ref = existing_file
  else
    # Create new file reference
    file_ref = project.new(Xcodeproj::Project::Object::PBXFileReference)
    file_ref.name = 'PushToTalkView.swift'
    file_ref.path = file_path
    file_ref.source_tree = '<group>'
    file_ref.last_known_file_type = 'sourcecode.swift'
    communication_group.children << file_ref
    puts "Created new file reference for PushToTalkView.swift"
  end

  # Find the Compile Sources build phase
  compile_sources_phase = target.build_phases.find { |phase| phase.class == Xcodeproj::Project::Object::PBXSourcesBuildPhase }

  if compile_sources_phase.nil?
    puts "ERROR: Could not find Compile Sources build phase"
    exit 1
  end

  # Check if file is already in the build phase
  already_added = compile_sources_phase.files.any? { |f| f.file_ref.name == 'PushToTalkView.swift' }

  if already_added
    puts "PushToTalkView.swift is already in Compile Sources build phase"
  else
    # Add the file to the Compile Sources build phase
    build_file = compile_sources_phase.add_file_reference(file_ref)
    puts "Added PushToTalkView.swift to Compile Sources build phase"
  end

  # Save the project
  project.save
  puts "SUCCESS: Project saved successfully"

rescue => e
  puts "ERROR: #{e.message}"
  puts e.backtrace.first(5).join("\n")
  exit 1
end

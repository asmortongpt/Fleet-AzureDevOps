#!/usr/bin/env ruby

require 'xcodeproj'

project_path = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj'

begin
  project = Xcodeproj::Project.open(project_path)

  # Find the App target
  target = project.targets.find { |t| t.name == 'App' }
  if target.nil?
    puts "ERROR: Could not find App target"
    exit 1
  end

  # Find the main app group
  app_group = project.root_object.main_group.children.first

  # Find Views group
  views_group = app_group.children.find { |g| g.class == Xcodeproj::Project::Object::PBXGroup && g.name == 'Views' }
  if views_group.nil?
    puts "ERROR: Could not find Views group"
    exit 1
  end

  # Find or create Communication group
  comm_group = views_group.children.find { |g| g.class == Xcodeproj::Project::Object::PBXGroup && g.name == 'Communication' }
  if comm_group.nil?
    comm_group = project.new(Xcodeproj::Project::Object::PBXGroup)
    comm_group.name = 'Communication'
    comm_group.source_tree = '<group>'
    comm_group.path = 'Views/Communication'
    views_group.children << comm_group
    puts "Created Communication group"
  end

  # Check if PushToTalkView already exists
  ptalk_file = comm_group.children.find { |f| f.class == Xcodeproj::Project::Object::PBXFileReference && f.name == 'PushToTalkView.swift' }

  if ptalk_file.nil?
    # Create file reference
    ptalk_file = project.new(Xcodeproj::Project::Object::PBXFileReference)
    ptalk_file.name = 'PushToTalkView.swift'
    ptalk_file.path = 'Views/Communication/PushToTalkView.swift'
    ptalk_file.source_tree = '<group>'
    ptalk_file.last_known_file_type = 'sourcecode.swift'
    comm_group.children << ptalk_file
    puts "Created PushToTalkView.swift file reference"
  else
    puts "PushToTalkView.swift file reference already exists"
  end

  # Find or create Compile Sources build phase
  compile_phase = target.build_phases.find { |p| p.class == Xcodeproj::Project::Object::PBXSourcesBuildPhase }
  if compile_phase.nil?
    puts "ERROR: Could not find Compile Sources build phase"
    exit 1
  end

  # Check if file is already in compile phase
  already_in_phase = compile_phase.files.any? { |f| f.file_ref == ptalk_file }

  if already_in_phase
    puts "PushToTalkView.swift already in Compile Sources phase"
  else
    compile_phase.add_file_reference(ptalk_file)
    puts "Added PushToTalkView.swift to Compile Sources phase"
  end

  # Save project
  project.save
  puts "SUCCESS: Project saved"

rescue => e
  puts "ERROR: #{e.message}"
  puts e.backtrace.first(5).join("\n")
  exit 1
end

#!/usr/bin/env ruby

require 'xcodeproj'

project_path = 'App.xcodeproj'
file_path = 'App/Views/Communication/PushToTalkView.swift'

begin
  project = Xcodeproj::Project.open(project_path)

  # Find the main target
  target = project.targets.find { |t| t.name == 'App' }
  if target.nil?
    puts "ERROR: Could not find App target"
    exit 1
  end

  # Find main app group
  app_group = project.root_object.main_group.children.first

  # Find Views group
  views_group = app_group.children.find { |g| g.class == Xcodeproj::Project::Object::PBXGroup && g.name == 'Views' }
  if views_group.nil?
    puts "ERROR: Could not find Views group"
    exit 1
  end

  # Check if Communication subgroup exists
  comm_group = views_group.children.find { |g| g.class == Xcodeproj::Project::Object::PBXGroup && g.name == 'Communication' }

  if comm_group.nil?
    # Create Communication group
    comm_group = project.new(Xcodeproj::Project::Object::PBXGroup)
    comm_group.name = 'Communication'
    comm_group.source_tree = '<group>'
    comm_group.path = 'App/Views/Communication'
    views_group.children << comm_group
    puts "Created Communication group"
  else
    puts "Communication group exists"
  end

  # Check if file already in group
  existing_file = comm_group.children.find { |f| f.class == Xcodeproj::Project::Object::PBXFileReference && f.name == 'PushToTalkView.swift' }

  if existing_file
    puts "PushToTalkView.swift already in group"
    file_ref = existing_file
  else
    # Create file reference
    file_ref = project.new(Xcodeproj::Project::Object::PBXFileReference)
    file_ref.name = 'PushToTalkView.swift'
    file_ref.path = 'PushToTalkView.swift'
    file_ref.source_tree = '<group>'
    file_ref.last_known_file_type = 'sourcecode.swift'
    comm_group.children << file_ref
    puts "Added PushToTalkView.swift to Communication group"
  end

  # Find compile sources phase
  compile_phase = target.build_phases.find { |p| p.class == Xcodeproj::Project::Object::PBXSourcesBuildPhase }
  if compile_phase.nil?
    puts "ERROR: Compile Sources phase not found"
    exit 1
  end

  # Check if already in compile phase
  in_compile_phase = compile_phase.files.any? { |f| f.file_ref == file_ref }

  if in_compile_phase
    puts "PushToTalkView.swift already in Compile Sources phase"
  else
    compile_phase.add_file_reference(file_ref)
    puts "Added PushToTalkView.swift to Compile Sources phase"
  end

  # Save
  project.save
  puts "SUCCESS: Project saved"

rescue => e
  puts "ERROR: #{e.message}"
  puts e.backtrace.first(10).join("\n")
  exit 1
end

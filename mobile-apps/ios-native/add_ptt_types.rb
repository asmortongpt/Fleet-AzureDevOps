#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find or create Services/PTT group
app_group = project.main_group.find_subpath('App', false)
services_group = app_group.find_subpath('Services', false) || app_group.new_group('Services')
ptt_group = services_group.find_subpath('PTT', false) || services_group.new_group('PTT')

# Add DispatchPTTTypes.swift
file_path = 'Services/PTT/DispatchPTTTypes.swift'
file_ref = ptt_group.new_file(file_path)

# Add to App target
target = project.targets.first
target.add_file_references([file_ref])

project.save

puts "Added DispatchPTTTypes.swift to project successfully!"

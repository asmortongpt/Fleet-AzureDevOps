#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target = project.targets.find { |t| t.name == 'App' }
app_group = project.main_group.find_subpath('App', true)
components_group = app_group.find_subpath('Components', false) || app_group.new_group('Components', 'Components')

files = [
  'Components/QuickActionButton.swift',
  'Components/EmptyStateCard.swift'
]

files.each do |rel_path|
  filename = File.basename(rel_path)

  # Remove any existing references
  refs = project.files.select { |file| file.path&.end_with?(filename) }
  refs.each { |ref| ref.remove_from_project }

  target.source_build_phase.files.each do |build_file|
    if build_file.file_ref&.path&.end_with?(filename)
      build_file.remove_from_project
    end
  end

  # Add new reference
  file_ref = components_group.new_reference(rel_path)
  file_ref.source_tree = '<group>'
  target.source_build_phase.add_file_reference(file_ref)

  puts "✅ Added #{filename}"
end

project.save
puts "💾 Project saved"

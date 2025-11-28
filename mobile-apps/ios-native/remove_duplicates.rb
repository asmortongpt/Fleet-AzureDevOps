require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

# Find duplicate ViewModel references
duplicates_to_remove = []

project.main_group.recursive_children.each do |item|
  if item.is_a?(Xcodeproj::Project::Object::PBXFileReference)
    # Remove entries with "../App/ViewModels/" pattern
    if item.path && item.path.include?('../App/ViewModels/')
      duplicates_to_remove << item
      puts "Marking for removal: #{item.path}"
    elsif item.path && item.path.include?('App/ViewModels/') && !item.path.start_with?('ViewModels/')
      duplicates_to_remove << item
      puts "Marking for removal: #{item.path}"
    end
  end
end

puts "\nRemoving #{duplicates_to_remove.size} duplicate references..."
duplicates_to_remove.each do |item|
  # Remove from build phase
  target.source_build_phase.files.each do |build_file|
    if build_file.file_ref == item
      target.source_build_phase.files.delete(build_file)
    end
  end
  # Remove from project
  item.remove_from_project
  puts "  ✅ Removed: #{item.path}"
end

project.save
puts "\n✅ Cleanup complete!"

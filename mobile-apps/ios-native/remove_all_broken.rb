require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

# Remove all files that need missing ViewModels
broken_files = [
  'FuelManagementView.swift',
  'VehicleReservationView.swift',
  'DriverManagementView.swift',
  'ChecklistManagementView.swift',
  'DeviceManagementView.swift',
  'CrashDetectionView.swift',
  'GeofencingView.swift',
  'MapNavigationView.swift'
]

broken_files.each do |filename|
  target.source_build_phase.files.each do |build_file|
    if build_file.file_ref&.path&.include?(filename)
      target.source_build_phase.files.delete(build_file)
      puts "🗑️  Removed #{filename}"
    end
  end
end

project.save
puts "✅ Removed #{broken_files.size} files with missing dependencies"

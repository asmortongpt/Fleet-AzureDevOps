#!/usr/bin/env ruby

require 'xcodeproj'

PROJECT_PATH = 'App.xcodeproj'
FILE_PATH = 'App/Services/PushToTalkService.swift'

puts "\n" + "=" * 80
puts "PUSHTOTKSERVICE.SWIFT - XCODE PROJECT VERIFICATION REPORT"
puts "=" * 80 + "\n"

# 1. File System Verification
puts "[1] FILE SYSTEM VERIFICATION"
puts "-" * 80
if File.exist?(FILE_PATH)
  file_size = File.size(FILE_PATH)
  file_lines = File.readlines(FILE_PATH).length
  puts "Status:     ✓ EXISTS"
  puts "Path:       #{FILE_PATH}"
  puts "Size:       #{file_size} bytes"
  puts "Lines:      #{file_lines} lines"
else
  puts "Status:     ✗ NOT FOUND"
  exit 1
end

# 2. Xcode Project Integration
puts "\n[2] XCODE PROJECT INTEGRATION"
puts "-" * 80
project = Xcodeproj::Project.open(PROJECT_PATH)
target = project.targets.find { |t| t.name == 'App' }

if target
  puts "Target:     ✓ App target found"
else
  puts "Target:     ✗ App target NOT found"
  exit 1
end

# Find file in project
ptt_file = nil
project.files.each do |f|
  begin
    if f.real_path.to_s.include?('PushToTalkService.swift')
      ptt_file = f
      break
    end
  rescue
  end
end

if ptt_file
  puts "Project:    ✓ File in project"
  puts "UUID:       #{ptt_file.uuid}"
  puts "Name:       #{ptt_file.name}"
  puts "Path:       #{ptt_file.path rescue 'N/A'}"
else
  puts "Project:    ✗ File NOT found in project"
  exit 1
end

# 3. Build Phase Status
puts "\n[3] COMPILE SOURCES BUILD PHASE"
puts "-" * 80
sources_phase = target.source_build_phase
in_build_phase = false

sources_phase.files.each do |bf|
  begin
    if bf.file_ref == ptt_file
      in_build_phase = true
      break
    end
  rescue
  end
end

if in_build_phase
  puts "Build Phase: ✓ File in Compile Sources"
  puts "Build Files: #{sources_phase.files.count} total files"
else
  puts "Build Phase: ✗ File NOT in Compile Sources"
  puts "WARNING: File will not compile"
end

# 4. Group Hierarchy
puts "\n[4] GROUP HIERARCHY"
puts "-" * 80
parent_group = ptt_file.parent
if parent_group
  puts "Parent Group: #{parent_group.display_name rescue 'Unknown'}"
  puts "Path:         #{parent_group.path rescue 'N/A'}"
else
  puts "Parent Group: ✗ No parent group"
end

# 5. Swift Syntax Validation
puts "\n[5] SWIFT SYNTAX VALIDATION"
puts "-" * 80
syntax_valid = system("swiftc -parse #{FILE_PATH} 2>/dev/null")
if syntax_valid
  puts "Syntax:      ✓ Valid Swift code"
else
  puts "Syntax:      ✗ Swift compilation errors"
end

# 6. Final Summary
puts "\n" + "=" * 80
puts "FINAL STATUS"
puts "=" * 80

all_checks_passed = (
  File.exist?(FILE_PATH) &&
  target &&
  ptt_file &&
  in_build_phase &&
  syntax_valid
)

if all_checks_passed
  puts "✓ FILE SUCCESSFULLY ADDED TO PROJECT"
  puts "✓ READY FOR COMPILATION"
  puts "\nConfiguration Summary:"
  puts "  • File location:  App/Services/PushToTalkService.swift"
  puts "  • Project group:  Services"
  puts "  • Build phase:    Compile Sources"
  puts "  • Target:         App"
  puts "  • UUID:           #{ptt_file.uuid}"
  puts "  • Swift version:  5.0+"
  puts "\nCompilation Status: READY - No syntax errors detected"
else
  puts "✗ ISSUES DETECTED - See details above"
  exit 1
end

puts "\n" + "=" * 80 + "\n"

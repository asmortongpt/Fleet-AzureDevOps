#!/usr/bin/env python3
"""
Comprehensive Diagnostic - Find ALL issues before fixing
"""
import os
import subprocess
import json
from pathlib import Path


def run_command(cmd, cwd):
    """Run command and return output"""
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=60)
    return result.returncode, result.stdout + result.stderr


def main():
    workdir = "/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native"

    print("=" * 80)
    print("COMPREHENSIVE DIAGNOSTIC - iOS Fleet App")
    print("=" * 80)
    print()

    issues = []

    # 1. Find all Swift files in filesystem
    print("1. Scanning filesystem for Swift files...")
    all_swift_files = []
    for root, dirs, files in os.walk(os.path.join(workdir, "App")):
        # Skip Pods and hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'Pods']
        for file in files:
            if file.endswith('.swift'):
                rel_path = os.path.relpath(os.path.join(root, file), workdir)
                all_swift_files.append(rel_path)

    print(f"   Found {len(all_swift_files)} Swift files")

    # 2. Find which files are in Xcode project
    print("\n2. Checking which files are in Xcode project...")
    pbxproj = os.path.join(workdir, "App.xcodeproj/project.pbxproj")
    with open(pbxproj, 'r') as f:
        pbxproj_content = f.read()

    files_not_in_project = []
    for swift_file in all_swift_files:
        filename = os.path.basename(swift_file)
        if filename not in pbxproj_content:
            files_not_in_project.append(swift_file)
            issues.append({
                "type": "missing_from_project",
                "severity": "high",
                "file": swift_file,
                "message": f"File exists but not in Xcode project: {swift_file}"
            })

    print(f"   {len(files_not_in_project)} files NOT in Xcode project:")
    for f in files_not_in_project:
        print(f"   ❌ {f}")

    # 3. Try to build and capture ALL errors
    print("\n3. Attempting build to capture compilation errors...")
    returncode, output = run_command(
        'xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,name=iPhone 17 Pro" build 2>&1',
        workdir
    )

    # Parse errors
    error_lines = [line for line in output.split('\n') if 'error:' in line.lower()]
    warning_lines = [line for line in output.split('\n') if 'warning:' in line.lower()]

    print(f"   Found {len(error_lines)} compilation errors")
    print(f"   Found {len(warning_lines)} warnings")

    for error in error_lines[:20]:  # Show first 20
        issues.append({
            "type": "compilation_error",
            "severity": "critical",
            "message": error.strip()
        })

    # 4. Check for path issues
    print("\n4. Checking for file path issues in project...")
    path_issues = []
    for line in pbxproj_content.split('\n'):
        if 'path = App/' in line and 'sourceTree = "<group>"' in line:
            path_issues.append(line.strip())

    if path_issues:
        print(f"   Found {len(path_issues)} potential path issues")
        for issue in path_issues[:5]:
            issues.append({
                "type": "path_issue",
                "severity": "medium",
                "message": f"Potential double-path: {issue}"
            })

    # 5. Summary
    print("\n" + "=" * 80)
    print("DIAGNOSTIC SUMMARY")
    print("=" * 80)

    critical_count = sum(1 for i in issues if i.get('severity') == 'critical')
    high_count = sum(1 for i in issues if i.get('severity') == 'high')
    medium_count = sum(1 for i in issues if i.get('severity') == 'medium')

    print(f"\n🔴 Critical Issues: {critical_count}")
    print(f"🟠 High Priority: {high_count}")
    print(f"🟡 Medium Priority: {medium_count}")
    print(f"📊 Total Issues: {len(issues)}")

    # 6. Generate fix plan
    print("\n" + "=" * 80)
    print("FIX PLAN")
    print("=" * 80)

    print("\n1. Add missing files to Xcode project:")
    for f in files_not_in_project:
        print(f"   - {f}")

    print("\n2. Fix compilation errors:")
    for error in error_lines[:10]:
        print(f"   - {error.strip()[:100]}")

    # Save detailed report
    report = {
        "total_swift_files": len(all_swift_files),
        "files_not_in_project": files_not_in_project,
        "compilation_errors": error_lines,
        "warnings": warning_lines,
        "path_issues": path_issues,
        "all_issues": issues,
        "summary": {
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "total": len(issues)
        }
    }

    report_file = os.path.join(workdir, "diagnostic_report.json")
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n📄 Detailed report saved to: diagnostic_report.json")

    # 7. Confidence assessment
    print("\n" + "=" * 80)
    print("CONFIDENCE ASSESSMENT")
    print("=" * 80)

    if critical_count > 0:
        confidence = 0
        status = "❌ CANNOT LAUNCH"
    elif high_count > 5:
        confidence = 20
        status = "❌ NOT READY"
    elif high_count > 0:
        confidence = 50
        status = "⚠️ NEEDS WORK"
    else:
        confidence = 95
        status = "✅ NEARLY READY"

    print(f"\nCurrent Confidence: {confidence}%")
    print(f"Status: {status}")

    if confidence < 99:
        print(f"\n❌ NOT at 100% confidence")
        print(f"   Need to fix {critical_count + high_count} critical/high issues")
    else:
        print(f"\n✅ Ready to launch!")

    return 0 if confidence >= 99 else 1


if __name__ == "__main__":
    exit(main())

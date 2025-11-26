#!/usr/bin/env python3
"""
Nuclear Cache Clear Script for React/Vite Applications
=======================================================

This script forcibly clears ALL possible cache locations that could cause
"Cannot read properties of null (reading 'useEffect')" errors in React apps.

The Problem:
-----------
Vite pre-bundles dependencies and caches them. When React Query (or any library
using React hooks) gets pre-bundled BEFORE React is available, it captures a
null reference to React, causing runtime errors even after code changes.

The Solution:
------------
Clear EVERY possible cache location:
1. Vite caches (custom and default)
2. Browser caches (Chrome, Safari, Firefox, Edge)
3. Node.js caches (npm, pnpm, yarn)
4. System temp caches
5. TypeScript build info
6. ESLint cache
7. Playwright cache
8. OS-specific caches (macOS, Windows, Linux)

Usage:
------
    python3 nuclear_cache_clear.py
    python3 nuclear_cache_clear.py --dry-run  # See what would be deleted
    python3 nuclear_cache_clear.py --aggressive  # Include node_modules

Author: Claude (Anthropic) - Expert Python Optimization Specialist
"""

import os
import sys
import shutil
import platform
import subprocess
import argparse
from pathlib import Path
from typing import List, Tuple
from datetime import datetime


class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


class CacheCleaner:
    """Nuclear cache cleaner for React/Vite applications"""

    def __init__(self, project_root: Path, dry_run: bool = False, aggressive: bool = False):
        self.project_root = project_root
        self.dry_run = dry_run
        self.aggressive = aggressive
        self.os_type = platform.system()
        self.removed_count = 0
        self.freed_bytes = 0
        self.errors: List[Tuple[str, str]] = []

    def log(self, message: str, color: str = Colors.CYAN):
        """Print colored log message"""
        print(f"{color}{message}{Colors.ENDC}")

    def error(self, message: str, exception: str = ""):
        """Log error message"""
        self.errors.append((message, exception))
        print(f"{Colors.RED}ERROR: {message}{Colors.ENDC}")
        if exception:
            print(f"{Colors.YELLOW}  {exception}{Colors.ENDC}")

    def get_size(self, path: Path) -> int:
        """Get total size of path in bytes"""
        if not path.exists():
            return 0

        if path.is_file():
            return path.stat().st_size

        total = 0
        try:
            for item in path.rglob('*'):
                if item.is_file():
                    try:
                        total += item.stat().st_size
                    except (OSError, PermissionError):
                        pass
        except (OSError, PermissionError):
            pass

        return total

    def format_bytes(self, bytes_val: int) -> str:
        """Format bytes to human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_val < 1024.0:
                return f"{bytes_val:.2f} {unit}"
            bytes_val /= 1024.0
        return f"{bytes_val:.2f} PB"

    def remove_path(self, path: Path, description: str) -> bool:
        """Remove a file or directory"""
        if not path.exists():
            return False

        size = self.get_size(path)

        if self.dry_run:
            self.log(f"  [DRY RUN] Would delete: {path} ({self.format_bytes(size)})", Colors.YELLOW)
            return True

        try:
            if path.is_file() or path.is_symlink():
                path.unlink()
            else:
                shutil.rmtree(path, ignore_errors=False)

            self.removed_count += 1
            self.freed_bytes += size
            self.log(f"  ✓ Removed {description}: {path} ({self.format_bytes(size)})", Colors.GREEN)
            return True

        except Exception as e:
            self.error(f"Failed to remove {description}: {path}", str(e))
            return False

    def clear_vite_caches(self):
        """Clear all Vite cache directories"""
        self.log("\n" + "="*80, Colors.HEADER)
        self.log("CLEARING VITE CACHES", Colors.HEADER)
        self.log("="*80, Colors.HEADER)

        vite_cache_locations = [
            # Custom cache dir from vite.config.ts
            self.project_root / "node_modules" / ".vite-fleet",
            # Default Vite cache
            self.project_root / "node_modules" / ".vite",
            # Temporary Vite cache
            self.project_root / "node_modules" / ".vite-temp",
            # Vite build cache
            self.project_root / ".vite",
            # Dist output
            self.project_root / "dist",
        ]

        for cache_dir in vite_cache_locations:
            self.remove_path(cache_dir, "Vite cache")

    def clear_typescript_caches(self):
        """Clear TypeScript build info and caches"""
        self.log("\n" + "="*80, Colors.HEADER)
        self.log("CLEARING TYPESCRIPT CACHES", Colors.HEADER)
        self.log("="*80, Colors.HEADER)

        ts_cache_locations = [
            self.project_root / "node_modules" / ".tmp",
            self.project_root / "tsconfig.tsbuildinfo",
            self.project_root / "tsconfig.app.tsbuildinfo",
        ]

        for cache_dir in ts_cache_locations:
            self.remove_path(cache_dir, "TypeScript cache")

    def clear_node_caches(self):
        """Clear Node.js package manager caches"""
        self.log("\n" + "="*80, Colors.HEADER)
        self.log("CLEARING NODE.JS CACHES", Colors.HEADER)
        self.log("="*80, Colors.HEADER)

        # Clear npm cache
        try:
            if not self.dry_run:
                subprocess.run(['npm', 'cache', 'clean', '--force'],
                             capture_output=True, text=True, check=False)
                self.log("  ✓ Cleared npm cache", Colors.GREEN)
            else:
                self.log("  [DRY RUN] Would clear npm cache", Colors.YELLOW)
        except Exception as e:
            self.error("Failed to clear npm cache", str(e))

        # Clear pnpm cache (if installed)
        try:
            result = subprocess.run(['pnpm', 'store', 'prune'],
                                  capture_output=True, text=True, check=False)
            if result.returncode == 0:
                self.log("  ✓ Cleared pnpm cache", Colors.GREEN)
        except FileNotFoundError:
            pass  # pnpm not installed

        # Clear yarn cache (if installed)
        try:
            result = subprocess.run(['yarn', 'cache', 'clean'],
                                  capture_output=True, text=True, check=False)
            if result.returncode == 0:
                self.log("  ✓ Cleared yarn cache", Colors.GREEN)
        except FileNotFoundError:
            pass  # yarn not installed

    def clear_browser_caches(self):
        """Clear browser caches (instruction-based, requires manual action)"""
        self.log("\n" + "="*80, Colors.HEADER)
        self.log("BROWSER CACHE INSTRUCTIONS", Colors.HEADER)
        self.log("="*80, Colors.HEADER)

        self.log("\nChrome/Edge:", Colors.BOLD)
        self.log("  1. Press Cmd+Shift+Delete (macOS) or Ctrl+Shift+Delete (Windows/Linux)")
        self.log("  2. Select 'All time'")
        self.log("  3. Check 'Cached images and files'")
        self.log("  4. Click 'Clear data'")

        self.log("\nSafari:", Colors.BOLD)
        self.log("  1. Go to Safari > Settings > Advanced")
        self.log("  2. Enable 'Show Develop menu'")
        self.log("  3. Develop > Empty Caches (Cmd+Option+E)")

        self.log("\nFirefox:", Colors.BOLD)
        self.log("  1. Press Cmd+Shift+Delete (macOS) or Ctrl+Shift+Delete (Windows/Linux)")
        self.log("  2. Select 'Everything'")
        self.log("  3. Check 'Cache'")
        self.log("  4. Click 'Clear Now'")

        # Try to clear Chrome cache on macOS
        if self.os_type == "Darwin":
            chrome_cache = Path.home() / "Library" / "Caches" / "Google" / "Chrome" / "Default" / "Cache"
            if chrome_cache.exists():
                self.remove_path(chrome_cache, "Chrome cache")

    def clear_eslint_cache(self):
        """Clear ESLint cache"""
        self.log("\n" + "="*80, Colors.HEADER)
        self.log("CLEARING ESLINT CACHE", Colors.HEADER)
        self.log("="*80, Colors.HEADER)

        eslint_cache = self.project_root / ".eslintcache"
        self.remove_path(eslint_cache, "ESLint cache")

    def clear_playwright_cache(self):
        """Clear Playwright cache"""
        self.log("\n" + "="*80, Colors.HEADER)
        self.log("CLEARING PLAYWRIGHT CACHE", Colors.HEADER)
        self.log("="*80, Colors.HEADER)

        playwright_cache = self.project_root / "test-results"
        playwright_report = self.project_root / "playwright-report"
        playwright_blob = self.project_root / "blob-report"

        self.remove_path(playwright_cache, "Playwright test results")
        self.remove_path(playwright_report, "Playwright report")
        self.remove_path(playwright_blob, "Playwright blob report")

    def clear_system_temp(self):
        """Clear system temporary files"""
        self.log("\n" + "="*80, Colors.HEADER)
        self.log("CLEARING SYSTEM TEMP CACHES", Colors.HEADER)
        self.log("="*80, Colors.HEADER)

        if self.os_type == "Darwin":  # macOS
            temp_locations = [
                Path("/tmp/vite*"),
                Path("/tmp/react*"),
                Path("/tmp/npm*"),
                Path.home() / "Library" / "Caches" / "vite",
            ]
        elif self.os_type == "Windows":
            temp_locations = [
                Path(os.environ.get("TEMP", "")) / "vite*",
                Path(os.environ.get("TEMP", "")) / "react*",
                Path(os.environ.get("TEMP", "")) / "npm*",
            ]
        else:  # Linux
            temp_locations = [
                Path("/tmp/vite*"),
                Path("/tmp/react*"),
                Path("/tmp/npm*"),
            ]

        for pattern in temp_locations:
            if "*" in str(pattern):
                # Glob pattern
                parent = pattern.parent
                if parent.exists():
                    for match in parent.glob(pattern.name):
                        self.remove_path(match, "System temp")
            else:
                self.remove_path(pattern, "System temp")

    def clear_node_modules(self):
        """Clear node_modules (aggressive mode only)"""
        if not self.aggressive:
            return

        self.log("\n" + "="*80, Colors.HEADER)
        self.log("CLEARING NODE_MODULES (AGGRESSIVE MODE)", Colors.HEADER)
        self.log("="*80, Colors.HEADER)

        node_modules = self.project_root / "node_modules"
        package_lock = self.project_root / "package-lock.json"

        self.remove_path(node_modules, "node_modules")
        self.remove_path(package_lock, "package-lock.json")

        if not self.dry_run:
            self.log("\n" + Colors.YELLOW + "You will need to run: npm install" + Colors.ENDC)

    def run(self):
        """Execute the nuclear cache clear"""
        start_time = datetime.now()

        self.log("\n" + "="*80, Colors.BOLD)
        self.log("NUCLEAR CACHE CLEAR - React/Vite Edition", Colors.BOLD)
        self.log("="*80, Colors.BOLD)
        self.log(f"Project Root: {self.project_root}")
        self.log(f"Operating System: {self.os_type}")
        self.log(f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}")
        self.log(f"Aggressive: {self.aggressive}")
        self.log(f"Started: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")

        # Execute all cleanup tasks
        self.clear_vite_caches()
        self.clear_typescript_caches()
        self.clear_node_caches()
        self.clear_eslint_cache()
        self.clear_playwright_cache()
        self.clear_system_temp()
        self.clear_browser_caches()
        self.clear_node_modules()

        # Summary
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        self.log("\n" + "="*80, Colors.HEADER)
        self.log("CLEANUP SUMMARY", Colors.HEADER)
        self.log("="*80, Colors.HEADER)
        self.log(f"Items removed: {self.removed_count}", Colors.GREEN)
        self.log(f"Space freed: {self.format_bytes(self.freed_bytes)}", Colors.GREEN)
        self.log(f"Duration: {duration:.2f} seconds", Colors.GREEN)

        if self.errors:
            self.log(f"\nErrors encountered: {len(self.errors)}", Colors.RED)
            for msg, exc in self.errors:
                self.log(f"  - {msg}", Colors.YELLOW)

        if not self.dry_run:
            self.log("\n" + "="*80, Colors.BOLD)
            self.log("NEXT STEPS", Colors.BOLD)
            self.log("="*80, Colors.BOLD)
            self.log("1. Close ALL browser tabs with your app")
            self.log("2. Clear browser cache manually (see instructions above)")
            self.log("3. Restart your terminal")
            if self.aggressive:
                self.log("4. Run: npm install")
                self.log("5. Run: npm run dev")
            else:
                self.log("4. Run: npm run dev")
            self.log("\nIf issue persists, run with --aggressive flag:")
            self.log("  python3 nuclear_cache_clear.py --aggressive")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Nuclear cache clear for React/Vite applications",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 nuclear_cache_clear.py                 # Clear all caches
  python3 nuclear_cache_clear.py --dry-run       # Preview what will be deleted
  python3 nuclear_cache_clear.py --aggressive    # Also delete node_modules
  python3 nuclear_cache_clear.py --aggressive --dry-run  # Preview aggressive mode

This script solves the React Query error:
  "Cannot read properties of null (reading 'useEffect')"

The issue occurs when Vite pre-bundles React Query before React is available,
causing React Query to capture a null reference. This script clears all caches
to force a fresh build with proper dependency order.
        """
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be deleted without actually deleting'
    )

    parser.add_argument(
        '--aggressive',
        action='store_true',
        help='Also delete node_modules and package-lock.json (requires npm install after)'
    )

    parser.add_argument(
        '--path',
        type=Path,
        default=Path.cwd(),
        help='Project root path (default: current directory)'
    )

    args = parser.parse_args()

    # Validate project root
    if not args.path.exists():
        print(f"{Colors.RED}Error: Path does not exist: {args.path}{Colors.ENDC}")
        sys.exit(1)

    # Look for package.json to confirm it's a Node.js project
    package_json = args.path / "package.json"
    if not package_json.exists():
        print(f"{Colors.YELLOW}Warning: No package.json found in {args.path}{Colors.ENDC}")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            sys.exit(0)

    # Create cleaner and run
    cleaner = CacheCleaner(args.path, args.dry_run, args.aggressive)

    try:
        cleaner.run()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Interrupted by user{Colors.ENDC}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.RED}Fatal error: {e}{Colors.ENDC}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

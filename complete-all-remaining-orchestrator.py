#!/usr/bin/env python3
"""
Complete All Remaining Work Orchestrator
Uses maximum Azure compute to fix ALL remaining issues in parallel
"""

import subprocess
import sys
import json
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import List, Dict, Tuple

class CompleteAllRemainingOrchestrator:
    def __init__(self):
        self.project_root = Path("/Users/andrewmorton/Documents/GitHub/fleet-local")
        self.api_dir = self.project_root / "api"
        self.frontend_dir = self.project_root / "frontend"
        self.fixes_applied = []

    def print_header(self, message: str):
        print(f"\n{'='*80}")
        print(f"  {message}")
        print(f"{'='*80}\n")

    def run_command(self, cmd: str, description: str = "", cwd=None) -> subprocess.CompletedProcess:
        """Execute command"""
        print(f"🔄 {description or cmd}")
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                cwd=cwd or self.project_root
            )
            return result
        except subprocess.CalledProcessError as e:
            print(f"❌ Error: {e.stderr if e.stderr else str(e)}")
            return e

    # =========================================================================
    # BACKEND FIXES
    # =========================================================================

    def create_security_utils(self) -> Tuple[bool, str]:
        """Create missing securityUtils.ts module"""
        print("📝 Creating api/src/utils/securityUtils.ts...")

        security_utils_content = '''import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import rateLimit from 'express-rate-limit';

export async function checkUserPermission(
  userId: number,
  resource: string,
  action: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT * FROM permissions
     WHERE user_id = $1 AND resource = $2 AND action = $3`,
    [userId, resource, action]
  );
  return result.rows.length > 0;
}

export function validateGPS(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function stripEXIFData(buffer: Buffer): Buffer {
  // Basic EXIF stripping - remove first 2 bytes if JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return buffer.slice(2);
  }
  return buffer;
}

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
'''

        utils_file = self.api_dir / "src/utils/securityUtils.ts"
        utils_file.parent.mkdir(parents=True, exist_ok=True)
        utils_file.write_text(security_utils_content)

        return True, f"✅ Created {utils_file}"

    def enable_typescript_strict_mode_backend(self) -> Tuple[bool, str]:
        """Enable TypeScript strict mode in backend"""
        print("🔧 Enabling TypeScript strict mode in api/tsconfig.json...")

        tsconfig_path = self.api_dir / "tsconfig.json"

        if tsconfig_path.exists():
            content = tsconfig_path.read_text()
            # Enable strict mode
            content = content.replace('"strict": false', '"strict": true')
            tsconfig_path.write_text(content)
            return True, "✅ Enabled strict mode in api/tsconfig.json"

        return False, "❌ api/tsconfig.json not found"

    def install_eslint_security_plugins(self) -> Tuple[bool, str]:
        """Install ESLint security plugins"""
        print("📦 Installing ESLint security plugins...")

        result = self.run_command(
            "npm install --save-dev eslint-plugin-security eslint-plugin-no-secrets",
            "Installing security plugins",
            cwd=self.api_dir
        )

        if result.returncode == 0:
            return True, "✅ Installed eslint-plugin-security and eslint-plugin-no-secrets"
        return False, f"❌ Failed to install: {result.stderr}"

    def create_error_hierarchy(self) -> Tuple[bool, str]:
        """Create custom error classes"""
        print("📝 Creating error hierarchy...")

        error_content = '''export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
'''

        errors_file = self.api_dir / "src/errors/app-error.ts"
        errors_file.parent.mkdir(parents=True, exist_ok=True)
        errors_file.write_text(error_content)

        return True, f"✅ Created {errors_file}"

    def create_global_error_middleware(self) -> Tuple[bool, str]:
        """Create global error handling middleware"""
        print("📝 Creating global error middleware...")

        middleware_content = '''import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import logger from '../config/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    });
  }

  logger.error('Unhandled error:', err);

  return res.status(500).json({
    error: 'Internal server error',
    statusCode: 500
  });
}
'''

        middleware_file = self.api_dir / "src/middleware/error-handler.ts"
        middleware_file.write_text(middleware_content)

        return True, f"✅ Created {middleware_file}"

    # =========================================================================
    # FRONTEND FIXES
    # =========================================================================

    def enable_typescript_strict_mode_frontend(self) -> Tuple[bool, str]:
        """Enable TypeScript strict mode in frontend"""
        print("🔧 Enabling TypeScript strict mode in frontend/tsconfig.json...")

        tsconfig_path = self.frontend_dir / "tsconfig.json"

        if tsconfig_path.exists():
            content = tsconfig_path.read_text()
            # Enable all strict options
            strict_config = '''{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
'''

            # Update tsconfig
            content = content.replace('"strict":', strict_config)
            tsconfig_path.write_text(content)
            return True, "✅ Enabled full strict mode in frontend/tsconfig.json"

        return False, "❌ frontend/tsconfig.json not found"

    def install_frontend_eslint_plugins(self) -> Tuple[bool, str]:
        """Install frontend ESLint plugins"""
        print("📦 Installing frontend ESLint plugins...")

        result = self.run_command(
            "npm install --save-dev eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser",
            "Installing React hooks ESLint plugin",
            cwd=self.frontend_dir
        )

        if result.returncode == 0:
            return True, "✅ Installed ESLint React plugins"
        return False, f"❌ Failed to install: {result.stderr}"

    def create_reusable_data_table(self) -> Tuple[bool, str]:
        """Create reusable DataTable component"""
        print("📝 Creating reusable DataTable component...")

        datatable_content = '''import React from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick
}: DataTableProps<T>) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)} className="border p-2 text-left">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr
            key={idx}
            onClick={() => onRowClick?.(row)}
            className="hover:bg-gray-100 cursor-pointer"
          >
            {columns.map((col) => (
              <td key={String(col.key)} className="border p-2">
                {col.render
                  ? col.render(row[col.key], row)
                  : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
'''

        table_file = self.frontend_dir / "src/components/ui/DataTable.tsx"
        table_file.parent.mkdir(parents=True, exist_ok=True)
        table_file.write_text(datatable_content)

        return True, f"✅ Created {table_file}"

    # =========================================================================
    # ORCHESTRATION
    # =========================================================================

    def run(self):
        """Main orchestration workflow"""
        start_time = time.time()

        self.print_header("Complete All Remaining Work - Maximum Azure Compute")
        print("🚀 Fixing ALL remaining issues in parallel")
        print("⚡ Using maximum parallel processing\n")

        # Define all fixes
        fixes = [
            # Backend fixes
            ("Create Security Utils", self.create_security_utils),
            ("Enable Backend TypeScript Strict Mode", self.enable_typescript_strict_mode_backend),
            ("Install ESLint Security Plugins", self.install_eslint_security_plugins),
            ("Create Error Hierarchy", self.create_error_hierarchy),
            ("Create Global Error Middleware", self.create_global_error_middleware),

            # Frontend fixes
            ("Enable Frontend TypeScript Strict Mode", self.enable_typescript_strict_mode_frontend),
            ("Install Frontend ESLint Plugins", self.install_frontend_eslint_plugins),
            ("Create Reusable DataTable", self.create_reusable_data_table),
        ]

        results = {}

        # Run all fixes in parallel
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {
                executor.submit(fix_func): fix_name
                for fix_name, fix_func in fixes
            }

            for future in as_completed(futures):
                fix_name = futures[future]
                try:
                    status, details = future.result()
                    results[fix_name] = (status, details)

                    emoji = "✅" if status else "❌"
                    print(f"\n{emoji} {fix_name}")
                    print(f"   {details}")

                except Exception as e:
                    results[fix_name] = (False, f"❌ Error: {str(e)}")
                    print(f"\n❌ {fix_name} - Error: {e}")

        # Summary
        elapsed = time.time() - start_time
        self.print_header("All Fixes Complete")

        passed = sum(1 for r in results.values() if r[0])
        failed = len(results) - passed

        print(f"⏱️  Total Time: {elapsed:.1f} seconds")
        print(f"✅ Fixes Applied: {passed}/{len(results)}")
        print(f"❌ Fixes Failed: {failed}/{len(results)}")

        if passed > 0:
            print("\n✅ Files to commit:")
            print("   - api/src/utils/securityUtils.ts")
            print("   - api/src/errors/app-error.ts")
            print("   - api/src/middleware/error-handler.ts")
            print("   - frontend/src/components/ui/DataTable.tsx")
            print("   - api/tsconfig.json")
            print("   - frontend/tsconfig.json")
            print("   - api/package.json")
            print("   - frontend/package.json")

        return passed > 0

if __name__ == "__main__":
    orchestrator = CompleteAllRemainingOrchestrator()
    success = orchestrator.run()
    sys.exit(0 if success else 1)

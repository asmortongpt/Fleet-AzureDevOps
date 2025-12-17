#!/usr/bin/env python3
"""Verification script for secrets management implementation."""

import sys
import os
import importlib.util
from pathlib import Path

def load_module(module_name, file_path):
    """Load a module from a file path."""
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec and spec.loader:
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module
    return None


def verify_module_exists(module_path, module_name):
    """Verify a module file exists and is readable."""
    if not os.path.exists(module_path):
        print(f"✗ {module_name} NOT FOUND: {module_path}")
        return False

    try:
        with open(module_path, 'r') as f:
            lines = f.readlines()
        print(f"✓ {module_name} EXISTS: {len(lines)} lines")
        return True
    except Exception as e:
        print(f"✗ {module_name} ERROR: {e}")
        return False


def check_module_content(file_path, required_items):
    """Check if a module contains required classes/functions."""
    try:
        with open(file_path, 'r') as f:
            content = f.read()

        missing = []
        for item in required_items:
            if f"class {item}" not in content and f"def {item}" not in content:
                missing.append(item)

        if missing:
            print(f"  ⚠ Missing items: {', '.join(missing)}")
            return False
        return True
    except Exception as e:
        print(f"  ✗ Error reading file: {e}")
        return False


def main():
    """Run verification checks."""
    base_path = Path(__file__).parent.parent
    print("\n" + "=" * 70)
    print("SECRETS MANAGEMENT IMPLEMENTATION VERIFICATION")
    print("=" * 70 + "\n")

    checks = [
        {
            "name": "secrets_manager.py",
            "path": base_path / "secrets_manager.py",
            "required": [
                "SecretType",
                "SecretsManagerError",
                "SecretNotFoundError",
                "SecretAlreadyExistsError",
                "SecretAccessError",
                "SecretsManager",
            ],
        },
        {
            "name": "secrets_audit.py",
            "path": base_path / "secrets_audit.py",
            "required": [
                "AuditAction",
                "AuditResult",
                "AuditEvent",
                "SecretsAudit",
            ],
        },
        {
            "name": "secrets_rotation.py",
            "path": base_path / "secrets_rotation.py",
            "required": [
                "RotationStatus",
                "RotationConfig",
                "SecretsRotation",
            ],
        },
        {
            "name": "emergency_revoke.py",
            "path": base_path / "emergency_revoke.py",
            "required": [
                "RevocationReason",
                "RevocationStatus",
                "RevocationRequest",
                "EmergencyRevoke",
            ],
        },
        {
            "name": "__init__.py",
            "path": base_path / "__init__.py",
            "required": [],
        },
    ]

    all_passed = True
    for check in checks:
        print(f"\nChecking {check['name']}...")
        if verify_module_exists(str(check["path"]), check["name"]):
            if check["required"]:
                if check_module_content(str(check["path"]), check["required"]):
                    print(f"  ✓ All required items present")
                else:
                    all_passed = False
        else:
            all_passed = False

    # Check test file
    print(f"\nChecking test_secrets.py...")
    test_file = base_path / "__tests__" / "test_secrets.py"
    if verify_module_exists(str(test_file), "test_secrets.py"):
        with open(test_file, 'r') as f:
            lines = f.readlines()

        test_classes = [
            "TestSecretsManager",
            "TestSecretsAudit",
            "TestSecretsRotation",
            "TestEmergencyRevoke",
            "TestSecretsIntegration",
            "TestSecretsEdgeCases",
            "TestSecretsPerformance",
        ]

        content = "".join(lines)
        missing_tests = [tc for tc in test_classes if f"class {tc}" not in content]

        if missing_tests:
            print(f"  ⚠ Missing test classes: {', '.join(missing_tests)}")
            all_passed = False
        else:
            print(f"  ✓ All test classes present ({len(test_classes)} classes)")

        # Count test methods
        test_count = content.count("async def test_") + content.count("def test_")
        print(f"  ✓ {test_count} test methods found")
    else:
        all_passed = False

    # Summary
    print("\n" + "=" * 70)
    if all_passed:
        print("✓ ALL CHECKS PASSED")
        print("=" * 70)
        return 0
    else:
        print("✗ SOME CHECKS FAILED")
        print("=" * 70)
        return 1


if __name__ == "__main__":
    sys.exit(main())

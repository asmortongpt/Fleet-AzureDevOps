#!/usr/bin/env python3
"""
Verification script for Alembic setup.

This script checks that:
1. Alembic configuration is valid
2. Database connection works
3. Migration files are properly structured
4. All models are imported correctly

Run before first migration deployment.
"""
import sys
import os
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))


def check_alembic_config():
    """Verify alembic.ini exists and is valid."""
    print("✓ Checking Alembic configuration...")

    alembic_ini = Path(__file__).parent / "alembic.ini"
    if not alembic_ini.exists():
        print("✗ FAILED: alembic.ini not found")
        return False

    print(f"  Found: {alembic_ini}")
    return True


def check_env_py():
    """Verify alembic/env.py exists and imports models."""
    print("\n✓ Checking Alembic env.py...")

    env_py = Path(__file__).parent / "alembic" / "env.py"
    if not env_py.exists():
        print("✗ FAILED: alembic/env.py not found")
        return False

    content = env_py.read_text()

    # Check for critical imports
    required_imports = [
        "from app.core.database import Base",
        "from app.models import",
    ]

    for imp in required_imports:
        if imp not in content:
            print(f"✗ FAILED: Missing import: {imp}")
            return False

    print(f"  Found: {env_py}")
    print("  All required imports present")
    return True


def check_initial_migration():
    """Verify initial migration exists."""
    print("\n✓ Checking initial migration...")

    versions_dir = Path(__file__).parent / "alembic" / "versions"
    if not versions_dir.exists():
        print("✗ FAILED: alembic/versions directory not found")
        return False

    initial_migration = versions_dir / "001_initial_schema.py"
    if not initial_migration.exists():
        print("✗ FAILED: Initial migration 001_initial_schema.py not found")
        return False

    content = initial_migration.read_text()

    # Check for all tables
    expected_tables = [
        "organizations",
        "users",
        "radio_channels",
        "transmissions",
        "incidents",
        "tasks",
        "task_checklists",
        "assets",
        "crews",
        "audit_logs",
        "webhooks",
        "policies",
    ]

    for table in expected_tables:
        if f"'{table}'" not in content:
            print(f"✗ FAILED: Table '{table}' not found in migration")
            return False

    print(f"  Found: {initial_migration}")
    print(f"  All {len(expected_tables)} tables present")
    return True


def check_models():
    """Verify all models can be imported."""
    print("\n✓ Checking model imports...")

    try:
        from app.models import (
            Organization,
            User,
            RadioChannel,
            Transmission,
            Incident,
            Task,
            TaskChecklist,
            Asset,
            Crew,
            AuditLog,
            Webhook,
            Policy,
        )

        models = [
            Organization,
            User,
            RadioChannel,
            Transmission,
            Incident,
            Task,
            TaskChecklist,
            Asset,
            Crew,
            AuditLog,
            Webhook,
            Policy,
        ]

        print(f"  Successfully imported {len(models)} models")
        for model in models:
            print(f"    - {model.__name__}")

        return True
    except ImportError as e:
        print(f"✗ FAILED: Could not import models: {e}")
        return False


def check_database_url():
    """Verify DATABASE_URL is set."""
    print("\n✓ Checking DATABASE_URL...")

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("✗ WARNING: DATABASE_URL environment variable not set")
        print("  Set with: export DATABASE_URL='postgresql://user:pass@host:port/dbname'")
        return False

    # Mask password in output
    if "@" in database_url:
        parts = database_url.split("@")
        auth_parts = parts[0].split(":")
        if len(auth_parts) >= 3:
            masked = f"{auth_parts[0]}:{auth_parts[1]}:***@{parts[1]}"
        else:
            masked = f"{auth_parts[0]}:***@{parts[1]}"
    else:
        masked = database_url

    print(f"  DATABASE_URL: {masked}")
    return True


def check_database_connection():
    """Verify database connection works."""
    print("\n✓ Checking database connection...")

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("  Skipped (DATABASE_URL not set)")
        return True

    try:
        from app.core.database import sync_engine

        with sync_engine.connect() as conn:
            result = conn.execute("SELECT version()")
            version = result.scalar()

            print("  Connection successful!")
            print(f"  PostgreSQL version: {version.split(',')[0]}")
            return True
    except Exception as e:
        print(f"✗ FAILED: Could not connect to database: {e}")
        return False


def main():
    """Run all verification checks."""
    print("=" * 60)
    print("Alembic Setup Verification")
    print("=" * 60)

    checks = [
        ("Alembic Config", check_alembic_config),
        ("Env.py Setup", check_env_py),
        ("Initial Migration", check_initial_migration),
        ("Model Imports", check_models),
        ("Database URL", check_database_url),
        ("Database Connection", check_database_connection),
    ]

    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ FAILED: {name} - Unexpected error: {e}")
            results.append((name, False))

    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    print(f"\nResults: {passed}/{total} checks passed")

    if passed == total:
        print("\n✓ All checks passed! Alembic setup is ready.")
        print("\nNext steps:")
        print("  1. Set DATABASE_URL if not already set")
        print("  2. Run: alembic upgrade head")
        print("  3. Verify tables created: psql $DATABASE_URL -c '\\dt'")
        return 0
    else:
        print("\n✗ Some checks failed. Please fix issues before running migrations.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

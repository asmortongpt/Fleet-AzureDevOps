# Git Hooks for Fleet Repository

This directory contains custom Git hooks to maintain repository health and prevent common issues.

## Pre-commit Hook

The pre-commit hook runs automatically before each commit and performs the following checks:

### 1. Large File Detection
- **Limit**: 5MB per file
- **Action**: Blocks commits containing files larger than 5MB
- **Solution**: Use Git LFS for large files
  ```bash
  git lfs track "*.extension"
  git add .gitattributes
  git add your-large-file
  ```

### 2. Secret Detection
Scans for potential hardcoded secrets including:
- Passwords
- API keys
- Tokens
- Private keys
- AWS/Azure credentials
- GitHub PATs

**Solution**: Use environment variables or Azure Key Vault

### 3. Bloat Detection
Warns about common bloat patterns:
- `node_modules/`
- `dist/`, `build/`, `.next/`
- `coverage/`
- `*.log`
- `.DS_Store`

**Solution**: Add to `.gitignore`

### 4. Debugging Code Detection
Warns about:
- `console.log`
- `debugger`
- `TODO`, `FIXME`, `XXX` comments

## Installation

Hooks are automatically enabled when you clone the repository. To manually enable:

```bash
git config core.hooksPath .git-hooks
```

## Bypassing Hooks (Not Recommended)

In exceptional circumstances, you can bypass hooks with:

```bash
git commit --no-verify
```

**Warning**: Only use this when you're absolutely certain it's safe.

## Troubleshooting

### Hook not running
```bash
# Verify hooks path
git config core.hooksPath

# Ensure executable permission
chmod +x .git-hooks/pre-commit
```

### False positives
If you get false positives for secrets, review the patterns in the pre-commit script and adjust as needed.

## Contributing

When modifying hooks:
1. Test thoroughly before committing
2. Document any new checks
3. Ensure cross-platform compatibility (macOS/Linux)
4. Update this README

---
name: update-app
description: Update dependencies, fix deprecations and warnings
---

# Dependency Update & Deprecation Fix

## Step 1: Check for Updates

```bash
npm outdated
```

Review which packages have newer versions available.

## Step 2: Update Dependencies

```bash
npm update
npm audit fix
```

Update packages within their semver ranges and fix security vulnerabilities.

## Step 3: Check for Deprecations & Warnings

Run a clean install and read ALL output carefully:

```bash
rm -rf node_modules package-lock.json
npm install
```

Look for:
- Deprecation warnings
- Security vulnerabilities
- Peer dependency warnings
- Breaking changes

## Step 4: Fix Issues

For each warning/deprecation found:
1. Research the recommended replacement or fix
2. Update code/dependencies accordingly
3. Re-run installation
4. Verify no warnings remain

## Step 5: Run Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

Fix all errors before completing.

## Step 6: Verify Clean Install

Ensure a fresh install works with zero warnings:

```bash
rm -rf node_modules package-lock.json
npm install
```

Verify:
- ZERO warnings/errors in output
- All dependencies resolve correctly
- Build completes successfully

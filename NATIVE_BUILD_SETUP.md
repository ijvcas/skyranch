# FARMIKA Native Build Setup Guide

## Overview
This guide explains how to set up and build the FARMIKA app for iOS and Android after cloning from GitHub.

## Prerequisites
- Node.js 18+ installed
- Xcode (for iOS builds)
- Android Studio (for Android builds)
- Git

## Initial Setup (First Time Only)

### 1. Clone and Install Dependencies
```bash
git clone [your-repo-url]
cd [your-repo-name]
npm install
```

### 2. Generate Native Platform Folders
The `ios/` and `android/` folders are not stored in Git and must be generated locally:

```bash
# Add iOS platform
npx cap add ios

# Add Android platform (optional)
npx cap add android
```

**Why?** Native platform folders contain generated code and are excluded from Git via `.gitignore`. Each developer must generate them locally.

## Daily Development Workflow

### After Every Git Pull

When you pull code changes from GitHub, you must sync the web assets with the native platforms:

```bash
# 1. Install any new dependencies
npm install

# 2. Build the web assets
npm run build

# 3. Sync changes to native platforms
npx cap sync ios
# or for Android:
npx cap sync android
```

### Building for iOS

1. Open the project in Xcode:
```bash
npx cap open ios
```

2. In Xcode:
   - Select your development team
   - Select your target device or simulator
   - Click Run (⌘R)

### Building for Android

1. Open the project in Android Studio:
```bash
npx cap open android
```

2. In Android Studio:
   - Sync Gradle files
   - Select your device/emulator
   - Click Run

## Understanding FARMIKA Branding

### How Branding Works

FARMIKA uses a **dynamic branding system** with three layers:

1. **App Icon Name** (Static)
   - Defined in `capacitor.config.ts` as `appName: 'FARMIKA'`
   - Shows on iOS/Android home screen

2. **In-App Display Name** (Dynamic)
   - Loaded from `farm_profiles` database table
   - Shown in navigation header and throughout the app
   - Users can customize via Settings → Personalización

3. **Offline Fallback** (Static)
   - Defined in `src/hooks/useFarmBranding.ts`
   - Used when database is unavailable

### Default Branding Configuration

After following this setup, your app will show:
- **Home Screen Icon**: "FARMIKA" (from `capacitor.config.ts`)
- **Navigation Header**: "FARMIKA" (from database, default in code)
- **Primary Color**: Green (#16a34a)
- **Secondary Color**: Light green (#22c55e)

## Common Issues

### Issue: "SKYRANCH" still appears in the app

**Cause**: Old database data or missing sync

**Solution**:
1. Check database: The `farm_profiles` table should have `farm_name = 'FARMIKA'`
2. Force a full resync:
```bash
npm run build
npx cap sync ios --force
```
3. Clean build in Xcode (Product → Clean Build Folder)
4. Rebuild and run

### Issue: Changes not appearing on device

**Cause**: Web assets not synced to native platform

**Solution**:
```bash
npm run build
npx cap sync ios
```
Always build web assets before syncing!

### Issue: Native folders missing after git pull

**Cause**: Normal behavior - these folders are gitignored

**Solution**:
```bash
npx cap add ios
npx cap add android
npx cap sync ios
```

## Key Files Reference

- `capacitor.config.ts` - App name and configuration
- `src/hooks/useFarmBranding.ts` - Branding defaults and logic
- `src/components/Navigation.tsx` - Uses dynamic branding
- `src/services/farmProfileService.ts` - Database service for farm profiles

## Quick Reference Commands

```bash
# Full setup from scratch
npm install
npx cap add ios
npm run build
npx cap sync ios
npx cap open ios

# After git pull
npm install
npm run build
npx cap sync ios
npx cap open ios

# Force resync (when things go wrong)
npm run build
npx cap sync ios --force
```

## Need Help?

If you encounter issues:
1. Check the console logs during `npm run build`
2. Check Xcode build logs
3. Verify database has correct farm_name
4. Try a clean build (Product → Clean Build Folder in Xcode)

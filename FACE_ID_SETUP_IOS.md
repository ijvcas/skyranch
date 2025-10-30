# Face ID Setup for FARMIKA iOS

## Overview
Face ID enables biometric authentication on iOS devices. The code is already implemented - you just need to configure the native iOS project.

## Important Update
✅ **The `ios/` folder is now tracked in git** - Face ID configuration (NSFaceIDUsageDescription in Info.plist) is automatically included! You no longer need to manually edit Info.plist.

## Prerequisites
- Mac with Xcode installed
- iPhone/iPad with Face ID (iPhone X or newer)
- Face ID enabled in device Settings → Face ID & Passcode
- Git and Node.js 18+

## Setup Steps

### 1. Sync iOS Platform

The `ios/` folder now comes with the repository:

```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Sync to iOS (updates existing ios/ folder from git)
npx cap sync ios
```

### 2. Face ID Permission (Already Configured!)

✅ **NSFaceIDUsageDescription is already in Info.plist** - no manual editing needed!

The configuration is preserved in `ios/App/App/Info.plist`:
```xml
<key>NSFaceIDUsageDescription</key>
<string>FARMIKA usa Face ID para acceso rápido y seguro a tu cuenta</string>
```

### 3. Build and Test on Physical Device

**Face ID only works on physical devices, not simulators.**

1. Connect your iPhone/iPad via USB
2. In Xcode, select your device from the device dropdown
3. Click Run (▶️) or press Cmd+R
4. Wait for build to complete

### 4. Test Face ID Flow

**Enable Biometric:**
1. Login to FARMIKA
2. Go to Settings → Biometric Authentication
3. Toggle ON "Habilitar Autenticación Biométrica"
4. Enter password in verification dialog
5. Face ID prompt should appear
6. Complete Face ID scan
7. Success message should show

**Test Login:**
1. Logout from app
2. On login screen, tap biometric icon (fingerprint)
3. Face ID prompt should appear
4. Complete Face ID scan
5. Should login automatically

## Common Issues

### Face ID prompt doesn't appear

**Cause**: Sync issue or cached build

**Solution**:
```bash
# Clean build folder
# In Xcode: Product → Clean Build Folder

# Force resync
npm run build
npx cap sync ios --force

# Rebuild and run
```

### "Biometric not available" message

**Cause**: Device or Face ID not configured

**Check**:
- Device has Face ID hardware (iPhone X+)
- Face ID enabled: Settings → Face ID & Passcode
- At least one face enrolled

### Changes not syncing to device

**Cause**: Native platform not synced

**Solution**:
```bash
npm run build
npx cap sync ios
```

## Important Notes

✅ **Info.plist changes are now tracked in git** - Face ID configuration is preserved!

💡 **After every git pull**, run:
```bash
npm install
npm run build
npx cap sync ios
```

## Quick Reference Commands

```bash
# Full setup from scratch
npm install
npm run build
npx cap sync ios
npx cap open ios

# After git pull
npm install
npm run build
npx cap sync ios

# Force resync
npm run build
npx cap sync ios --force
```

## Key Files

- `capacitor.config.ts` - Face ID permission reference (auto-synced to Info.plist)
- `src/services/biometricService.ts` - Biometric implementation
- `ios/App/App/Info.plist` - Native iOS permissions (tracked in git)

## Need Help?

If Face ID still doesn't work:
1. Check Xcode console logs for errors
2. Verify Info.plist has `NSFaceIDUsageDescription`
3. Clean build folder in Xcode (Product → Clean Build Folder)
4. Test on physical device with Face ID enrolled

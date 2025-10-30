# Face ID Setup for FARMIKA iOS

## Overview
Face ID enables biometric authentication on iOS devices. The code is already implemented - you just need to configure the native iOS project.

## Prerequisites
- Mac with Xcode installed
- iPhone/iPad with Face ID (iPhone X or newer)
- Face ID enabled in device Settings → Face ID & Passcode
- Git and Node.js 18+

## Setup Steps

### 1. Generate iOS Folder

The `ios/` folder is gitignored and must be generated locally:

```bash
# Install dependencies
npm install

# Generate iOS platform folder
npx cap add ios

# Build web assets
npm run build

# Sync to iOS
npx cap sync ios
```

### 2. Add Face ID Permission to Info.plist

**This is the critical step that makes Face ID work.**

#### Using Xcode (Recommended):

```bash
# Open project in Xcode
npx cap open ios
```

In Xcode:
1. Navigate to: `App` (folder) → `App` (sub-folder) → `Info.plist`
2. Hover over any row, click the `+` button
3. Add new entry:
   - **Key**: `NSFaceIDUsageDescription`
   - **Type**: String
   - **Value**: `FARMIKA usa Face ID para acceso rápido y seguro a tu cuenta`
4. Save (Cmd+S)

#### Manual Edit (Alternative):

Edit `ios/App/App/Info.plist` directly:

```xml
<key>NSFaceIDUsageDescription</key>
<string>FARMIKA usa Face ID para acceso rápido y seguro a tu cuenta</string>
```

Add this inside the root `<dict>` tag.

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

**Cause**: Missing `NSFaceIDUsageDescription` in Info.plist

**Solution**:
```bash
# Clean build folder
# In Xcode: Product → Clean Build Folder

# Verify Info.plist has the key (see Step 2)
# Rebuild and run
```

### App crashes when enabling Face ID

**Cause**: Missing permission causes immediate crash

**Solution**: Add `NSFaceIDUsageDescription` to Info.plist (see Step 2)

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

### iOS folder missing after git pull

**Cause**: Normal - ios/ is gitignored

**Solution**:
```bash
npx cap add ios
npx cap sync ios
```

## Important Notes

⚠️ **Info.plist must be edited manually** every time you regenerate the ios/ folder

⚠️ **capacitor.config.ts settings don't auto-sync** to Info.plist

💡 **After every git pull**, run:
```bash
npm install
npm run build
npx cap sync ios
```

💡 **Consider committing ios/ folder** to keep Info.plist changes - remove `ios/` from `.gitignore`

## Quick Reference Commands

```bash
# Full setup from scratch
npm install
npx cap add ios
npm run build
npx cap sync ios
npx cap open ios
# Then add NSFaceIDUsageDescription to Info.plist in Xcode

# After git pull
npm install
npm run build
npx cap sync ios
# If you regenerated ios/, add NSFaceIDUsageDescription again

# Force resync
npm run build
npx cap sync ios --force
```

## Key Files

- `capacitor.config.ts` - Face ID permission reference (not auto-synced)
- `src/services/biometricService.ts` - Biometric implementation
- `ios/App/App/Info.plist` - Native iOS permissions (manual edit required)

## Need Help?

If Face ID still doesn't work:
1. Check Xcode console logs for errors
2. Verify Info.plist has `NSFaceIDUsageDescription`
3. Clean build folder in Xcode (Product → Clean Build Folder)
4. Test on physical device with Face ID enrolled

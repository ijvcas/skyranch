# Face ID Setup Guide for FARMIKA iOS App

## 🎯 Quick Setup Checklist

- [ ] Generate iOS native folder
- [ ] Add Face ID permission to Info.plist
- [ ] Build and test on physical device

---

## Step 1: Generate iOS Native Folder

On your Mac, after pulling the latest code:

```bash
# Install dependencies
npm install

# Add iOS platform (creates ios/ folder)
npx cap add ios

# Build the web assets
npm run build

# Sync to iOS
npx cap sync ios
```

**Important**: The `ios/` folder is git-ignored, so you need to generate it locally every time you clone or pull.

---

## Step 2: Add Face ID Permission to Info.plist

This is the **CRITICAL STEP** that makes Face ID work.

### Option A: Using Xcode (Recommended)

1. **Open the project in Xcode:**
   ```bash
   npx cap open ios
   ```

2. **Navigate to Info.plist:**
   - In the left sidebar (Project Navigator)
   - Click on `App` (top folder)
   - Click on `App` (sub-folder)
   - Click on `Info.plist`

3. **Add the Face ID permission:**
   - Hover over any row in the list
   - Click the `+` button that appears
   - In the new row:
     - **Key**: `NSFaceIDUsageDescription`
     - **Type**: String (should be default)
     - **Value**: `FARMIKA usa Face ID para acceso rápido y seguro a tu cuenta`

4. **Save the file** (Cmd+S)

### Option B: Manual Edit

If you prefer to edit the XML directly, open `ios/App/App/Info.plist` in a text editor and add this entry inside the root `<dict>` tag:

```xml
<key>NSFaceIDUsageDescription</key>
<string>FARMIKA usa Face ID para acceso rápido y seguro a tu cuenta</string>
```

---

## Step 3: Build and Test on Physical Device

Face ID **only works on physical devices**, not the simulator.

### Build and Run:

1. **Connect your iPhone/iPad** via USB or WiFi

2. **Select your device** in Xcode:
   - Top bar: Click the device dropdown
   - Select your connected device

3. **Build and Run:**
   - Press the Play button (▶️) or press `Cmd+R`
   - Wait for the build to complete
   - App should launch on your device

### Test Face ID:

1. **Enable Face ID:**
   - Login to FARMIKA
   - Go to Settings → Biometric Authentication
   - Toggle ON "Habilitar Autenticación Biométrica"
   - Enter your password in the verification dialog
   - **Face ID prompt should appear** ✨
   - Complete the Face ID scan
   - You should see "Autenticación biométrica activada"

2. **Test Authentication:**
   - Logout from the app
   - On the login screen, tap the biometric icon (fingerprint icon)
   - **Face ID prompt should appear** ✨
   - Complete the Face ID scan
   - You should login automatically! 🎉

---

## How It Works

### Native iOS Flow:

1. **Check Availability**: `NativeBiometric.isAvailable()` checks if Face ID is available
2. **Save Credentials**: `NativeBiometric.setCredentials()` stores email/password in iOS Keychain
3. **Authenticate**: `NativeBiometric.verifyIdentity()` shows Face ID prompt
4. **Retrieve**: `NativeBiometric.getCredentials()` gets stored credentials from Keychain

### Security:

- ✅ Credentials stored in **iOS Keychain** (most secure storage)
- ✅ Protected by Face ID biometric authentication
- ✅ Automatically deleted if biometric is disabled
- ✅ Persists across app updates and device restarts

---

## Troubleshooting

### Face ID prompt doesn't appear

**Cause**: Missing `NSFaceIDUsageDescription` in Info.plist

**Fix**:
1. Verify you added the permission key to Info.plist (see Step 2)
2. Clean build folder: Xcode → Product → Clean Build Folder
3. Rebuild and run again

### App crashes when enabling Face ID

**Cause**: Missing permission always causes a crash

**Fix**: Add `NSFaceIDUsageDescription` to Info.plist

### "Biometric not available" message

**Check**:
- Device has Face ID hardware (iPhone X or newer)
- Face ID is enabled: Settings → Face ID & Passcode
- At least one face is enrolled

### Face ID works but doesn't login

**Check console logs in Xcode** for errors:
- Window → Devices and Simulators → Select device → View Device Logs
- Look for BiometricService logs

---

## Important Notes

⚠️ **Every time you regenerate ios/ folder**, you must:
1. Re-add the `NSFaceIDUsageDescription` to Info.plist
2. It's not automatically synced from capacitor.config.ts

💡 **Consider committing ios/ folder** to git if you want to keep the Info.plist changes. Remove `ios/` from `.gitignore`:
```bash
# In .gitignore, comment out or remove:
# ios/
```

🔄 **After every git pull**, run:
```bash
npm install
npm run build
npx cap sync ios
```

---

## Expected Console Logs (Success)

When enabling Face ID successfully, you should see:

```
✅ [BiometricService] Biometric available: true
✅ [BiometricService] Biometric type: faceId
💾 [BiometricService] Calling native setCredentials...
✅ [BiometricService] Credentials saved successfully
✅ [BiometricService] isEnabled: true
```

When authenticating with Face ID successfully:

```
🔐 [BiometricService] Starting authenticate...
✅ [BiometricService] Authentication successful
📱 [BiometricService] Fetching credentials from native...
✅ [BiometricService] Got credentials: [email protected]
```

---

## Summary

The code is **already fully implemented** for Face ID! You just need to:

1. ✅ Generate the iOS folder locally
2. ✅ Manually add the Face ID permission to Info.plist
3. ✅ Build and test on a real iPhone/iPad with Face ID

That's it! The BiometricService handles everything else automatically.

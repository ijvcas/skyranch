import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.farmika.manager',
  appName: 'FARMIKA',
  webDir: 'dist',
  // Server config removed for native builds - enables local bundled files
  // For development hot-reload, uncomment the lines below:
  // server: {
  //   url: 'https://skyranch.lovable.app?forceHideBadge=true',
  //   cleartext: true
  // },
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
    scheme: 'farmika'
  },
  android: {
    allowMixedContent: true,
    scheme: 'farmika'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#F4F582",
      showSpinner: false
    },
    CapacitorHttp: {
      enabled: true
    },
    CapacitorPreferences: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Camera: {
      ios: {
        // Permissions are localized via Info.plist and .lproj/InfoPlist.strings files
      },
      android: {
        permissions: [
          "android.permission.CAMERA",
          "android.permission.READ_EXTERNAL_STORAGE",
          "android.permission.WRITE_EXTERNAL_STORAGE"
        ]
      }
    },
    NativeBiometric: {
      ios: {
        // Permissions are localized via Info.plist and .lproj/InfoPlist.strings files
      }
    }
  }
};

export default config;

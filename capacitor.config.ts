import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skyranch.app',
  appName: 'SkyRanch Management',
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
    scheme: 'skyranch'
  },
  android: {
    allowMixedContent: true,
    scheme: 'skyranch'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#16a34a",
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
        NSCameraUsageDescription: "SkyRanch necesita acceso a la cámara para tomar fotos de animales",
        NSPhotoLibraryUsageDescription: "SkyRanch necesita acceso a la galería para seleccionar fotos de animales"
      },
      android: {
        permissions: [
          "android.permission.CAMERA",
          "android.permission.READ_EXTERNAL_STORAGE",
          "android.permission.WRITE_EXTERNAL_STORAGE"
        ]
      }
    }
  }
};

export default config;

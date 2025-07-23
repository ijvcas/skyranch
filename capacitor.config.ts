
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skyranch.app',
  appName: 'SkyRanch Management',
  webDir: 'dist',
  server: {
    url: 'https://skyranch.lovable.app?forceHideBadge=true',
    cleartext: true
  },
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
    }
  }
};

export default config;

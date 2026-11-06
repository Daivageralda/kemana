import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kemana.app',
  appName: 'Kemana',
  webDir: 'dist',
  // latar WebView toska: tidak ada kilatan putih di antara splash dan layar pertama
  backgroundColor: '#0D6B67',
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchFadeOutDuration: 300,
      backgroundColor: '#0D6B67',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
  },
};

export default config;

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qsopocket.app',
  appName: 'QSO Pocket',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b'
    }
  }
};

export default config;

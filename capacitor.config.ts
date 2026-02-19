import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.vendorspot.app', // Change this to your package name
  appName: 'VendorSpot',
  webDir: 'dist', // or 'build' if using React
  server: {
    androidScheme: 'https'
  },
  plugins: {},
};

export default config;
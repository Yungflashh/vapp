import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { SocketProvider } from './src/context/SocketContext';
import RootNavigator from './src/navigation';
import { navigationRef } from './src/navigation/navigationRef';
import { setupDeepLinking } from './src/utils/deepLinkHandler';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/config/toastConfig';
import AnimatedSplash from './src/components/AnimatedSplash';
import AppUpdateChecker from './src/components/AppUpdateChecker';

import './global.css';

const prefix = Linking.createURL('/');

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const cleanup = setupDeepLinking();
    return cleanup;
  }, []);

  const linking = {
    prefixes: [
      prefix,
      'vendorspot://',
      'https://vendorspotng.com',
      'https://www.vendorspotng.com',
    ],
    config: {
      screens: {
        VendorProfile: 'vendor/:vendorId',
        ProductDetails: 'products/:productId',
        Affiliate: 'affiliate/:referralCode',
      },
    },
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <NavigationContainer ref={navigationRef} linking={linking}>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
            <Toast config={toastConfig} />
            <AppUpdateChecker />
            {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
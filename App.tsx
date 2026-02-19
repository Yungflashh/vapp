import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useEffect, useRef } from 'react';

import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/config/toastConfig';

import './global.css';

const prefix = Linking.createURL('/');

export default function App() {
  const linking = {
    prefixes: [prefix, 'vendorspot://', 'https://vendorspotng.com', 'https://www.vendorspotng.com'],
    config: {
      screens: {
        VendorProfile: 'vendor/:vendorId',
        ProductDetails: 'product/:productId',
        // Add other screens as needed
      },
    },
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer linking={linking}>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>   
        <Toast config={toastConfig} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
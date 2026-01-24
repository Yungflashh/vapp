
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/config/toastConfig';

import './global.css';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>   
         <Toast config={toastConfig} />

    </AuthProvider>
  );
}

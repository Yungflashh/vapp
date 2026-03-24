import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen1 from '@/screens/auth/SplashScreen1';
import SplashScreen2 from '@/screens/auth/SplashScreen2';
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import SplashScreen3 from '@/screens/auth/SplashScreen3';
import OnboardingScreen from '@/screens/auth/Onboardingscreen';
import OTPVerificationScreen from '@/screens/auth/OTPVerificationScreen';
import VendorSetupScreen from '@/screens/auth/VendorSetupScreen';
import RegistrationSuccessScreen from '@/screens/auth/RegistrationSuccessScreen';
import PaymentSetupScreen from '@/screens/auth/PaymentSetupScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen'
import ResetPasswordScreen from '@/screens/auth/ResetPasswordScreen';
import VendorKYCVerificationScreen from '@/components/VendorComponentsScreen/Profile/VendorKYCVerificationScreen';
import AddProductScreen from '@/components/VendorComponentsScreen/Product/AddProductScreen';
import LegalScreen from '@/screens/LegalScreen';

// navigation/AuthNavigator.tsx
export type AuthStackParamList = {
  Onboarding: undefined;
  Splash1: undefined;
  Splash2: undefined;
  Splash3: undefined;
  Login: undefined;
  Register: undefined;
  OTPVerification: { email: string; isVendor?: boolean };
  VendorSetup: undefined;
  PaymentSetup: undefined;
  VendorKYCVerification: { isSetupFlow?: boolean };
  AddProduct: { isSetupFlow?: boolean };
  RegistrationSuccess: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  Legal: { tab?: 'privacy' | 'terms' | 'returns' };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(seen === 'true');
      } catch {
        setHasSeenOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  if (hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#CC3366" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={hasSeenOnboarding ? "Login" : "Onboarding"} screenOptions={{ headerShown: false }}>

      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      {/* <Stack.Screen name="Splash1" component={SplashScreen1} />
      <Stack.Screen name="Splash2" component={SplashScreen2} />
      <Stack.Screen name="Splash3" component={SplashScreen3} /> */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen 
        name="OTPVerification" 
        component={OTPVerificationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VendorSetup" 
        component={VendorSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RegistrationSuccess" 
        component={RegistrationSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentSetup"
        component={PaymentSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VendorKYCVerification"
        component={VendorKYCVerificationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
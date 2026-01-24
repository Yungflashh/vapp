
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

// navigation/AuthNavigator.tsx
export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  OTPVerification: { email: string };
  VendorSetup: undefined;
  PaymentSetup: undefined;
  RegistrationSuccess: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
      
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
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default AuthNavigator;

import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import DetailsScreen from '@/screens/DetailsScreen';
import BottomTabNavigator from './BottomTabNavigator';
import VendorBottomTabNavigator from './VendorBottomTabNavigator';
import AuthNavigator from './AuthNavigator';
import ProductDetailsScreen from '@/components/Products/ProductDetailsScreen';
import CartScreen from '@/components/Cart/CartScreen';
import CategoriesScreen from '@/screens/tabScreen/CategoriesScreen';
import CheckoutScreen from '@/components/Cart/CheckoutScreen';
import VendorProfileScreen from '@/components/Vendor/VendorProfileScreen';
import WishlistScreen from '@/screens/tabScreen/WishlistScreen';
import SettingsScreen from '@/components/Settings/SettingsScreen';
import AffiliateScreen from '@/components/Affiliate/AffiliateScreen';
import RewardsScreen from '@/components/Rewards/RewardsScreen';
import PointsHistoryScreen from '@/components/Points/PointsHistoryScreen';
import OrderDetailsScreen from '@/components/Orders/OrderDetailsScreen';
import OrdersScreen from '@/components/Orders/OrdersScreen';
import TrackOrderScreen from '@/components/Orders/TrackOrderScreen';
import MyDigitalProductsScreen from '@/components/Orders/MyDigitalProductsScreen';
import VendorSetupScreen from '@/screens/auth/VendorSetupScreen';
import PaymentSetupScreen from '@/screens/auth/PaymentSetupScreen';
import RegistrationSuccessScreen from '@/screens/auth/RegistrationSuccessScreen';
import AddProductScreen from '@/components/VendorComponentsScreen/Product/AddProductScreen';
import VendorProductDetailScreen from '@/components/VendorComponentsScreen/Product/VendorProductDetailScreen'; 
import api from '@/services/api';
import VendorEditProfileScreen from '@/components/VendorComponentsScreen/Profile/VendorEditProfileScreen';
import VendorStoreSetupScreen from '@/components/VendorComponentsScreen/Profile/VendorStoreSetupScreen';
import VendorKYCVerificationScreen from '@/components/VendorComponentsScreen/Profile/VendorKYCVerificationScreen';
import VendorStorefrontSetupScreen from '@/components/VendorComponentsScreen/Profile/VendorStorefrontSetupScreen';
import VendorBankSetupScreen from '@/components/VendorComponentsScreen/Profile/VendorBankSetupScreen';
import VendorOrderDetailScreen from '@/components/VendorComponentsScreen/Orders/VendorOrderDetailScreen';
import DeleteAccountScreen from '@/components/VendorComponentsScreen/DeleteAccount/DeleteAccountScreen';

export type RootStackParamList = {
  Main: undefined;
  VendorMain: undefined;
  VendorSetup: undefined;
  PaymentSetup: undefined;
  RegistrationSuccess: undefined;
  Details: { userId: string };
  ProductDetails: { productId: string };
  Cart: undefined;
  Categories: undefined;
  Checkout: undefined;
  VendorProfile: { vendorId: string };
  Wishlist: undefined; 
  Settings: undefined; 
  Affiliate: undefined; 
  Rewards: undefined;
  PointsHistory: undefined;
  Orders: undefined;
  OrderDetails: { orderId: string };
  TrackOrder: { orderId: string };
  MyDigitalProducts: undefined;
  AddProduct: undefined;
  VendorProductDetail: { productId: string }; 
  VendorEditProfile: undefined;
  VendorStoreSetup: undefined;
  VendorStorefrontSetup: undefined;
  VendorKYCVerification: undefined;
  VendorBankSetup: undefined;
  VendorOrderDetail: { orderId: string };  
  DeleteAccount: undefined;

};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { user } = useAuth();
  const [isVendor, setIsVendor] = useState(false);
  const [hasVendorProfile, setHasVendorProfile] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkVendorStatus();
  }, [user]);

  const checkVendorStatus = async () => {
    try {
      setIsChecking(true);
      
      // Check if user is a vendor
      if (user?.role === 'vendor') {
        setIsVendor(true);
        
        // Check if vendor has completed profile setup
        try {
          const response = await api.get('/vendor/profile');
          
          if (response.data.success && response.data.data.vendorProfile) {
            const profile = response.data.data.vendorProfile;
            
            // Check if vendor has completed all required fields
            const hasBusinessInfo = !!(
              profile.businessName &&
              profile.businessDescription &&
              profile.businessAddress?.street &&
              profile.businessAddress?.city &&
              profile.businessAddress?.state &&
              profile.businessPhone &&
              profile.businessEmail
            );
            
            const hasPayoutDetails = !!(
              profile.payoutDetails?.bankName &&
              profile.payoutDetails?.accountNumber &&
              profile.payoutDetails?.accountName &&
              profile.payoutDetails?.bankCode
            );
            
            setHasVendorProfile(hasBusinessInfo && hasPayoutDetails);
          } else {
            setHasVendorProfile(false);
          }
        } catch (error: any) {
          // If 404 or profile not found, vendor hasn't set up yet
          console.log('Vendor profile not found:', error);
          setHasVendorProfile(false);
        }
      } else {
        setIsVendor(false);
        setHasVendorProfile(false);
      }
    } catch (error) {
      console.error('Error checking vendor status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {/* Conditional Main Screen */}
      {isVendor && !hasVendorProfile ? (
        // Vendor without profile - send to setup
        <>
          <Stack.Screen 
            name="VendorSetup" 
            component={VendorSetupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PaymentSetup" 
            component={PaymentSetupScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : isVendor && hasVendorProfile ? (
        // Vendor with profile - show vendor tabs
        <Stack.Screen 
          name="VendorMain" 
          component={VendorBottomTabNavigator} 
          options={{ headerShown: false }} 
        />
      ) : (
        // Regular customer - show customer tabs
        <Stack.Screen 
          name="Main" 
          component={BottomTabNavigator} 
          options={{ headerShown: false }} 
        />
      )}

      {/* Shared Screens */}
      <Stack.Screen 
        name="Details" 
        component={DetailsScreen} 
      />
      <Stack.Screen 
        name="ProductDetails" 
        component={ProductDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Categories" 
        component={CategoriesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VendorProfile" 
        component={VendorProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Wishlist" 
        component={WishlistScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Affiliate" 
        component={AffiliateScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Rewards" 
        component={RewardsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PointsHistory" 
        component={PointsHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TrackOrder" 
        component={TrackOrderScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MyDigitalProducts" 
        component={MyDigitalProductsScreen}
        options={{
          headerShown: false,
          title: 'My Digital Products',
        }}
      />
      
      {/* Registration Success Screen - Can be accessed from setup flow */}
      <Stack.Screen 
        name="RegistrationSuccess" 
        component={RegistrationSuccessScreen}
        options={{ headerShown: false }}
      />

      {/* ✅ VENDOR PRODUCT SCREENS */}
      <Stack.Screen 
        name="AddProduct" 
        component={AddProductScreen}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="VendorProductDetail" 
        component={VendorProductDetailScreen}
        options={{ headerShown: false }}
      />

        <Stack.Screen 
  name="VendorEditProfile" 
  component={VendorEditProfileScreen}
  options={{ headerShown: false }}
/>
        <Stack.Screen 
  name="VendorStoreSetup" 
  component={VendorStoreSetupScreen}
  options={{ headerShown: false }}
/>
        <Stack.Screen 
  name="VendorStorefrontSetup" 
  component={VendorStorefrontSetupScreen}
  options={{ headerShown: false }}
/>
        <Stack.Screen 
  name="VendorBankSetup" 
  component={VendorBankSetupScreen}
  options={{ headerShown: false }}
/>
        <Stack.Screen 
  name="VendorKYCVerification" 
  component={VendorKYCVerificationScreen}
  options={{ headerShown: false }}
/>
 <Stack.Screen
    name="VendorOrderDetail"
    component={VendorOrderDetailScreen}
    options={{ headerShown: false }}
  />

<Stack.Screen 
  name="DeleteAccount" 
  component={DeleteAccountScreen}
  options={{ headerShown: false }}
/>

    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

export default RootNavigator;
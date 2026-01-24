import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import DetailsScreen from '@/screens/DetailsScreen';
import BottomTabNavigator from './BottomTabNavigator';
import AuthNavigator from './AuthNavigator';
import ProductDetailsScreen from '@/components/Products/ProductDetailsScreen';
import CartScreen from '@/components/Cart/CartScreen';
import CategoriesScreen from '@/screens/tabScreen/CategoriesScreen';
import CheckoutScreen from '@/components/Cart/CheckoutScreen';
import VendorProfileScreen from '@/components/Vendor/VendorProfileScreen';
import WishlistScreen from '@/screens/tabScreen/WishlistScreen'; // ✅ ADD THIS
import SettingsScreen from '@/components/Settings/SettingsScreen';

export type RootStackParamList = {
  Main: undefined;
  Details: { userId: string };
  ProductDetails: { productId: string };
  Cart: undefined;
  Categories: undefined;
  Checkout: undefined;
  VendorProfile: { vendorId: string };
  Wishlist: undefined; 
  Settings: undefined; 
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Main" 
        component={BottomTabNavigator} 
        options={{ headerShown: false }} 
      />
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
      {/* ✅ ADD THIS */}
      <Stack.Screen 
        name="VendorProfile" 
        component={VendorProfileScreen}
        options={{ headerShown: false }}
      />
      {/* ✅ ADD THIS */}
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
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

export default RootNavigator;
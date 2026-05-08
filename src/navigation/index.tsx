import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import VendorEditProfileScreen from '@/components/VendorComponentsScreen/Profile/VendorEditProfileScreen';
import VendorStoreSetupScreen from '@/components/VendorComponentsScreen/Profile/VendorStoreSetupScreen';
import VendorKYCVerificationScreen from '@/components/VendorComponentsScreen/Profile/VendorKYCVerificationScreen';
import VendorStorefrontSetupScreen from '@/components/VendorComponentsScreen/Profile/VendorStorefrontSetupScreen';
import VendorBankSetupScreen from '@/components/VendorComponentsScreen/Profile/VendorBankSetupScreen';
import VendorOrderDetailScreen from '@/components/VendorComponentsScreen/Orders/VendorOrderDetailScreen';
import DeleteAccountScreen from '@/components/VendorComponentsScreen/DeleteAccount/DeleteAccountScreen';
import WriteReviewScreen from '@/components/Reviews/WriteReviewScreen';
import EditProfileScreen from '@/components/Settings/EditProfileScreen';
import DisputeCenterScreen from '@/components/Settings/DisputeCenterScreen';
import NotificationSettingsScreen from '@/components/Settings/NotificationSettingsScreen';
import SavedAddressesScreen from '@/components/Settings/SavedAddressesScreen';
import PaymentWebViewScreen from '@/components/Payments/PaymentWebView';
import FileDisputeScreen from '@/components/Dispute/FileDisputeScreen';
import DisputeDetailsScreen from '@/components/Dispute/DisputeDetailsScreen';
import ChallengesScreen from '@/components/Challenges/ChallengesScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import ChatScreen from '@/screens/ChatScreen';
import CategoryProductsScreen from '@/screens/CategoryProductsScreen';
import GuestBottomTabNavigator from './GuestBottomTabNavigator';
import VendorEarningsScreen from '@/screens/vendor/VendorEarningsScreen';
import VendorDashboardScreen from '@/screens/vendor/VendorDashboardScreen';
import VendorProductsScreen from '@/screens/vendor/VendorProductsScreen';
import LegalScreen from '@/screens/LegalScreen';
import LeaderboardScreen from '@/screens/LeaderboardScreen';
import AIChatScreen from '@/screens/AIChatScreen';

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
  Checkout: { cart?: any } | undefined;
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
  EditProduct: { productId: string };
  VendorProductDetail: { productId: string };
  VendorEditProfile: undefined;
  VendorStoreSetup: undefined;
  VendorStorefrontSetup: undefined;
  VendorKYCVerification: undefined;
  VendorBankSetup: undefined;
  VendorOrderDetail: { orderId: string };
  DeleteAccount: undefined;
  SavedAddresses: undefined;
  WriteReview: {
      orderId: string;
      items: Array<{
        product: string;
        productName: string;
        productImage?: string;
      }>;
   };
   EditProfile: undefined;
   DisputeCenter: undefined;
   DisputeDetails: { disputeId: string; openMessageInput?: boolean };
   FileDispute: { orderId: string; orderNumber: string; items: any[]; vendorId?: string };

   Notifications: undefined;
   NotificationSettings: undefined;
   Chat: {
     conversationId?: string;
     receiverId: string;
     receiverName: string;
     receiverAvatar?: string;
     initialMessage?: string;
     isOrderChat?: boolean;
   };
     PaymentWebView: {
    paymentUrl: string;
    reference: string;
    provider: 'paystack' | 'flutterwave';
    checkoutSnapshot: any;
  };
  Challenges: undefined;
  Leaderboard: { challengeId?: string } | undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
  VendorEarnings: undefined;
  VendorDashboard: undefined;
  VendorProducts: undefined;
  Legal: { tab?: 'privacy' | 'terms' | 'returns' };
  AIChat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { user } = useAuth();
  // user.role is stable after login — derive isVendor synchronously, no async check needed.
  // The old async getMyVendorProfile() approach caused checkVendorStatus to re-run on every
  // user object change, risking isChecking toggling back to true and dropping the Stack context.
  const isVendor = user?.role === 'vendor';

  return (
    <Stack.Navigator>
      {/* Conditional Main Screen */}
      {isVendor ? (
        // Vendor - show vendor tabs (setup flow is handled in Auth navigator)
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
        name="AIChat"
        component={AIChatScreen}
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
        name="EditProduct"
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
 <Stack.Screen
      name="WriteReview"
      component={WriteReviewScreen}
      options={{ headerShown: false }}
    />
 <Stack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{ headerShown: false }}
    />
 <Stack.Screen
      name="DisputeCenter"
      component={DisputeCenterScreen}
      options={{ headerShown: false }}
    />
 <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ headerShown: false }}
    />
 <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: false }}
    />
 <Stack.Screen
      name="NotificationSettings"
      component={NotificationSettingsScreen}
      options={{ headerShown: false }}
    />
 <Stack.Screen
      name="SavedAddresses"
      component={SavedAddressesScreen}
      options={{ headerShown: false }}
    />

    <Stack.Screen
  name="PaymentWebView"
  component={PaymentWebViewScreen}
  options={{
    headerShown: false,
    // Prevent swipe-back on iOS (user might accidentally cancel payment)
    gestureEnabled: false,
  }}
/>

<Stack.Screen name="FileDispute" component={FileDisputeScreen} options={{ headerShown: false }} />
<Stack.Screen 
  name="DisputeDetails" 
  component={DisputeDetailsScreen} 
  options={{ headerShown: false }} 
/>
<Stack.Screen
  name="Challenges"
  component={ChallengesScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="Leaderboard"
  component={LeaderboardScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="CategoryProducts"
  component={CategoryProductsScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="VendorEarnings"
  component={VendorEarningsScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="VendorDashboard"
  component={VendorDashboardScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="VendorProducts"
  component={VendorProductsScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="Legal"
  component={LegalScreen}
  options={{ headerShown: false }}
/>

    </Stack.Navigator>
  );
}

function GuestAppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={GuestBottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
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
        name="CategoryProducts"
        component={CategoryProductsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Legal"
        component={LegalScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isGuest } = useAuth();

  if (isAuthenticated) return <AppNavigator />;
  if (isGuest) return <GuestAppNavigator />;
  return <AuthNavigator />;
}

export default RootNavigator;
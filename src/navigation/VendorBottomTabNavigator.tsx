import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '@/screens/tabScreen/HomeScreen';
import { MessagesScreen } from '@/screens/TabScreens';
import CustomTabBar from '@/components/CustomTabBar';
import ProfileScreen from '@/screens/vendor/VendorProfileScreen';
import VendorDashboardScreen from '@/screens/vendor/VendorDashboardScreen';
import VendorProductsScreen from '@/screens/vendor/VendorProductScreen';
import VendorOrdersScreen from '@/screens/vendor/VendorOrdersScreen';

export type VendorBottomTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Products: undefined;
  VendorOrders: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<VendorBottomTabParamList>();

function VendorBottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} isVendor={true} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dashboard" component={VendorDashboardScreen} />
      <Tab.Screen name="Products" component={VendorProductsScreen} />
      <Tab.Screen name="VendorOrders" component={VendorOrdersScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default VendorBottomTabNavigator;
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '@/screens/tabScreen/HomeScreen';
import CustomTabBar from '@/components/CustomTabBar';
import { GuestWishlistScreen, GuestOrdersScreen, GuestMessagesScreen, GuestProfileScreen } from '@/components/GuestPromptScreen';

export type BottomTabParamList = {
  Home: undefined;
  Orders: undefined;
  Wishlist: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

function GuestBottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={GuestOrdersScreen} />
      <Tab.Screen name="Wishlist" component={GuestWishlistScreen} />
      <Tab.Screen name="Messages" component={GuestMessagesScreen} />
      <Tab.Screen name="Profile" component={GuestProfileScreen} />
    </Tab.Navigator>
  );
}

export default GuestBottomTabNavigator;

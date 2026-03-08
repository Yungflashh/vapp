import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '@/screens/tabScreen/HomeScreen';
import { CategoriesScreen } from '@/screens/TabScreens';
import CustomTabBar from '@/components/CustomTabBar';
import { GuestWishlistScreen, GuestMessagesScreen, GuestProfileScreen } from '@/components/GuestPromptScreen';

export type BottomTabParamList = {
  Home: undefined;
  Categories: undefined;
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
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Wishlist" component={GuestWishlistScreen} />
      <Tab.Screen name="Messages" component={GuestMessagesScreen} />
      <Tab.Screen name="Profile" component={GuestProfileScreen} />
    </Tab.Navigator>
  );
}

export default GuestBottomTabNavigator;

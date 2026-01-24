import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '@/screens/tabScreen/HomeScreen';
import { CategoriesScreen, MessagesScreen } from '@/screens/TabScreens';
import CustomTabBar from '@/components/CustomTabBar';
import WishlistScreen from '@/screens/tabScreen/WishlistScreen';
import ProfileScreen from '@/screens/tabScreen/ProfileScreen';

export type BottomTabParamList = {
  Home: undefined;
  Categories: undefined;
  Wishlist: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;
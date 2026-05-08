import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '@/screens/tabScreen/HomeScreen';
import ConversationsScreen from '@/screens/ConversationsScreen';
import CustomTabBar from '@/components/CustomTabBar';
import WishlistScreen from '@/screens/tabScreen/WishlistScreen';
import OrdersScreen from '@/components/Orders/OrdersScreen';
import ProfileScreen from '@/screens/tabScreen/ProfileScreen';
import { navigate } from '@/navigation/navigationRef';

export type BottomTabParamList = {
  Home: undefined;
  Orders: undefined;
  Wishlist: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

function BottomTabNavigator() {
  useEffect(() => {
    const checkPendingCheckout = async () => {
      try {
        const pending = await AsyncStorage.getItem('pendingCheckout');
        if (pending === 'true') {
          await AsyncStorage.removeItem('pendingCheckout');
          // Use imperative navigate so this never throws "no navigation context"
          navigate('Cart');
        }
      } catch (error) {
        console.error('Error checking pending checkout:', error);
      }
    };
    checkPendingCheckout();
  }, []);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Messages" component={ConversationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSocket } from '@/context/SocketContext';

interface CustomTabBarProps extends BottomTabBarProps {
  isVendor?: boolean;
}

const CustomTabBar = ({ state, descriptors, navigation, isVendor = false }: CustomTabBarProps) => {
  const { unreadMessageCount, activeOrderCount } = useSocket();
  const insets = useSafeAreaInsets();

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? '#CC3366' : '#9CA3AF';
    const size = 22;

    // Vendor-specific icons
    if (isVendor) {
      switch (routeName) {
        case 'Home':
          return <Icon name="home" size={size} color={color} />;
        case 'Dashboard':
          return <MaterialIcon name="chart-box-outline" size={size} color={color} />;
        case 'Products':
          return <MaterialIcon name="package-variant" size={size} color={color} />;
        case 'VendorOrders':
          return <MaterialIcon name="clipboard-text-outline" size={size} color={color} />;
        case 'Messages':
          return <MaterialIcon name="message-outline" size={size} color={color} />;
        case 'Profile':
          return <Icon name="person-outline" size={size} color={color} />;
        default:
          return <Icon name="home" size={size} color={color} />;
      }
    }

    // Customer icons (original)
    switch (routeName) {
      case 'Home':
        return <Icon name="home" size={size} color={color} />;
      case 'Orders':
        return <Icon name="receipt-outline" size={size} color={color} />;
      case 'Wishlist':
        return <Icon name="heart-outline" size={size} color={color} />;
      case 'Messages':
        return <MaterialIcon name="message-outline" size={size} color={color} />;
      case 'Profile':
        return <Icon name="person-outline" size={size} color={color} />;
      default:
        return <Icon name="home" size={size} color={color} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    // Vendor-specific labels
    if (isVendor) {
      switch (routeName) {
        case 'Home':
          return 'Home';
        case 'Dashboard':
          return 'Dashboard';
        case 'Products':
          return 'Products';
        case 'VendorOrders':
          return 'Orders';
        case 'Messages':
          return 'Messages';
        case 'Profile':
          return 'Profile';
        default:
          return routeName;
      }
    }

    // Customer labels (original)
    switch (routeName) {
      case 'Home':
        return 'Home';
      case 'Orders':
        return 'Orders';
      case 'Wishlist':
        return 'Wishlist';
      case 'Messages':
        return 'Messages';
      case 'Profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  return (
    <View className="bg-white border-t border-gray-200">
      <View className="flex-row px-2 pt-2 pb-1">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
            >
              <View style={{ position: 'relative' }}>
                {getTabIcon(route.name, isFocused)}
                {route.name === 'Messages' && unreadMessageCount > 0 && (
                  <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: '#EC4899', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: '700' }}>
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </Text>
                  </View>
                )}
                {(route.name === 'Orders' || route.name === 'VendorOrders') && activeOrderCount > 0 && (
                  <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: '#CC3366', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: '700' }}>
                      {activeOrderCount > 9 ? '9+' : activeOrderCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontSize: 11,
                  marginTop: 2,
                  color: isFocused ? '#CC3366' : '#9CA3AF',
                  fontWeight: isFocused ? '600' : '400',
                }}
              >
                {getTabLabel(route.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Dynamic spacer for Android nav buttons / iOS home indicator */}
      <View style={{ height: Math.max(insets.bottom, 10), backgroundColor: 'white' }} />
    </View>
  );
};

export default CustomTabBar;
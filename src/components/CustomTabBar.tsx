import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? '#EC4899' : '#9CA3AF';
    const size = 24;

    switch (routeName) {
      case 'Home':
        return <Icon name="home" size={size} color={color} />;
      case 'Categories':
        return <MaterialIcon name="view-grid-outline" size={size} color={color} />;
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
    switch (routeName) {
      case 'Home':
        return 'Home';
      case 'Categories':
        return 'Categories';
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
    <View className="flex-row bg-white border-t border-gray-200 px-2 py-2">
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
            className="flex-1 items-center justify-center py-2"
          >
            {getTabIcon(route.name, isFocused)}
            <Text
              className={`text-xs mt-1 ${
                isFocused ? 'text-pink-500 font-semibold' : 'text-gray-500'
              }`}
            >
              {getTabLabel(route.name)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomTabBar;
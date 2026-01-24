import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Image, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

type OnboardingScreenProps = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  illustration: ImageSourcePropType;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to Vendorspot',
    description: "Nigeria's most trusted marketplace where verified vendors meet ready buyers. Shop, sell, earn, and deliver with confidence.",
    illustration: require('@/assets/splash/splash1.png'),
  },
  {
    id: '2',
    title: 'Shop With Confidence',
    description: 'Every vendor is verified. Every order is protected. Your trust is our priority',
    illustration: require('@/assets/splash/splash2.png'),
  },
  {
    id: '3',
    title: 'Earn While You Shop and Sell',
    description: 'Join affiliate programs, win prizes, and climb challenge leaderboards for rewards and shopping credits.',
    illustration: require('@/assets/splash/splash3.png'),
  },
];

const OnboardingScreen = ({ navigation }: OnboardingScreenProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={{ width }} className="flex-1">
        {/* Illustration Container */}
        <View className="flex-1 justify-center items-center mb-8 px-6">
          <View className="w-full aspect-square justify-center items-center">
            <Image 
              source={item.illustration}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-gray-900 text-center mb-3 px-6">
          {item.title}
        </Text>

        {/* Description */}
        <Text className="text-sm text-gray-500 text-center leading-5 mb-8 px-10">
          {item.description}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 pt-4 pb-10">
        {/* Header with Skip Button */}
        <View className="flex-row justify-between items-center px-6 mb-8">
          <Text className="text-sm text-gray-400">
            Onboarding {currentIndex + 1}
          </Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-sm text-gray-500 font-medium">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Swipeable Content */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={false}
        />

        {/* Bottom Section */}
        <View className="px-6">
          {/* Pagination Dots */}
          <View className="flex-row justify-center items-center mb-8 gap-2">
            {slides.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  index === currentIndex
                    ? 'w-6 bg-pink-500'
                    : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            className="bg-pink-500 py-4 rounded-lg mb-4"
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold text-center">
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>

          {/* Create Account Link */}
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-pink-500 text-sm font-medium text-center">
              Create account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
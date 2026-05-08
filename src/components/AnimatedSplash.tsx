import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const logo = require('../assets/logo.png');

interface Props {
  onFinish: () => void;
}

const AnimatedSplash = ({ onFinish }: Props) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.75);
  const screenOpacity = useSharedValue(1);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  useEffect(() => {
    // 1. Logo springs in
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 14, stiffness: 120 });

    // 2. After hold, fade the whole screen out and call onFinish
    screenOpacity.value = withDelay(
      1600,
      withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );
  }, []);

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.55,
    height: width * 0.55,
  },
});

export default AnimatedSplash;

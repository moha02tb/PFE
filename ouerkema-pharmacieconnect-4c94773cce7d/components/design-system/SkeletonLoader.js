import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { getColors } from '../../utils/colors';
import { SPACING } from '../../utils/spacing';

const SkeletonLoader = ({
  isDarkMode = false,
  height = 50,
  width = '100%',
  borderRadius = 8,
  count = 3,
}) => {
  const shimmerAnimated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimated, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimated, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnimated]);

  const colors = getColors(isDarkMode);
  const opacity = shimmerAnimated.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonStyle = {
    height,
    width,
    borderRadius,
    backgroundColor: isDarkMode ? '#333333' : '#E0E0E0',
    opacity,
  };

  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View key={index} style={[skeletonStyle, { marginBottom: SPACING.md }]} />
      ))}
    </View>
  );
};

export default SkeletonLoader;

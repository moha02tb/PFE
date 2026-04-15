import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../utils/theme';

export default function LoadingSkeleton({
  count = 1,
  height = 18,
  width = '100%',
  borderRadius = 12,
  gap = 12,
  style,
}) {
  const { colors } = useAppTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  const styles = StyleSheet.create({
    item: {
      height,
      width,
      borderRadius,
      backgroundColor: colors.skeletonBase,
      marginBottom: gap,
    },
  });

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View key={index} style={[styles.item, { opacity }]} />
      ))}
    </View>
  );
}

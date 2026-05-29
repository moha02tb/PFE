import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

const TIMING = {
  duration: 360,
  maxDelay: 260,
};

export default function EntranceView({
  children,
  delay = 0,
  index = 0,
  distance = 14,
  scaleFrom = 0.985,
  style,
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!mounted) return;
      setReduceMotion(enabled);

      if (enabled) {
        progress.setValue(1);
        return;
      }

      const startDelay = Math.min(delay + index * 45, TIMING.maxDelay);
      Animated.sequence([
        Animated.delay(startDelay),
        Animated.timing(progress, {
          toValue: 1,
          duration: TIMING.duration,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      mounted = false;
      progress.stopAnimation();
    };
  }, [delay, index, progress]);

  const animatedStyle = reduceMotion
    ? null
    : {
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [distance, 0],
            }),
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [scaleFrom, 1],
            }),
          },
        ],
      };

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

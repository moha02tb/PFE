import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useLanguage } from '../screens/LanguageContext';

// Animated view that smoothly transitions between LTR and RTL layouts
export const RTLAnimatedView = ({ children, style = {}, animationDuration = 300 }) => {
  const { isRTL } = useLanguage();
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate the transition when RTL changes
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isRTL ? -10 : 10,
        duration: animationDuration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(scaleX, {
        toValue: 0.95,
        duration: animationDuration / 2,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Second half of animation - back to normal
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: animationDuration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleX, {
          toValue: 1,
          duration: animationDuration / 2,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [isRTL, animationDuration, translateX, scaleX]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX }, { scaleX }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default RTLAnimatedView;

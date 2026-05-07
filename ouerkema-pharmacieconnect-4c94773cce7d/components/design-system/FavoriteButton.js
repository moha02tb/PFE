import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../utils/theme';
import IconButton from './IconButton';

export default function FavoriteButton({ active, onPress, accessibilityLabel, style }) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      rotate.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 110, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 170, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]),
    ]).start();
  }, [active, rotate, scale]);

  const animatedStyle = {
    transform: [
      { scale },
      {
        rotate: rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-9deg'],
        }),
      },
    ],
  };

  return (
    <Animated.View style={animatedStyle}>
      <IconButton
        active={active}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        style={style}
        icon={<Feather name="heart" size={18} color={active ? '#D94A63' : colors.iconMuted} />}
      />
    </Animated.View>
  );
}

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../utils/theme';

export default function AppCard({
  children,
  style,
  contentStyle,
  onPress,
  pressable = false,
  elevation = 2,
  padding = 16,
  margin,
  marginBottom = 0,
  borderAccent = false,
}) {
  const { colors, radius, shadows } = useAppTheme();
  const shadowMap = {
    1: shadows.subtle,
    2: shadows.card,
    3: shadows.raised,
    4: shadows.floating,
    5: shadows.modal,
  };

  const styles = StyleSheet.create({
    shell: {
      backgroundColor: borderAccent ? colors.primaryMuted : colors.surfaceElevated,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: borderAccent ? colors.borderStrong : colors.border,
      marginHorizontal: margin ?? 0,
      marginBottom,
      overflow: 'hidden',
    },
    content: {
      padding,
      backgroundColor: 'transparent',
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.992 }],
    },
  });

  const body = <View style={[styles.content, contentStyle]}>{children}</View>;

  if (pressable || onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.shell,
          shadowMap[elevation] || shadows.card,
          pressed && styles.pressed,
          style,
        ]}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={[styles.shell, shadowMap[elevation] || shadows.card, style]}>{body}</View>;
}

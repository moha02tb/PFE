import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '../../utils/theme';

export default function IconButton({ icon, onPress, active = false, style, accessibilityLabel }) {
  const { colors, radius } = useAppTheme();
  const styles = StyleSheet.create({
    button: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: active ? colors.primaryMuted : colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: active ? colors.primary : colors.border,
    },
    pressed: {
      opacity: 0.86,
      transform: [{ translateY: 1 }, { scale: 0.98 }],
    },
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      {icon}
    </Pressable>
  );
}

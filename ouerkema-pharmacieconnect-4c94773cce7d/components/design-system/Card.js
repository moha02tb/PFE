import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { getColors } from '../../utils/colors';
import { SPACING, BORDER_RADIUS, LAYOUT } from '../../utils/spacing';
import { getContextualShadow } from '../../utils/shadows';

/**
 * Card Component - Reusable container for content
 * Supports elevation, customizable padding, and theme-aware styling
 */
const Card = ({
  children,
  isDarkMode = false,
  elevation = 2,
  padding = LAYOUT.cardPadding,
  margin = 0,
  marginBottom = 0,
  style,
  onPress = null,
  pressable = false,
  borderColor = null,
  borderAccent = false,
}) => {
  const colors = getColors(isDarkMode);
  const shadow = getContextualShadow(elevation, isDarkMode);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface || '#FFFFFF',
      borderRadius: BORDER_RADIUS.lg,
      padding: padding,
      marginHorizontal: margin,
      marginBottom: marginBottom || margin,
      borderLeftWidth: borderAccent ? 4 : 0,
      borderLeftColor: borderAccent ? '#0066CC' : 'transparent',
      ...shadow,
    },
  });

  if (pressable && onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
};

export default Card;

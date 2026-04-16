import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../utils/theme';

export default function AppText({ variant = 'bodyLarge', color, align, style, children, ...props }) {
  const { textStyles, typography, colors, isRTL } = useAppTheme();

  const styles = StyleSheet.create({
    text: {
      ...(textStyles[variant] || typography[variant] || textStyles.bodyLarge),
      color: color || colors.text,
      textAlign: align || (isRTL ? 'right' : 'left'),
    },
  });

  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
}

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../utils/theme';

const SIZE_MAP = {
  small: { minHeight: 42, paddingHorizontal: 14, textVariant: 'labelMedium', iconSize: 16 },
  medium: { minHeight: 48, paddingHorizontal: 18, textVariant: 'labelLarge', iconSize: 18 },
  large: { minHeight: 54, paddingHorizontal: 20, textVariant: 'bodyMedium', iconSize: 18 },
};

export default function AppButton({
  title,
  onPress,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'leading',
  fullWidth = false,
  style,
  textStyle,
  children,
  accessibilityLabel,
}) {
  const theme = useAppTheme();
  const { colors, radius, shadows, textStyles, isRTL } = theme;
  const config = SIZE_MAP[size] || SIZE_MAP.medium;
  const tone = colors[color] || colors.primary;

  const palette = {
    contained: {
      backgroundColor: disabled ? colors.disabledSurface : tone,
      borderColor: 'transparent',
      textColor: disabled ? colors.disabled : colors.primaryForeground,
      shadow: shadows.raised,
    },
    outlined: {
      backgroundColor: colors.surface,
      borderColor: disabled ? colors.border : tone,
      textColor: disabled ? colors.disabled : tone,
      shadow: undefined,
    },
    tonal: {
      backgroundColor: disabled
        ? colors.disabledSurface
        : color === 'secondary'
          ? colors.secondaryMuted
          : colors.primaryMuted,
      borderColor: 'transparent',
      textColor: disabled ? colors.disabled : tone,
      shadow: undefined,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: disabled ? colors.disabled : tone,
      shadow: undefined,
    },
    text: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: disabled ? colors.disabled : tone,
      shadow: undefined,
    },
  }[variant] || {
    backgroundColor: tone,
    borderColor: 'transparent',
    textColor: colors.primaryForeground,
    shadow: shadows.card,
  };

  const styles = StyleSheet.create({
    button: {
      minHeight: config.minHeight,
      minWidth: fullWidth ? undefined : 110,
      width: fullWidth ? '100%' : undefined,
      borderRadius: size === 'small' ? radius.lg : radius.xl,
      paddingHorizontal: config.paddingHorizontal,
      borderWidth: variant === 'outlined' || variant === 'contained' ? 1 : 0,
      borderColor: palette.borderColor,
      backgroundColor: palette.backgroundColor,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      opacity: disabled ? 0.72 : 1,
      overflow: 'hidden',
    },
    pressed: {
      transform: [{ translateY: 1 }, { scale: 0.985 }],
      opacity: 0.92,
    },
    sheen: {
      position: 'absolute',
      top: 1,
      left: 1,
      right: 1,
      height: '52%',
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      backgroundColor: variant === 'contained' ? 'rgba(251,253,255,0.12)' : 'transparent',
    },
    content: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    text: {
      ...textStyles[config.textVariant],
      color: palette.textColor,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    spinnerWrap: {
      width: 18,
      alignItems: 'center',
    },
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        palette.shadow,
        pressed && !disabled && !loading ? styles.pressed : null,
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.sheen} />
      {loading ? (
        <View style={styles.content}>
          <View style={styles.spinnerWrap}>
            <ActivityIndicator
              size="small"
              color={variant === 'contained' ? colors.primaryForeground : palette.textColor}
            />
          </View>
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </View>
      ) : children ? (
        children
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'leading' ? icon : null}
          <Text style={[styles.text, textStyle]}>{title}</Text>
          {icon && iconPosition === 'trailing' ? icon : null}
        </View>
      )}
    </Pressable>
  );
}

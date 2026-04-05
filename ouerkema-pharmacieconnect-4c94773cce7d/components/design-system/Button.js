import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { getColors } from '../../utils/colors';
import { SPACING, BORDER_RADIUS, LAYOUT } from '../../utils/spacing';
import { getShadow, getContextualShadow } from '../../utils/shadows';
import { TEXT_STYLES, getTextStyle } from '../../utils/typography';

/**
 * Button Component with multiple variants and states
 * Variants: contained (filled), outlined (bordered), text (no background)
 * Supports loading state, disabled state, and size variants
 */
const Button = ({
  onPress,
  title,
  variant = 'contained',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  isDarkMode = false,
  style,
  children,
  color = 'primary',
  fullWidth = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const colors = getColors(isDarkMode);
  const shadow = getContextualShadow(2, isDarkMode);

  // Define button colors based on variant and color
  const getButtonColors = () => {
    const colorMap = {
      primary: getColors(isDarkMode).primary || '#0066CC',
      secondary: getColors(isDarkMode).secondary || '#22AA66',
      error: getColors(isDarkMode).error || '#D32F2F',
      text: colors.text,
    };

    return colorMap[color] || colorMap.primary;
  };

  const buttonColor = getButtonColors();

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  // Size variants
  const sizeStyles = {
    small: {
      height: 32,
      paddingHorizontal: 12,
    },
    medium: {
      height: LAYOUT.buttonHeight,
      paddingHorizontal: LAYOUT.buttonPadding,
    },
    large: {
      height: 56,
      paddingHorizontal: 24,
    },
  };

  const textSizeStyles = {
    small: TEXT_STYLES.labelSmall,
    medium: TEXT_STYLES.labelLarge,
    large: TEXT_STYLES.labelLarge,
  };

  const currentSizeStyle = sizeStyles[size] || sizeStyles.medium;
  const currentTextStyle = textSizeStyles[size] || textSizeStyles.medium;

  // Variant styles
  let buttonStyles = {};
  let textColor = '';

  switch (variant) {
    case 'contained':
      buttonStyles = {
        backgroundColor: disabled ? colors.tertiaryLight : buttonColor,
        borderWidth: 0,
      };
      textColor = '#FFFFFF';
      break;
    case 'outlined':
      buttonStyles = {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: disabled ? colors.tertiaryLight : buttonColor,
      };
      textColor = disabled ? colors.textTertiary : buttonColor;
      break;
    case 'text':
      buttonStyles = {
        backgroundColor: 'transparent',
        borderWidth: 0,
      };
      textColor = disabled ? colors.textTertiary : buttonColor;
      break;
  }

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDER_RADIUS.md,
      opacity: disabled ? 0.6 : 1,
      ...currentSizeStyle,
      ...buttonStyles,
      ...(variant === 'contained' && !disabled && shadow),
      width: fullWidth ? '100%' : 'auto',
      minWidth: LAYOUT.buttonMinWidth,
      gap: icon ? 8 : 0,
    },
    text: {
      color: textColor,
      fontWeight: '600',
      flex: 0,
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false,
    },
    iconView: {
      width: 'auto',
      height: 'auto',
      justifyContent: 'center',
      alignItems: 'center',
      display: 'flex',
    },
  });

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'contained' ? '#FFFFFF' : buttonColor}
          />
        ) : (
          <>
            {icon && <View style={styles.iconView}>{icon}</View>}
            {children ? children : <Text style={[currentTextStyle, styles.text]}>{title}</Text>}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Button;

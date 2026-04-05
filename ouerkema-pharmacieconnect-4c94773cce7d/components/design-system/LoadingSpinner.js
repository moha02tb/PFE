import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { getColors } from '../../utils/colors';
import { SPACING } from '../../utils/spacing';
import { TEXT_STYLES, getTextStyle } from '../../utils/typography';

/**
 * LoadingSpinner Component - Branded loading indicator
 */
const LoadingSpinner = ({
  size = 'large',
  isDarkMode = false,
  message = null,
  color = null,
  containerStyle = null,
}) => {
  const colors = getColors(isDarkMode);
  const spinnerColor = color || (isDarkMode ? '#4D9FFF' : '#0066CC');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
    content: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    message: {
      ...TEXT_STYLES.bodyMedium,
      color: colors.textSecondary,
      marginTop: SPACING.lg,
      textAlign: 'center',
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={spinnerColor} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
};

export default LoadingSpinner;

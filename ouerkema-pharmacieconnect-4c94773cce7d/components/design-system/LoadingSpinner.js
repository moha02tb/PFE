import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SPACING } from '../../utils/spacing';
import { useAppTheme } from '../../utils/theme';
import AppText from './Text';

/**
 * LoadingSpinner Component - Branded loading indicator
 */
const LoadingSpinner = ({
  size = 'large',
  message = null,
  color = null,
  containerStyle = null,
}) => {
  const { colors } = useAppTheme();
  const spinnerColor = color || colors.primary;

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
      marginTop: SPACING.lg,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={spinnerColor} />
        {message ? (
          <AppText
            variant="bodyMedium"
            color={colors.textSecondary}
            align="center"
            style={styles.message}
          >
            {message}
          </AppText>
        ) : null}
      </View>
    </View>
  );
};

export default LoadingSpinner;

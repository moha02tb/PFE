import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../../utils/colors';
import { SPACING, BORDER_RADIUS } from '../../utils/spacing';
import { TEXT_STYLES } from '../../utils/typography';
import Button from './Button';

/**
 * EmptyState Component - Display when no data is available
 */
const EmptyState = ({
  icon = 'search',
  title = 'No Results',
  message = 'No data available',
  actionTitle = null,
  onAction = null,
  isDarkMode = false,
  containerStyle = null,
}) => {
  const colors = getColors(isDarkMode);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    title: {
      ...TEXT_STYLES.headerSmall,
      color: colors.text,
      marginBottom: SPACING.sm,
      textAlign: 'center',
    },
    message: {
      ...TEXT_STYLES.bodyMedium,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: SPACING.xl,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color={colors.textTertiary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {actionTitle && onAction && (
        <Button title={actionTitle} onPress={onAction} isDarkMode={isDarkMode} size="medium" />
      )}
    </View>
  );
};

export default EmptyState;

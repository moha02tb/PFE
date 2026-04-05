import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getBadgeColors } from '../../utils/colors';
import { SPACING, BORDER_RADIUS } from '../../utils/spacing';
import { TEXT_STYLES, getTextStyle } from '../../utils/typography';

/**
 * Badge Component - Status indicators
 * Supports: open, closed, emergency, onDuty states
 */
const Badge = ({
  status = 'open',
  isDarkMode = false,
  size = 'medium',
  style,
  children = null,
}) => {
  const { t } = useTranslation();
  const { background, text } = getBadgeColors(status, isDarkMode);

  const sizeStyles = {
    small: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      ...TEXT_STYLES.labelSmall,
    },
    medium: {
      paddingHorizontal: SPACING.md,
      paddingVertical: 4,
      ...TEXT_STYLES.labelMedium,
    },
    large: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: 6,
      ...TEXT_STYLES.labelLarge,
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;

  const styles = StyleSheet.create({
    badge: {
      backgroundColor: background,
      borderRadius: BORDER_RADIUS.full,
      alignSelf: 'flex-start',
      ...currentSize,
    },
    text: {
      color: text,
      fontWeight: '600',
      fontSize: currentSize.fontSize,
    },
  });

  // Status labels mapping with translations
  const statusLabels = {
    open: t('home.open'),
    closed: t('home.closed'),
    emergency: t('home.emergency'),
    onDuty: t('home.onDuty'),
  };

  const label = statusLabels[status] || status;

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text} numberOfLines={1}>
        {children || label}
      </Text>
    </View>
  );
};

export default Badge;

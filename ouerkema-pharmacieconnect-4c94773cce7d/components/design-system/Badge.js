import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getBadgeColors } from '../../utils/colors';
import { useAppTheme } from '../../utils/theme';

export default function StatusBadge({
  status = 'open',
  children,
  style,
  size = 'medium',
  isDarkMode,
}) {
  const appTheme = useAppTheme();
  const darkMode = typeof isDarkMode === 'boolean' ? isDarkMode : appTheme.isDarkMode;
  const { radius, textStyles } = appTheme;
  const { background, text, border } = getBadgeColors(status, darkMode);
  const { t } = useTranslation();

  const sizeMap = {
    small: { paddingHorizontal: 8, paddingVertical: 4, textStyle: textStyles.labelSmall },
    medium: { paddingHorizontal: 10, paddingVertical: 6, textStyle: textStyles.labelMedium },
    large: { paddingHorizontal: 12, paddingVertical: 8, textStyle: textStyles.labelLarge },
  };
  const config = sizeMap[size] || sizeMap.medium;
  const labelMap = {
    open: t('home.open', 'Open'),
    closed: t('home.closed', 'Closed'),
    emergency: t('home.emergency', 'Emergency'),
    onDuty: t('home.onDuty', 'On duty'),
  };

  const styles = StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radius.lg,
      backgroundColor: background,
      borderWidth: 1,
      borderColor: border,
      paddingHorizontal: config.paddingHorizontal,
      paddingVertical: config.paddingVertical,
    },
    text: {
      ...config.textStyle,
      color: text,
      fontWeight: '600',
    },
  });

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{children || labelMap[status] || status}</Text>
    </View>
  );
}

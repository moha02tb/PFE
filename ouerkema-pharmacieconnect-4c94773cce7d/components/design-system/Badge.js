import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getBadgeColors } from '../../utils/colors';
import { useAppTheme } from '../../utils/theme';
import AppText from './Text';

const VARIANT_BY_SIZE = {
  small: 'labelSmall',
  medium: 'labelMedium',
  large: 'labelLarge',
};

const PADDING_BY_SIZE = {
  small: { paddingHorizontal: 8, paddingVertical: 4 },
  medium: { paddingHorizontal: 10, paddingVertical: 6 },
  large: { paddingHorizontal: 12, paddingVertical: 8 },
};

export default function StatusBadge({
  status = 'open',
  children,
  style,
  size = 'medium',
  isDarkMode,
}) {
  const appTheme = useAppTheme();
  const darkMode = typeof isDarkMode === 'boolean' ? isDarkMode : appTheme.isDarkMode;
  const { radius } = appTheme;
  const { background, text, border } = getBadgeColors(status, darkMode);
  const { t } = useTranslation();

  const padding = PADDING_BY_SIZE[size] || PADDING_BY_SIZE.medium;
  const variant = VARIANT_BY_SIZE[size] || VARIANT_BY_SIZE.medium;

  const labelMap = {
    open: t('home.open', 'Open'),
    closed: t('home.closed', 'Closed'),
    emergency: t('home.emergency', 'Emergency'),
    onDuty: t('home.onDuty', 'On duty'),
    garde: t('home.garde', 'De garde'),
    night: t('home.night', 'Pharmacie de nuit'),
  };

  const styles = StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radius.lg,
      backgroundColor: background,
      borderWidth: 1,
      borderColor: border,
      ...padding,
    },
  });

  return (
    <View style={[styles.badge, style]}>
      <AppText variant={variant} color={text} align="center" style={{ fontWeight: '600' }}>
        {children || labelMap[status] || status}
      </AppText>
    </View>
  );
}

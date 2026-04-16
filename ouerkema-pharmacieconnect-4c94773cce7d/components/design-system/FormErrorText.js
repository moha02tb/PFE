import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../utils/theme';
import AppText from './Text';

export default function FormErrorText({ message, style }) {
  const { colors, isRTL } = useAppTheme();
  if (!message) return null;

  const styles = StyleSheet.create({
    row: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.errorMuted,
    },
  });

  return (
    <View style={[styles.row, style]}>
      <Feather name="alert-circle" size={16} color={colors.error} />
      <AppText variant="bodySmall" color={colors.error} style={{ flex: 1 }}>
        {message}
      </AppText>
    </View>
  );
}

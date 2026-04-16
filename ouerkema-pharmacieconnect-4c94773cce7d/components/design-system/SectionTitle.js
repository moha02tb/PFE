import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../utils/theme';
import AppText from './Text';

export default function SectionTitle({ eyebrow, title, subtitle, aside }) {
  const { isRTL, colors } = useAppTheme();
  const styles = StyleSheet.create({
    row: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    content: {
      flex: 1,
    },
  });

  return (
    <View style={styles.row}>
      <View style={styles.content}>
        {eyebrow ? <AppText variant="labelSmall" color={colors.textSecondary} style={{ marginBottom: 4 }}>{eyebrow}</AppText> : null}
        <AppText variant="headerSmall">{title}</AppText>
        {subtitle ? <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 4 }}>{subtitle}</AppText> : null}
      </View>
      {aside}
    </View>
  );
}

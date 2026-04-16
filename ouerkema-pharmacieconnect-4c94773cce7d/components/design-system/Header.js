import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../utils/theme';
import AppText from './Text';

export default function AppHeader({ eyebrow, title, subtitle, action, onActionPress, actionIcon = 'ellipsis-horizontal' }) {
  const { colors, radius, isRTL } = useAppTheme();

  const styles = StyleSheet.create({
    row: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    content: {
      flex: 1,
    },
    action: {
      width: 40,
      height: 40,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
      marginStart: 12,
    },
  });

  return (
    <View style={styles.row}>
      <View style={styles.content}>
        {eyebrow ? <AppText variant="labelSmall" color={colors.textSecondary} style={{ marginBottom: 6 }}>{eyebrow}</AppText> : null}
        <AppText variant="headerMedium">{title}</AppText>
        {subtitle ? <AppText variant="bodyMedium" color={colors.textSecondary} style={{ marginTop: 6 }}>{subtitle}</AppText> : null}
      </View>
      {action || onActionPress ? (
        <Pressable onPress={onActionPress} style={styles.action}>
          {action || <Ionicons name={actionIcon} size={18} color={colors.text} />}
        </Pressable>
      ) : null}
    </View>
  );
}

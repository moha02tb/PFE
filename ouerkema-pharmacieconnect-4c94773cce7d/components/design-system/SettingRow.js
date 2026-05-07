import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../utils/theme';
import AppText from './Text';

export default function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  rightLabel,
  switchValue,
  onSwitchChange,
  destructive = false,
}) {
  const { colors, radius, isRTL } = useAppTheme();

  const styles = StyleSheet.create({
    row: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
    },
    left: {
      flex: 1,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 14,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: destructive ? colors.errorMuted : colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: destructive ? colors.errorMuted : colors.border,
    },
    textWrap: {
      flex: 1,
    },
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.84 }]}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={destructive ? colors.error : colors.primary}
          />
        </View>
        <View style={styles.textWrap}>
          <AppText
            variant="bodyLarge"
            color={destructive ? colors.error : colors.text}
            style={{ fontWeight: '600' }}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 3 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      {typeof switchValue === 'boolean' ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          thumbColor={colors.textInverse}
          trackColor={{ false: colors.borderStrong, true: colors.primary }}
        />
      ) : rightLabel ? (
        <AppText variant="bodySmall" color={colors.textSecondary}>
          {rightLabel}
        </AppText>
      ) : (
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={18}
          color={colors.iconMuted}
        />
      )}
    </Pressable>
  );
}

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../utils/theme';
import AppButton from './Button';

export default function EmptyState({
  icon = 'search-outline',
  title,
  message,
  actionTitle,
  onAction,
  containerStyle,
}) {
  const { colors, radius, textStyles, isRTL } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 32,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
      marginBottom: 18,
    },
    title: {
      ...textStyles.headerSmall,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      ...textStyles.bodyMedium,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: onAction ? 18 : 0,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionTitle && onAction ? (
        <AppButton title={actionTitle} onPress={onAction} variant="tonal" />
      ) : null}
    </View>
  );
}

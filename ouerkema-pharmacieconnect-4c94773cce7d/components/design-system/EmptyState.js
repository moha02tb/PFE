import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
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
  const { colors, radius, textStyles } = useAppTheme();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!mounted || enabled) return;

      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(float, { toValue: 1, duration: 1300, useNativeDriver: true }),
          Animated.timing(float, { toValue: 0, duration: 1300, useNativeDriver: true }),
        ])
      );
      loop.start();
    });

    return () => {
      mounted = false;
      loop?.stop();
    };
  }, [float]);

  const iconMotion = {
    transform: [
      {
        translateY: float.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 32,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.border,
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
      maxWidth: 280,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.iconWrap, iconMotion]}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </Animated.View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionTitle && onAction ? (
        <AppButton title={actionTitle} onPress={onAction} variant="tonal" />
      ) : null}
    </View>
  );
}

import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../utils/theme';
import AppButton from './Button';
import AppText from './Text';

export default function EmptyState({
  icon = 'search-outline',
  illustration = null,
  title,
  message,
  actionTitle,
  onAction,
  containerStyle,
}) {
  const { colors, radius } = useAppTheme();
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
    illustrationWrap: {
      marginBottom: 12,
      alignItems: 'center',
      justifyContent: 'center',
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
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {illustration ? (
        <Animated.View style={[styles.illustrationWrap, iconMotion]}>{illustration}</Animated.View>
      ) : (
        <Animated.View style={[styles.iconWrap, iconMotion]}>
          <Ionicons name={icon} size={28} color={colors.primary} />
        </Animated.View>
      )}
      {title ? (
        <AppText variant="headerSmall" align="center" style={{ marginBottom: 8 }}>
          {title}
        </AppText>
      ) : null}
      {message ? (
        <AppText
          variant="bodyMedium"
          color={colors.textSecondary}
          align="center"
          style={{ marginBottom: onAction ? 18 : 0, maxWidth: 280 }}
        >
          {message}
        </AppText>
      ) : null}
      {actionTitle && onAction ? (
        <AppButton title={actionTitle} onPress={onAction} variant="tonal" />
      ) : null}
    </View>
  );
}

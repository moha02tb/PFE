import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../utils/theme';

export default function AppModal({
  visible,
  onClose,
  title,
  children,
  fullHeight = false,
  showCloseButton = true,
}) {
  const { colors, radius, shadows, textStyles, isRTL } = useAppTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 28,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 28,
      minHeight: fullHeight ? '92%' : undefined,
      maxHeight: fullHeight ? '92%' : '84%',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.modal,
    },
    grabber: {
      alignSelf: 'center',
      width: 48,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.borderStrong,
      marginBottom: 16,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    title: {
      ...textStyles.headerSmall,
      color: colors.text,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
      marginStart: 12,
    },
  });

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.grabber} />
          {(title || showCloseButton) && (
            <View style={styles.header}>
              <Text style={styles.title}>{title || ''}</Text>
              {showCloseButton ? (
                <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button">
                  <Ionicons name="close" size={20} color={colors.text} />
                </Pressable>
              ) : null}
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}

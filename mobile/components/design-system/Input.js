import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../utils/theme';

export default function AppInput({
  label,
  helperText,
  error,
  icon,
  trailing,
  clearable,
  value,
  onChangeText,
  onClear,
  secureTextEntry,
  isDarkMode,
  isRTL,
  editable = true,
  style,
  inputStyle,
  ...props
}) {
  const appTheme = useAppTheme();
  const theme = useMemo(
    () =>
      typeof isDarkMode === 'boolean' || typeof isRTL === 'boolean'
        ? {
            ...appTheme,
            isDarkMode: isDarkMode ?? appTheme.isDarkMode,
            isRTL: isRTL ?? appTheme.isRTL,
          }
        : appTheme,
    [appTheme, isDarkMode, isRTL]
  );
  const { colors, radius, textStyles, shadows } = theme;
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hasError = Boolean(error);
  const inputRef = useRef(null);

  const styles = StyleSheet.create({
    wrapper: {
      marginBottom: 14,
    },
    label: {
      ...textStyles.labelLarge,
      color: colors.text,
      marginBottom: 8,
      textAlign: theme.isRTL ? 'right' : 'left',
      fontWeight: '600',
    },
    field: {
      minHeight: 52,
      borderRadius: radius.lg,
      borderWidth: focused || hasError ? 1.5 : 1,
      borderColor: hasError ? colors.error : focused ? colors.primary : colors.border,
      backgroundColor: editable
        ? focused
          ? colors.inputFocused
          : colors.input
        : colors.disabledSurface,
      paddingHorizontal: 15,
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      ...(focused && !hasError ? shadows.subtle : null),
    },
    iconWrap: {
      width: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      ...textStyles.bodyLarge,
      flex: 1,
      color: colors.text,
      textAlign: theme.isRTL ? 'right' : 'left',
      paddingVertical: 14,
    },
    helper: {
      ...textStyles.bodySmall,
      color: hasError ? colors.error : colors.textSecondary,
      marginTop: 7,
      textAlign: theme.isRTL ? 'right' : 'left',
    },
    action: {
      minWidth: 36,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    focusLine: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 0,
      height: 2,
      borderRadius: radius.full,
      backgroundColor: hasError ? colors.error : colors.primary,
      opacity: focused ? 1 : 0,
    },
  });

  const trailingNode = secureTextEntry ? (
    <Pressable
      hitSlop={10}
      onPress={() => setShowPassword((current) => !current)}
      style={styles.action}
      accessibilityRole="button"
      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
    >
      <Ionicons
        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={colors.iconMuted}
      />
    </Pressable>
  ) : clearable && value ? (
    <Pressable
      hitSlop={10}
      onPress={() => {
        onChangeText?.('');
        onClear?.();
      }}
      style={styles.action}
      accessibilityRole="button"
      accessibilityLabel="Clear field"
    >
      <Ionicons name="close-circle" size={18} color={colors.iconMuted} />
    </Pressable>
  ) : (
    trailing
  );

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        style={styles.field}
        onPress={() => {
          if (editable) {
            inputRef.current?.focus();
          }
        }}
      >
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholderTextColor={colors.textTertiary}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          autoCapitalize={props.autoCapitalize ?? 'none'}
          autoCorrect={props.autoCorrect ?? false}
          showSoftInputOnFocus={props.showSoftInputOnFocus ?? true}
          style={[styles.input, inputStyle]}
          {...props}
        />
        {trailingNode ? <View>{trailingNode}</View> : null}
        <View pointerEvents="none" style={styles.focusLine} />
      </Pressable>
      {helperText || error ? <Text style={styles.helper}>{error || helperText}</Text> : null}
    </View>
  );
}

import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../../utils/colors';
import { SPACING, BORDER_RADIUS, LAYOUT } from '../../utils/spacing';
import { TEXT_STYLES } from '../../utils/typography';

export default function Input({
  placeholder,
  value,
  onChangeText,
  label,
  error,
  disabled,
  isDarkMode,
  isRTL,
  icon,
  clearable,
  onClear,
  secureTextEntry,
  keyboardType,
  maxLength,
  editable,
  style,
  onFocus,
  onBlur,
  accessibilityLabel,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  const inputRef = useRef(null);

  const colors = getColors(isDarkMode || false);

  const styles = StyleSheet.create({
    container: {
      marginBottom: (error ? SPACING.lg : SPACING.md) || 0,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isFocused ? '#0066CC' : '#E0E0E0',
      borderRadius: 8,
      backgroundColor: colors.surface || '#FFFFFF',
      paddingHorizontal: 8,
      minHeight: 44,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 8,
      paddingHorizontal: 8,
      textAlign: isRTL ? 'right' : 'left',
    },
    iconWrapper: {
      paddingHorizontal: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapper}>
        {icon && !clearable && <View style={styles.iconWrapper}>{icon}</View>}

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder={placeholder || ''}
          placeholderTextColor={colors.textTertiary || '#999'}
          value={value || ''}
          onChangeText={onChangeText || (() => {})}
          onFocus={() => {
            setIsFocused(true);
            if (onFocus) onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          editable={editable !== false}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType || 'default'}
          maxLength={maxLength}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          accessibilityLabel={accessibilityLabel}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {clearable && value && (
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => {
              if (onChangeText) onChangeText('');
              if (onClear) onClear();
            }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

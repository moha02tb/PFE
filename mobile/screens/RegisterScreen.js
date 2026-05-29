import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AuthShell from '../components/AuthShell';
import { AppButton, AppInput, AppText, FormErrorText } from '../components/design-system';
import { useAuth } from './AuthContext';
import { useAppTheme } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors, radius, isRTL } = useAppTheme();
  const { register, beginEmailVerification, loading, error } = useAuth();
  const styles = useMemo(() => createStyles(colors, radius, isRTL), [colors, radius, isRTL]);

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = t('Email is required', 'Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = t('Invalid email address', 'Invalid email address');
    }
    if (!form.username.trim()) nextErrors.username = t('Username is required', 'Username is required');
    else if (form.username.trim().length < 3) {
      nextErrors.username = t('Username must be at least 3 characters', 'Username must be at least 3 characters');
    }
    if (!form.password) nextErrors.password = t('Password is required', 'Password is required');
    else if (form.password.length < 6) {
      nextErrors.password = t('Password must be at least 6 characters', 'Password must be at least 6 characters');
    }
    if (!form.confirmPassword) nextErrors.confirmPassword = t('Please confirm your password', 'Please confirm your password');
    else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = t('Passwords do not match', 'Passwords do not match');
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async() => {
    if (!validate()) return;
    const result = await register(form.email.trim(), form.password, form.username.trim());
    if (!result.success) {
      Alert.alert(t('Registration Failed', 'Registration Failed'), result.error);
      return;
    }
    beginEmailVerification(result.email || form.email.trim());
  };

  return (
    <AuthShell
      badge={
        <>
          <MaterialCommunityIcons name="account-plus-outline" size={18} color="#FFFFFF" />
          <AppText variant="labelMedium" color="#FFFFFF">PharmacieConnect</AppText>
        </>
      }
      title={t('Create Account', 'Create Account')}
      subtitle={t(
        'Join Pharmacies de Garde',
        'Create a secure profile to save favorites, manage reminders, and personalize your pharmacy experience.'
      )}
      highlights={[
        t('Save favorites', 'Save favorites'),
        t('Multi-language access', 'Multi-language access'),
      ]}
      footerNote={t(
        'You can verify your email right after registration and start using the app immediately.',
        'You can verify your email right after registration and start using the app immediately.'
      )}
    >
      <View style={{ marginBottom: 18 }}>
        <AppText variant="headerMedium">{t('Set up your profile', 'Set up your profile')}</AppText>
        <AppText variant="bodyMedium" color={colors.textSecondary} style={{ marginTop: 6 }}>
          {t('Complete the fields below', 'Complete the fields below to create your account')}
        </AppText>
      </View>

      <FormErrorText message={error} style={{ marginBottom: error ? 16 : 0 }} />

      <AppInput
        label={t('Email', 'Email')}
        placeholder={t('Enter your email', 'Enter your email')}
        value={form.email}
        onChangeText={(value) => setField('email', value)}
        keyboardType="email-address"
        error={errors.email}
        icon={<Feather name="mail" size={18} color={colors.iconMuted} />}
      />
      <AppInput
        label={t('Username', 'Username')}
        placeholder={t('Choose a username', 'Choose a username')}
        value={form.username}
        onChangeText={(value) => setField('username', value)}
        error={errors.username}
        icon={<Feather name="user" size={18} color={colors.iconMuted} />}
      />
      <AppInput
        label={t('Password', 'Password')}
        placeholder={t('Create a password', 'Create a password')}
        value={form.password}
        onChangeText={(value) => setField('password', value)}
        secureTextEntry
        error={errors.password}
        helperText={t('Use at least 6 characters', 'Use at least 6 characters')}
        icon={<Feather name="lock" size={18} color={colors.iconMuted} />}
      />
      <View style={styles.passwordTips}>
        <View style={styles.tipItem}>
          <Feather name="check-circle" size={15} color={colors.success} />
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {t('Minimum 6 characters', 'Minimum 6 characters')}
          </AppText>
        </View>
        <View style={styles.tipItem}>
          <Feather name="mail" size={15} color={colors.primary} />
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {t('Email verification required', 'Email verification required')}
          </AppText>
        </View>
      </View>
      <AppInput
        label={t('Confirm Password', 'Confirm Password')}
        placeholder={t('Confirm your password', 'Confirm your password')}
        value={form.confirmPassword}
        onChangeText={(value) => setField('confirmPassword', value)}
        secureTextEntry
        error={errors.confirmPassword}
        icon={<Feather name="shield" size={18} color={colors.iconMuted} />}
      />

      <AppButton
        title={t('Create Account', 'Create Account')}
        onPress={handleRegister}
        loading={loading}
        fullWidth
        size="large"
        icon={<Feather name="check" size={16} color="#FFFFFF" />}
        style={{ marginTop: 6 }}
      />

      <View style={styles.footer}>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          {t('Already have an account?', 'Already have an account?')}
        </AppText>
        <Pressable onPress={() => navigation.replace('LoginScreen')}>
          <AppText variant="labelLarge" color={colors.primary}>
            {t('Sign In', 'Sign In')}
          </AppText>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const createStyles = (colors, radius, isRTL) =>
  StyleSheet.create({
    passwordTips: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
      marginTop: -4,
      marginBottom: 12,
    },
    tipItem: {
      flex: 1,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: radius.xl,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    footer: {
      marginTop: 8,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingTop: 8,
    },
  });

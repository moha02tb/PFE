import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AuthShell from '../components/AuthShell';
import { AppButton, AppInput, AppText, FormErrorText } from '../components/design-system';
import { useAuth } from './AuthContext';
import { useAppTheme } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors, radius, isRTL } = useAppTheme();
  const { login, beginEmailVerification, loading, error } = useAuth();
  const styles = useMemo(() => createStyles(colors, radius, isRTL), [colors, radius, isRTL]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError(t('Email is required', 'Email is required'));
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError(t('Invalid email address', 'Invalid email address'));
      valid = false;
    }

    if (!password) {
      setPasswordError(t('Password is required', 'Password is required'));
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(t('Password must be at least 6 characters', 'Password must be at least 6 characters'));
      valid = false;
    }

    return valid;
  };

  const handleLogin = async() => {
    if (!validateForm()) return;
    const result = await login(email.trim(), password);
    if (!result.success) {
      if (typeof result.error === 'string' && result.error.toLowerCase().includes('verify your email')) {
        beginEmailVerification(email.trim());
        return;
      }
      Alert.alert(t('Login Failed', 'Login Failed'), result.error);
    }
  };

  return (
    <AuthShell
      badge={
        <>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color="#FFFFFF" />
          <AppText variant="labelMedium" color="#FFFFFF">PharmacieConnect</AppText>
        </>
      }
      title={t('Welcome back', 'Welcome back')}
      subtitle={t(
        'Sign in to your account',
        'Access pharmacies, directions, saved favorites, and reminders from one secure place.'
      )}
      highlights={[
        t('Nearby pharmacies', 'Nearby pharmacies'),
        t('Trusted information', 'Trusted information'),
      ]}
      footerNote={t(
        'By continuing, you access your saved pharmacies and personalized reminders securely.',
        'By continuing, you access your saved pharmacies and personalized reminders securely.'
      )}
    >
      <View style={styles.formHeader}>
        <AppText variant="headerMedium">{t('Sign in', 'Sign in')}</AppText>
        <AppText variant="bodyMedium" color={colors.textSecondary} style={{ marginTop: 6 }}>
          {t('Continue to your account', 'Continue to your account')}
        </AppText>
      </View>

      <FormErrorText message={error} style={{ marginBottom: error ? 16 : 0 }} />

      <AppInput
        label={t('Email', 'Email')}
        placeholder={t('Enter your email', 'Enter your email')}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setEmailError('');
        }}
        keyboardType="email-address"
        error={emailError}
        icon={<Feather name="mail" size={18} color={colors.iconMuted} />}
      />

      <AppInput
        label={t('Password', 'Password')}
        placeholder={t('Enter your password', 'Enter your password')}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setPasswordError('');
        }}
        secureTextEntry
        error={passwordError}
        icon={<Feather name="lock" size={18} color={colors.iconMuted} />}
      />

      <AppButton
        title={t('Sign In', 'Sign In')}
        onPress={handleLogin}
        loading={loading}
        size="large"
        fullWidth
        icon={<Feather name={isRTL ? 'arrow-left' : 'arrow-right'} size={16} color="#FFFFFF" />}
        iconPosition="trailing"
        style={{ marginTop: 6 }}
      />

      <View style={styles.assuranceRow}>
        <View style={styles.assuranceItem}>
          <Feather name="shield" size={16} color={colors.primary} />
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {t('Protected login', 'Protected login')}
          </AppText>
        </View>
        <View style={styles.assuranceItem}>
          <Feather name="clock" size={16} color={colors.primary} />
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {t('Fast access', 'Fast access')}
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          {t('New here?', 'New here?')}
        </AppText>
        <Pressable onPress={() => navigation.replace('Register')}>
          <AppText variant="labelLarge" color={colors.primary}>
            {t('Create your account', 'Create your account')}
          </AppText>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const createStyles = (colors, radius, isRTL) =>
  StyleSheet.create({
    formHeader: {
      marginBottom: 18,
    },
    assuranceRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
      marginTop: 14,
      marginBottom: 6,
    },
    assuranceItem: {
      flex: 1,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 44,
      borderRadius: radius.xl,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
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

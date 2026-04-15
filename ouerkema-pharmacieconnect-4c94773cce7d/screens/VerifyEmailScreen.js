import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AuthShell from '../components/AuthShell';
import { AppButton, AppInput, AppText, FormErrorText } from '../components/design-system';
import { useAuth } from './AuthContext';
import { useAppTheme } from '../utils/theme';

export default function VerifyEmailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { colors, radius, isRTL } = useAppTheme();
  const {
    verifyEmailCode,
    resendVerificationEmail,
    clearPendingVerification,
    pendingVerificationEmail,
    loading,
    error,
  } = useAuth();

  const email = route?.params?.email || pendingVerificationEmail || '';
  const styles = useMemo(() => createStyles(colors, radius, isRTL), [colors, radius, isRTL]);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleVerify = async() => {
    const normalized = code.trim();
    if (!normalized) {
      setCodeError(t('Enter the code sent to your email.', 'Enter the code sent to your email.'));
      return;
    }
    const result = await verifyEmailCode(email, normalized);
    if (!result.success) {
      Alert.alert(t('Verification Failed', 'Verification Failed'), result.error);
      return;
    }
    Alert.alert(t('Email verified', 'Email verified'), result.message, [
      {
        text: t('Sign In', 'Sign In'),
        onPress: () => {
          clearPendingVerification();
          navigation.replace('LoginScreen');
        },
      },
    ]);
  };

  const handleResend = async() => {
    const result = await resendVerificationEmail(email);
    if (!result.success) {
      Alert.alert(t('Resend Failed', 'Resend Failed'), result.error);
      return;
    }
    Alert.alert(t('Code sent', 'Code sent'), result.message);
  };

  return (
    <AuthShell
      badge={
        <>
          <MaterialCommunityIcons name="email-check-outline" size={18} color="#FFFFFF" />
          <AppText variant="labelMedium" color="#FFFFFF">PharmacieConnect</AppText>
        </>
      }
      title={t('Verify your email', 'Verify your email')}
      subtitle={t(
        'Enter the code we sent to continue.',
        'Use the verification code from your inbox to activate your account and continue securely.'
      )}
      highlights={[t('Secure sign-in', 'Secure sign-in'), t('Code valid for 15 min', 'Code valid for 15 min')]}
      footerNote={t(
        'If the email takes a moment to arrive, you can resend the code without leaving this screen.',
        'If the email takes a moment to arrive, you can resend the code without leaving this screen.'
      )}
    >
      <View style={styles.emailPill}>
        <Feather name="mail" size={16} color={colors.primary} />
        <AppText variant="labelLarge" color={colors.primary} style={{ flex: 1 }}>
          {email}
        </AppText>
      </View>

      <View style={{ marginBottom: 18 }}>
        <AppText variant="headerMedium">{t('Verification code', 'Verification code')}</AppText>
        <AppText variant="bodyMedium" color={colors.textSecondary} style={{ marginTop: 6 }}>
          {t('The code expires in 15 minutes.', 'The code expires in 15 minutes.')}
        </AppText>
      </View>

      <FormErrorText message={error} style={{ marginBottom: error ? 16 : 0 }} />

      <AppInput
        label={t('Code', 'Code')}
        placeholder={t('Enter 6-digit code', 'Enter 6-digit code')}
        value={code}
        onChangeText={(text) => {
          setCode(text.replace(/\D/g, '').slice(0, 6));
          setCodeError('');
        }}
        autoFocus
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        error={codeError}
        helperText={t('Check spam if you did not receive the email yet.', 'Check spam if you did not receive the email yet.')}
        icon={<Feather name="hash" size={18} color={colors.iconMuted} />}
      />
      <View style={styles.stepsCard}>
        <View style={styles.stepItem}>
          <View style={styles.stepDot}>
            <AppText variant="labelMedium" color="#FFFFFF">1</AppText>
          </View>
          <AppText variant="bodySmall" color={colors.textSecondary} style={{ flex: 1 }}>
            {t('Open the message sent to your inbox.', 'Open the message sent to your inbox.')}
          </AppText>
        </View>
        <View style={styles.stepItem}>
          <View style={styles.stepDot}>
            <AppText variant="labelMedium" color="#FFFFFF">2</AppText>
          </View>
          <AppText variant="bodySmall" color={colors.textSecondary} style={{ flex: 1 }}>
            {t('Enter the 6-digit code exactly as shown.', 'Enter the 6-digit code exactly as shown.')}
          </AppText>
        </View>
      </View>

      <AppButton
        title={t('Verify Email', 'Verify Email')}
        onPress={handleVerify}
        loading={loading}
        fullWidth
        size="large"
        icon={<Feather name="check" size={16} color="#FFFFFF" />}
        style={{ marginTop: 6 }}
      />
      <AppButton
        title={t('Resend code', 'Resend code')}
        onPress={handleResend}
        variant="tonal"
        fullWidth
        style={{ marginTop: 10 }}
      />

      <Pressable
        style={styles.backAction}
        onPress={() => {
          clearPendingVerification();
          navigation.replace('LoginScreen');
        }}
      >
        <AppText variant="bodySmall" color={colors.textSecondary}>
          {t('Back to sign in', 'Back to sign in')}
        </AppText>
      </Pressable>
    </AuthShell>
  );
}

const createStyles = (colors, radius, isRTL) =>
  StyleSheet.create({
    emailPill: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: radius.xl,
      backgroundColor: colors.primaryMuted,
      marginBottom: 18,
    },
    stepsCard: {
      gap: 10,
      borderRadius: radius.xl,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginTop: -2,
      marginBottom: 4,
    },
    stepItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
    },
    stepDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backAction: {
      alignItems: 'center',
      paddingTop: 14,
    },
  });

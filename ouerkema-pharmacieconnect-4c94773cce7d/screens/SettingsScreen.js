import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppInput,
  AppModal,
  AppText,
  EntranceView,
  SettingRow,
} from '../components/design-system';
import { useAppTheme } from '../utils/theme';

const LANGUAGES = ['Français', 'English', 'العربية'];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { language, setLanguage, isRTL } = useLanguage();
  const {
    notificationsEnabled,
    toggleNotifications,
    permissionStatus,
    sendPharmacyReminder,
    sendDailyReminder,
    clearAllNotifications,
  } = useNotifications();
  const { user, updateUserProfile, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors, radius, shadows } = useAppTheme();
  const styles = useMemo(
    () => createStyles(colors, radius, shadows, isRTL, insets.top),
    [colors, radius, shadows, isRTL, insets.top]
  );

  const [profileVisible, setProfileVisible] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: '', email: '', phone: '' });
  const [support, setSupport] = useState({ subject: '', body: '' });

  useEffect(() => {
    setProfileForm({
      username: user?.nomUtilisateur || user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user]);

  const profileName = user?.nomUtilisateur || user?.username || t('settings.profile', 'Profile');
  const profileEmail = user?.email || t('settings.noEmail', 'No email set');
  const profilePhone = user?.phone || t('settings.noPhone', 'No phone set');
  const permissionLabel =
    permissionStatus === 'granted'
      ? t('settings.notificationsGranted', 'Allowed')
      : permissionStatus === 'denied'
        ? t('settings.notificationsDenied', 'Blocked')
        : t('settings.notificationsUnknown', 'Not configured');

  const saveProfile = async () => {
    setSavingProfile(true);
    const result = await updateUserProfile({
      nomUtilisateur: profileForm.username,
      username: profileForm.username,
      email: profileForm.email,
      phone: profileForm.phone,
    });
    setSavingProfile(false);
    if (result?.success) {
      setProfileVisible(false);
      Alert.alert(
        t('settings.profileSaved', 'Profile updated'),
        t('settings.profileSavedMessage', 'Your profile information was saved successfully.')
      );
      return;
    }
    Alert.alert(
      t('settings.updateFailed', 'Update failed'),
      result?.error || t('settings.updateFailedMessage', 'Unable to update profile.')
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.signOut', 'Sign out'),
      t('settings.signOutConfirm', 'Do you want to sign out of the app?'),
      [
        { text: t('settings.cancel', 'Cancel'), style: 'cancel' },
        { text: t('settings.signOut', 'Sign out'), style: 'destructive', onPress: logout },
      ]
    );
  };

  const sendSupportEmail = async () => {
    const mail = `mailto:support@pharmacieconnect.app?subject=${encodeURIComponent(
      support.subject || 'Mobile app support request'
    )}&body=${encodeURIComponent(support.body || '')}`;
    await Linking.openURL(mail);
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <EntranceView delay={0} distance={18}>
            <View style={styles.hero}>
              <View style={styles.heroPanel} />
              <View style={styles.heroGridLine} />
              <View style={styles.heroBadge}>
                <Feather name="settings" size={16} color={colors.textInverse} />
                <AppText variant="labelMedium" color={colors.textInverse}>
                  {t('settings.title', 'Settings')}
                </AppText>
              </View>
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <AppText variant="headerSmall" color={colors.primary} align="center">
                    {`${profileName || 'P'}`.trim().charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="headerLarge" color={colors.textInverse} numberOfLines={2}>
                    {profileName}
                  </AppText>
                  <AppText
                    variant="bodyMedium"
                    color="rgba(247,251,255,0.82)"
                    style={{ marginTop: 4 }}
                    numberOfLines={1}
                  >
                    {profileEmail}
                  </AppText>
                </View>
              </View>

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <AppText variant="labelLarge" color={colors.textInverse} numberOfLines={1}>
                    {language}
                  </AppText>
                  <AppText variant="labelSmall" color="rgba(247,251,255,0.72)">
                    {t('settings.language', 'Language')}
                  </AppText>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <AppText variant="labelLarge" color={colors.textInverse}>
                    {notificationsEnabled ? t('settings.on', 'On') : t('settings.off', 'Off')}
                  </AppText>
                  <AppText variant="labelSmall" color="rgba(247,251,255,0.72)">
                    {t('settings.notifications', 'Notifications')}
                  </AppText>
                </View>
              </View>
            </View>
          </EntranceView>

          <EntranceView delay={90} distance={12}>
            <AppHeader
              eyebrow={t('settings.preferences', 'Preferences')}
              title={t('settings.appPreferences', 'App preferences')}
              subtitle={t(
                'settings.preferencesSubtitle',
                'Theme, language, and personalization controls'
              )}
            />
            <AppCard style={styles.group} contentStyle={styles.groupContent}>
              <SettingRow
                icon="account-circle-outline"
                title={t('settings.profile', 'Profile')}
                subtitle={`${profileEmail} · ${profilePhone}`}
                onPress={() => setProfileVisible(true)}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="translate"
                title={t('settings.language', 'Language')}
                subtitle={language}
                onPress={() => setLanguageVisible(true)}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="theme-light-dark"
                title={t('settings.darkMode', 'Dark mode')}
                subtitle={
                  isDarkMode
                    ? t('settings.darkModeOn', 'Dark mode is on')
                    : t('settings.darkModeOff', 'Dark mode is off')
                }
                switchValue={isDarkMode}
                onSwitchChange={setIsDarkMode}
              />
            </AppCard>
          </EntranceView>

          <EntranceView delay={150} distance={12}>
            <AppHeader
              eyebrow={t('settings.supportAndAlerts', 'Support and alerts')}
              title={t('settings.notificationsAndSupport', 'Notifications and support')}
              subtitle={t('settings.supportSubtitle', 'Control reminders and contact assistance')}
            />
            <AppCard style={styles.group} contentStyle={styles.groupContent}>
              <SettingRow
                icon="bell-badge-outline"
                title={t('settings.notifications', 'Notifications')}
                subtitle={`${permissionLabel} · ${notificationsEnabled ? t('settings.enabled', 'Enabled') : t('settings.disabled', 'Disabled')}`}
                onPress={() => setNotificationsVisible(true)}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="lifebuoy"
                title={t('settings.contactSupport', 'Contact support')}
                subtitle="support@pharmacieconnect.app"
                onPress={() => setSupportVisible(true)}
              />
            </AppCard>
          </EntranceView>

          <EntranceView delay={210} distance={12}>
            <AppHeader
              eyebrow={t('settings.account', 'Account')}
              title={t('settings.session', 'Session')}
              subtitle={t('settings.accountSubtitle', 'Security and access controls')}
            />
            <AppCard style={styles.group} contentStyle={styles.groupContent}>
              <SettingRow
                icon="logout"
                title={t('settings.signOut', 'Sign out')}
                subtitle={t('settings.signOutHint', 'End the current session on this device')}
                onPress={handleLogout}
                destructive
              />
            </AppCard>
          </EntranceView>
        </View>
      </ScrollView>

      <AppModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        title={t('settings.profile', 'Profile')}
      >
        <AppInput
          label={t('Username', 'Username')}
          value={profileForm.username}
          onChangeText={(value) => setProfileForm((current) => ({ ...current, username: value }))}
          icon={<Feather name="user" size={18} color={colors.iconMuted} />}
        />
        <AppInput
          label={t('Email', 'Email')}
          value={profileForm.email}
          onChangeText={(value) => setProfileForm((current) => ({ ...current, email: value }))}
          keyboardType="email-address"
          icon={<Feather name="mail" size={18} color={colors.iconMuted} />}
        />
        <AppInput
          label={t('Phone', 'Phone')}
          value={profileForm.phone}
          onChangeText={(value) => setProfileForm((current) => ({ ...current, phone: value }))}
          keyboardType="phone-pad"
          icon={<Feather name="phone" size={18} color={colors.iconMuted} />}
        />
        <AppButton
          title={t('settings.saveProfile', 'Save Profile')}
          onPress={saveProfile}
          loading={savingProfile}
          fullWidth
        />
      </AppModal>

      <AppModal
        visible={languageVisible}
        onClose={() => setLanguageVisible(false)}
        title={t('settings.language', 'Language')}
      >
        {LANGUAGES.map((item) => (
          <AppButton
            key={item}
            title={item}
            onPress={() => {
              setLanguage(item);
              setLanguageVisible(false);
            }}
            variant={language === item ? 'contained' : 'outlined'}
            fullWidth
            style={{ marginBottom: 10 }}
          />
        ))}
      </AppModal>

      <AppModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        title={t('settings.notifications', 'Notifications')}
      >
        <AppText variant="bodyMedium" color={colors.textSecondary} style={{ marginBottom: 16 }}>
          {t(
            'settings.notificationsOverview',
            'Manage permissions, test reminders, and clean up scheduled notifications.'
          )}
        </AppText>
        <AppButton
          title={
            notificationsEnabled
              ? t('settings.disableNotifications', 'Disable notifications')
              : t('settings.enableNotifications', 'Enable notifications')
          }
          onPress={() => toggleNotifications(!notificationsEnabled)}
          fullWidth
          style={{ marginBottom: 10 }}
        />
        <AppButton
          title={t('settings.sendTestNotification', 'Send test notification')}
          onPress={() => sendPharmacyReminder('Test Pharmacie', 'Test Address')}
          variant="tonal"
          fullWidth
          style={{ marginBottom: 10 }}
        />
        <AppButton
          title={t('settings.dailyReminder', 'Daily reminder')}
          onPress={sendDailyReminder}
          variant="outlined"
          fullWidth
          style={{ marginBottom: 10 }}
        />
        <AppButton
          title={t('settings.clearNotifications', 'Clear notifications')}
          onPress={clearAllNotifications}
          variant="ghost"
          color="error"
          fullWidth
        />
      </AppModal>

      <AppModal
        visible={supportVisible}
        onClose={() => setSupportVisible(false)}
        title={t('settings.contactSupport', 'Contact support')}
      >
        <AppInput
          label={t('settings.subject', 'Subject')}
          value={support.subject}
          onChangeText={(value) => setSupport((current) => ({ ...current, subject: value }))}
        />
        <AppInput
          label={t('settings.message', 'Message')}
          value={support.body}
          onChangeText={(value) => setSupport((current) => ({ ...current, body: value }))}
          multiline
          numberOfLines={5}
          inputStyle={{ minHeight: 110, textAlignVertical: 'top' }}
        />
        <AppButton
          title={t('settings.sendEmail', 'Send email')}
          onPress={sendSupportEmail}
          fullWidth
        />
      </AppModal>
    </>
  );
}

const createStyles = (colors, radius, shadows, isRTL, topInset) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingTop: Math.max(topInset + 24, 96),
      paddingBottom: 140,
    },
    hero: {
      backgroundColor: colors.primary,
      borderRadius: radius.xl,
      padding: 24,
      marginBottom: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(247,251,255,0.12)',
      ...shadows.floating,
    },
    heroPanel: {
      position: 'absolute',
      width: 154,
      height: 220,
      borderRadius: radius.xxl,
      backgroundColor: 'rgba(247,251,255,0.1)',
      top: -46,
      right: isRTL ? undefined : -54,
      left: isRTL ? -54 : undefined,
      transform: [{ rotate: isRTL ? '-14deg' : '14deg' }],
    },
    heroGridLine: {
      position: 'absolute',
      height: 1,
      left: 24,
      right: 24,
      bottom: 94,
      backgroundColor: 'rgba(247,251,255,0.12)',
    },
    heroBadge: {
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(247,251,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(247,251,255,0.12)',
    },
    profileRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 14,
      marginTop: 18,
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(247,251,255,0.92)',
      borderWidth: 1,
      borderColor: 'rgba(247,251,255,0.28)',
    },
    heroStats: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginTop: 20,
      backgroundColor: 'rgba(5, 22, 46, 0.22)',
      borderRadius: radius.lg,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(247,251,255,0.1)',
    },
    heroStat: {
      flex: 1,
      alignItems: 'center',
    },
    heroDivider: {
      width: 1,
      height: 32,
      backgroundColor: 'rgba(247,251,255,0.18)',
    },
    group: {
      marginBottom: 24,
    },
    groupContent: {
      paddingVertical: 6,
      paddingHorizontal: 16,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
    },
  });

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Linking,
  I18nManager,
  Alert,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import RTLUtils from '../utils/RTLUtils';
import { useForceUpdate } from '../hooks/useForceUpdate';
import logger from '../utils/logger';
import { Button, Card, Input, Modal } from '../components/design-system';
import { getColors } from '../utils/colors';
import { SPACING, LAYOUT, BORDER_RADIUS } from '../utils/spacing';
import { getContextualShadow } from '../utils/shadows';
import { TEXT_STYLES } from '../utils/typography';

export default function SettingsScreen() {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { language, setLanguage, availableLanguages, isRTL } = useLanguage();
  const { t } = useTranslation();
  const {
    notificationsEnabled,
    toggleNotifications,
    isLoading: notificationLoading,
    permissionStatus,
    sendPharmacyReminder,
    sendDailyReminder,
    clearAllNotifications,
  } = useNotifications();
  const [modalLangVisible, setModalLangVisible] = useState(false);
  const [modalSupportVisible, setModalSupportVisible] = useState(false);
  const [modalNotificationVisible, setModalNotificationVisible] = useState(false);
  const [modalProfileVisible, setModalProfileVisible] = useState(false);
  const { user, updateUserProfile, logout } = useAuth();
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    phone: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const forceUpdate = useForceUpdate() || (() => {});

  useEffect(() => {
    setProfileForm({
      username: user?.nomUtilisateur || user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    setModalLangVisible(false);
    // Force immediate UI update
    setTimeout(() => forceUpdate(), 100);
  };

  const sendEmail = () => {
    Linking.openURL('mailto:support@example.com');
  };

  const callPhone = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleNotificationToggle = async (enabled) => {
    try {
      await toggleNotifications(enabled);
      if (enabled) {
        // Send a welcome notification
        await sendPharmacyReminder('Pharmacie Centrale', '123 Rue Habib Bourguiba, Tunis');
      }
    } catch (error) {
      logger.error('SettingsScreen', 'Error handling notification toggle', error);
    }
  };

  const testNotification = async () => {
    try {
      await sendPharmacyReminder('Test Pharmacie', 'Test Address - Notification de test');
      setModalNotificationVisible(false);
    } catch (error) {
      logger.error('SettingsScreen', 'Error sending test notification', error);
    }
  };

  const setupDailyReminder = async () => {
    try {
      await sendDailyReminder();
      setModalNotificationVisible(false);
    } catch (error) {
      logger.error('SettingsScreen', 'Error setting up daily reminder', error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await clearAllNotifications();
      setModalNotificationVisible(false);
    } catch (error) {
      logger.error('SettingsScreen', 'Error clearing notifications', error);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMessage('');
    const result = await updateUserProfile({
      nomUtilisateur: profileForm.username,
      username: profileForm.username,
      email: profileForm.email,
      phone: profileForm.phone,
    });
    if (result?.success) {
      setProfileMessage('Profile updated successfully.');
      setModalProfileVisible(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } else {
      const msg = result?.error || 'Failed to update profile.';
      setProfileMessage(msg);
      Alert.alert('Update failed', msg);
    }
    setSavingProfile(false);
  };

  const handleLogout = async () => {
    Alert.alert('Sign out', 'Do you want to sign out of the app?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          setModalProfileVisible(false);
        },
      },
    ]);
  };

  // Force re-render when RTL changes for instant updates
  useEffect(() => {
    forceUpdate();
  }, [isRTL, forceUpdate]);

  const styles = getStyles(isDarkMode, isRTL);

  return (
    <ScrollView style={styles.container} scrollEnabled={true}>
      {/* Title Header */}
      <View style={styles.titleContainer}>
        <Feather name="settings" size={20} color="#fff" />
        <Text style={styles.titleText}>{t('settings.title')}</Text>
      </View>

      {/* Profile */}
      <Card
        isDarkMode={isDarkMode}
        elevation={2}
        margin={LAYOUT.screenHorizontalPadding}
        marginBottom={SPACING.md}
      >
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setModalProfileVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Profile"
          accessibilityRole="button"
        >
          <View style={styles.optionLeft}>
            <Feather name="user" size={24} color={getColors(isDarkMode).primary} />
            <View>
              <Text style={styles.optionText}>Profile</Text>
              <Text style={styles.optionValueSmall}>
                {user?.nomUtilisateur || user?.username || user?.email || 'User'}
              </Text>
              <Text style={styles.optionValueSmall}>{user?.email || 'No email set'}</Text>
              <Text style={styles.optionValueSmall}>{user?.phone || 'No phone set'}</Text>
            </View>
          </View>
          <MaterialIcons
            name="keyboard-arrow-right"
            size={24}
            color={getColors(isDarkMode).textSecondary}
          />
        </TouchableOpacity>
      </Card>

      {/* Language Setting */}
      <Card
        isDarkMode={isDarkMode}
        elevation={2}
        margin={LAYOUT.screenHorizontalPadding}
        marginBottom={SPACING.md}
      >
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setModalLangVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel={t('settings.language')}
          accessibilityRole="button"
          accessibilityHint={`${t('settings.currentLanguage', 'Current language')}: ${language}`}
        >
          <View style={styles.optionLeft}>
            <Feather name="globe" size={24} color={getColors(isDarkMode).primary} />
            <Text style={styles.optionText}>{t('settings.language')}</Text>
          </View>
          <View style={styles.optionRight}>
            <Text style={styles.optionValue}>{language}</Text>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={24}
              color={getColors(isDarkMode).textSecondary}
            />
          </View>
        </TouchableOpacity>
      </Card>

      {/* Dark Mode Toggle */}
      <Card
        isDarkMode={isDarkMode}
        elevation={2}
        margin={LAYOUT.screenHorizontalPadding}
        marginBottom={SPACING.md}
      >
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Feather name="moon" size={24} color={getColors(isDarkMode).primary} />
            <Text style={styles.optionText}>{t('settings.darkMode')}</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            thumbColor={isDarkMode ? '#22AA66' : '#FFFFFF'}
            trackColor={{ false: '#E0E0E0', true: '#0066CC' }}
            style={{ marginRight: isRTL ? SPACING.md : 0, marginLeft: isRTL ? 0 : SPACING.md }}
            accessible={true}
            accessibilityLabel={t('settings.darkMode')}
            accessibilityRole="switch"
            accessibilityState={{ checked: isDarkMode }}
            accessibilityHint={
              isDarkMode
                ? t('settings.darkModeOn', 'Dark mode is on')
                : t('settings.darkModeOff', 'Dark mode is off')
            }
          />
        </View>
      </Card>

      {/* Contact Support */}
      <Card
        isDarkMode={isDarkMode}
        elevation={2}
        margin={LAYOUT.screenHorizontalPadding}
        marginBottom={SPACING.lg}
      >
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setModalSupportVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel={t('settings.contactSupport')}
          accessibilityRole="button"
          accessibilityHint={t('settings.contactSupportHint', 'Open contact support options')}
        >
          <View style={styles.optionLeft}>
            <Feather name="mail" size={24} color={getColors(isDarkMode).primary} />
            <Text style={styles.optionText}>{t('settings.contactSupport')}</Text>
          </View>
          <MaterialIcons
            name="keyboard-arrow-right"
            size={24}
            color={getColors(isDarkMode).textSecondary}
          />
        </TouchableOpacity>
      </Card>

      {/* Language Selection Modal */}
      <Modal
        visible={modalProfileVisible}
        onClose={() => setModalProfileVisible(false)}
        title="Profile"
        isDarkMode={isDarkMode}
      >
        <View style={styles.languageModalContent}>
          <Input
            placeholder="Username"
            value={profileForm.username}
            onChangeText={(text) => setProfileForm((prev) => ({ ...prev, username: text }))}
            isDarkMode={isDarkMode}
            isRTL={isRTL}
          />
          <Input
            placeholder="Email"
            value={profileForm.email}
            onChangeText={(text) => setProfileForm((prev) => ({ ...prev, email: text }))}
            isDarkMode={isDarkMode}
            isRTL={isRTL}
          />
          <Input
            placeholder="Phone"
            value={profileForm.phone}
            onChangeText={(text) => setProfileForm((prev) => ({ ...prev, phone: text }))}
            isDarkMode={isDarkMode}
            isRTL={isRTL}
          />
          <Button
            title={savingProfile ? 'Saving...' : 'Save Profile'}
            onPress={saveProfile}
            variant="contained"
            size="medium"
            isDarkMode={isDarkMode}
            fullWidth={true}
            disabled={savingProfile}
          />
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outlined"
            size="medium"
            isDarkMode={isDarkMode}
            fullWidth={true}
          />
          {profileMessage ? <Text style={styles.infoText}>{profileMessage}</Text> : null}
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={modalLangVisible}
        onClose={() => setModalLangVisible(false)}
        title={t('settings.chooseLanguage')}
        isDarkMode={isDarkMode}
      >
        <View style={styles.languageModalContent}>
          <Button
            title=" Français"
            onPress={() => changeLanguage('Français')}
            variant="outlined"
            size="medium"
            isDarkMode={isDarkMode}
            fullWidth={true}
            accessibilityLabel="Français"
            accessibilityRole="radio"
            accessibilityState={{ selected: language === 'Français' }}
          />
          <Button
            title=" English"
            onPress={() => changeLanguage('English')}
            variant="outlined"
            size="medium"
            isDarkMode={isDarkMode}
            fullWidth={true}
            accessibilityLabel="English"
            accessibilityRole="radio"
            accessibilityState={{ selected: language === 'English' }}
          />
          <Button
            title=" العربية"
            onPress={() => changeLanguage('العربية')}
            variant="outlined"
            size="medium"
            isDarkMode={isDarkMode}
            fullWidth={true}
            accessibilityLabel="العربية"
            accessibilityRole="radio"
            accessibilityState={{ selected: language === 'العربية' }}
          />
        </View>
      </Modal>

      {/* Support Modal */}
      <Modal
        visible={modalSupportVisible}
        onClose={() => setModalSupportVisible(false)}
        title={t('settings.contactSupport')}
        isDarkMode={isDarkMode}
      >
        <View style={styles.supportModalContent}>
          <Card isDarkMode={isDarkMode} elevation={1} marginBottom={SPACING.md}>
            <TouchableOpacity
              style={styles.supportOption}
              onPress={sendEmail}
              accessibilityLabel={t('settings.email')}
              accessibilityRole="button"
              accessibilityHint="Send email to support@example.com"
            >
              <Feather name="mail" size={20} color={getColors(isDarkMode).secondary} />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.supportLabel}>{t('settings.email')}</Text>
                <Text style={styles.supportValue}>support@example.com</Text>
              </View>
            </TouchableOpacity>
          </Card>

          <Card isDarkMode={isDarkMode} elevation={1} marginBottom={SPACING.md}>
            <TouchableOpacity
              style={styles.supportOption}
              onPress={callPhone}
              accessibilityLabel={t('settings.phone')}
              accessibilityRole="button"
              accessibilityHint="Call support at +1 234 567 890"
            >
              <Feather name="phone" size={20} color={getColors(isDarkMode).secondary} />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.supportLabel}>{t('settings.phone')}</Text>
                <Text style={styles.supportValue}>+1 234 567 890</Text>
              </View>
            </TouchableOpacity>
          </Card>

          <View
            style={{
              marginTop: SPACING.md,
              padding: SPACING.md,
              backgroundColor: getColors(isDarkMode).surface,
              borderRadius: BORDER_RADIUS.md,
            }}
          >
            <Text style={styles.infoTitle}>{t('settings.aboutDeveloper')}</Text>
            <Text style={styles.infoText}>{t('settings.developerInfo')}</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (isDarkMode, isRTL = false) => {
  const colors = getColors(isDarkMode);
  const shadow = getContextualShadow(2, isDarkMode);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background || '#FFFFFF',
    },
    titleContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.lg,
      backgroundColor: '#0066CC',
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      marginBottom: SPACING.lg,
      ...shadow,
    },
    titleText: {
      ...TEXT_STYLES.headerMedium,
      color: '#FFFFFF',
      marginLeft: isRTL ? 0 : SPACING.md,
      marginRight: isRTL ? SPACING.md : 0,
    },
    optionRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    optionLeft: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      flex: 1,
      gap: SPACING.md,
    },
    optionRight: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    optionText: {
      ...TEXT_STYLES.bodyLarge,
      color: colors.text,
    },
    optionValue: {
      ...TEXT_STYLES.bodyMedium,
      color: colors.textSecondary,
    },
    optionValueSmall: {
      ...TEXT_STYLES.bodySmall,
      color: colors.textSecondary,
      marginTop: 2,
    },

    /* Modal Content Styles */
    languageModalContent: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.md,
      paddingHorizontal: SPACING.sm,
    },
    supportModalContent: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      gap: SPACING.sm,
    },
    supportOption: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      padding: SPACING.md,
    },
    supportLabel: {
      ...TEXT_STYLES.caption,
      color: colors.textSecondary,
    },
    supportValue: {
      ...TEXT_STYLES.bodyMedium,
      color: colors.text,
      marginTop: 2,
    },
    infoTitle: {
      ...TEXT_STYLES.subtitle,
      color: colors.text,
      marginBottom: SPACING.sm,
      fontWeight: '600',
    },
    infoText: {
      ...TEXT_STYLES.bodySmall,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
};

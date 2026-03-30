import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Modal, Pressable, Linking } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useNotifications } from './NotificationContext';
import RTLUtils from '../utils/RTLUtils';
import { useForceUpdate } from '../hooks/useForceUpdate';
import logger from '../utils/logger';

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
    clearAllNotifications
  } = useNotifications();
  const [modalLangVisible, setModalLangVisible] = useState(false);
  const [modalSupportVisible, setModalSupportVisible] = useState(false);
  const [modalNotificationVisible, setModalNotificationVisible] = useState(false);
  const forceUpdate = useForceUpdate() || (() => {});

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

  const handleNotificationToggle = async(enabled) => {
    try {
      await toggleNotifications(enabled);
      if (enabled) {
        // Send a welcome notification
        await sendPharmacyReminder(
          'Pharmacie Centrale',
          '123 Rue Habib Bourguiba, Tunis'
        );
      }
    } catch (error) {
      logger.error('SettingsScreen', 'Error handling notification toggle', error);
    }
  };

  const testNotification = async() => {
    try {
      await sendPharmacyReminder(
        'Test Pharmacie',
        'Test Address - Notification de test'
      );
      setModalNotificationVisible(false);
    } catch (error) {
      logger.error('SettingsScreen', 'Error sending test notification', error);
    }
  };

  const setupDailyReminder = async() => {
    try {
      await sendDailyReminder();
      setModalNotificationVisible(false);
    } catch (error) {
      logger.error('SettingsScreen', 'Error setting up daily reminder', error);
    }
  };

  const handleClearNotifications = async() => {
    try {
      await clearAllNotifications();
      setModalNotificationVisible(false);
    } catch (error) {
      logger.error('SettingsScreen', 'Error clearing notifications', error);
    }
  };

  // Force re-render when RTL changes for instant updates
  useEffect(() => {
    forceUpdate();
  }, [isRTL, forceUpdate]);

  const styles = getStyles(isDarkMode, isRTL);

  return (
    <View style={styles.container}>
      {/* Title Container */}
      <View style={styles.titleContainer}>
        <Feather name="settings" size={20} color="#fff" />
        <Text style={styles.titleText}>{t('settings.title')}</Text>
      </View>

      <TouchableOpacity style={styles.option} onPress={() => setModalLangVisible(true)}>
        <Feather name="globe" size={20} color={styles.icon.color} />
        <Text style={styles.optionText}>{t('settings.language')}: {language}</Text>
        <MaterialIcons name="keyboard-arrow-right" size={20} color={styles.icon.color} />
      </TouchableOpacity>

      <View style={styles.option}>
        <Feather name="moon" size={20} color={styles.icon.color} />
        <Text style={styles.optionText}>{t('settings.darkMode')}</Text>
        <Switch
          value={isDarkMode}
          onValueChange={setIsDarkMode}
          thumbColor={isDarkMode ? '#4CAF50' : '#ccc'}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
        />
      </View>

      {/* TODO: NOTIFICATION SYSTEM - Develop this section later */}
      {/* <View style={styles.option}>
        <Feather name="bell" size={20} color={styles.icon.color} />
        <Text style={styles.optionText}>{t('settings.notifications')}</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleNotificationToggle}
          thumbColor={notificationsEnabled ? '#4CAF50' : '#ccc'}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          disabled={notificationLoading}
        />
      </View>

      {notificationsEnabled && (
        <TouchableOpacity
          style={styles.option}
          onPress={() => setModalNotificationVisible(true)}
        >
          <Feather name="settings" size={20} color={styles.icon.color} />
          <Text style={styles.optionText}>{t('settings.notificationSettings')}</Text>
          <MaterialIcons name="keyboard-arrow-right" size={20} color={styles.icon.color} />
        </TouchableOpacity>
      )}

      {permissionStatus && permissionStatus !== 'granted' && (
        <View style={styles.warningContainer}>
          <Feather name="alert-triangle" size={16} color="#ff9800" />
          <Text style={styles.warningText}>
            {t('settings.notificationPermissionWarning')}
          </Text>
        </View>
      )} */}

      <TouchableOpacity style={styles.option} onPress={() => setModalSupportVisible(true)}>
        <Feather name="mail" size={20} color={styles.icon.color} />
        <Text style={styles.optionText}>{t('settings.contactSupport')}</Text>
        <MaterialIcons name="keyboard-arrow-right" size={20} color={styles.icon.color} />
      </TouchableOpacity>

      {/* TODO: NOTIFICATION SYSTEM - Develop this modal later */}
      {/* Notification Settings Modal */}
      {/* <Modal transparent={true} visible={modalNotificationVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('settings.notificationSettings')}</Text>

            <TouchableOpacity style={styles.modalButton} onPress={testNotification}>
              <Feather name="bell" size={20} color="#4CAF50" />
              <Text style={styles.modalButtonText}>{t('settings.testNotification')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={setupDailyReminder}>
              <Feather name="clock" size={20} color="#4CAF50" />
              <Text style={styles.modalButtonText}>{t('settings.setupDailyReminder')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={handleClearNotifications}>
              <Feather name="trash-2" size={20} color="#ff6b6b" />
              <Text style={styles.modalButtonText}>{t('settings.clearAllNotifications')}</Text>
            </TouchableOpacity>

            <View style={{marginTop: 20}}>
              <Text style={styles.infoTitle}>{t('settings.notificationInfo')}</Text>
              <Text style={styles.infoText}>
                {t('settings.notificationDescription')}
              </Text>
            </View>

            <Pressable style={styles.closeButton} onPress={() => setModalNotificationVisible(false)}>
              <Text style={styles.closeText}>{t('settings.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal> */}

      {/* Language Selection Modal */}
      <Modal transparent={true} visible={modalLangVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('settings.chooseLanguage')}</Text>

            <Pressable style={styles.modalButton} onPress={() => changeLanguage('Français')}>
              <Text style={styles.modalText}>🇫🇷 Français</Text>
            </Pressable>

            <Pressable style={styles.modalButton} onPress={() => changeLanguage('English')}>
              <Text style={styles.modalText}>🇬🇧 English</Text>
            </Pressable>

            <Pressable style={styles.modalButton} onPress={() => changeLanguage('العربية')}>
              <Text style={styles.modalText}>🇹🇳 العربية</Text>
            </Pressable>

            <Pressable style={styles.closeButton} onPress={() => setModalLangVisible(false)}>
              <Text style={styles.closeText}>{t('settings.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Support Modal */}
      <Modal transparent={true} visible={modalSupportVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('settings.contactSupport')}</Text>

            <TouchableOpacity style={styles.contactOption} onPress={sendEmail}>
              <Feather name="mail" size={20} color="#4CAF50" />
              <Text style={styles.contactText}>support@example.com</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactOption} onPress={callPhone}>
              <Feather name="phone" size={20} color="#4CAF50" />
              <Text style={styles.contactText}>+1 234 567 890</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 20 }}>
              <Text style={styles.infoTitle}>{t('settings.aboutDeveloper')}</Text>
              <Text style={styles.infoText}>
                {t('settings.developerInfo')}
              </Text>
            </View>

            <Pressable style={styles.closeButton} onPress={() => setModalSupportVisible(false)}>
              <Text style={styles.closeText}>{t('settings.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (darkMode, isRTL = false) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: darkMode ? '#121212' : '#f4f4f4',
    flex: 1,
  },
  titleContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#007ACC',
    borderRadius: 8,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: isRTL ? 0 : 10,
    marginRight: isRTL ? 10 : 0,
  },
  icon: {
    color: darkMode ? '#fff' : '#4CAF50',
  },
  option: {
    backgroundColor: darkMode ? '#1E1E1E' : '#fff',
    padding: 16,
    borderRadius: 10,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  optionText: {
    flex: 1,
    ...(isRTL ? { marginRight: 12 } : { marginLeft: 12 }),
    fontSize: 16,
    color: darkMode ? '#fff' : '#333',
    textAlign: isRTL ? 'right' : 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: darkMode ? '#1E1E1E' : '#fff',
    padding: 24,
    borderRadius: 12,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: darkMode ? '#fff' : '#000',
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    width: '100%',
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: {
    fontSize: 16,
    color: darkMode ? '#fff' : '#000',
  },
  closeButton: {
    marginTop: 12,
  },
  closeText: {
    color: '#2196F3',
    fontSize: 16,
  },
  contactOption: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  contactText: {
    ...(isRTL ? { marginRight: 12 } : { marginLeft: 12 }),
    fontSize: 16,
    color: '#007AFF',
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
    color: darkMode ? '#fff' : '#000',
  },
  infoText: {
    fontSize: 14,
    color: darkMode ? '#ccc' : '#555',
    textAlign: 'center',
  },
  // TODO: NOTIFICATION SYSTEM - Develop these styles later
  // warningContainer: {
  //   backgroundColor: darkMode ? '#2E2E2E' : '#fff3cd',
  //   borderColor: '#ffeaa7',
  //   borderWidth: 1,
  //   borderRadius: 8,
  //   padding: 12,
  //   marginBottom: 12,
  //   flexDirection: isRTL ? 'row-reverse' : 'row',
  //   alignItems: 'center',
  // },
  // warningText: {
  //   ...(isRTL ? { marginRight: 8 } : { marginLeft: 8 }),
  //   fontSize: 14,
  //   color: darkMode ? '#ffb74d' : '#856404',
  //   flex: 1,
  //   textAlign: isRTL ? 'right' : 'left',
  // },
  // modalButtonText: {
  //   ...(isRTL ? { marginRight: 8 } : { marginLeft: 8 }),
  //   fontSize: 16,
  //   color: darkMode ? '#fff' : '#000',
  // },
});

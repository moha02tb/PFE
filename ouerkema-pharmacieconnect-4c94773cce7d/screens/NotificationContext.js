import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// Note: With Expo SDK 53+, push notifications are not available in Expo Go
// Only local notifications work. For push notifications, use a development build.
// See: https://docs.expo.dev/develop/development-builds/introduction/

const NotificationContext = createContext();

const NOTIFICATION_STORAGE_KEY = '@PharmaciesDeGarde_Notifications';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async() => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationProvider = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async() => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (saved !== null) {
        const enabled = JSON.parse(saved);
        setNotificationsEnabled(enabled);
        if (enabled) {
          await registerForPushNotificationsAsync();
        }
      }

      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      logger.error('NotificationContext', 'Error loading notification settings', error);
      // Set default values on error
      setNotificationsEnabled(false);
      setPermissionStatus('undetermined');
    } finally {
      setIsLoading(false);
    }
  };

  const registerForPushNotificationsAsync = async() => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('NotificationContext', 'Failed to get notification permissions', { status: finalStatus });
        setPermissionStatus(finalStatus);
        return;
      }

      // Note: Push tokens are not available in Expo Go with SDK 53+
      // Local notifications will still work without push tokens
      logger.info('NotificationContext', 'Local notifications are ready to use');
      setPermissionStatus('granted');
      return null;
    } else {
      logger.warn('NotificationContext', 'Must use physical device for notifications');
      setPermissionStatus('unavailable');
      return null;
    }
  };

  const toggleNotifications = async(enabled) => {
    try {
      setNotificationsEnabled(enabled);
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(enabled));

      if (enabled) {
        await registerForPushNotificationsAsync();
      } else {
        // Clear the token when disabling notifications
        setExpoPushToken(null);
        // Cancel all scheduled notifications
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      logger.error('NotificationContext', 'Error toggling notifications', error);
    }
  };

  const scheduleNotification = async(title, body, trigger = null) => {
    if (!notificationsEnabled) {
      logger.debug('NotificationContext', 'Notifications are disabled');
      return;
    }

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
        },
        trigger: trigger || null, // null means immediate
      });

      logger.debug('NotificationContext', 'Notification scheduled with ID', { id });
      return id;
    } catch (error) {
      logger.error('NotificationContext', 'Error scheduling notification', error);
    }
  };

  const sendPharmacyReminder = async(pharmacyName, address) => {
    if (!notificationsEnabled) return;

    return await scheduleNotification(
      'Pharmacie de Garde',
      `${pharmacyName} est de garde maintenant. Adresse: ${address}`,
      {
        seconds: 2, // Send after 2 seconds for testing
      }
    );
  };

  const sendDailyReminder = async() => {
    if (!notificationsEnabled) return;

    return await scheduleNotification(
      'Rappel Pharmacies de Garde',
      'Consultez les pharmacies de garde pour aujourd\'hui',
      {
        hour: 9,
        minute: 0,
        repeats: true,
      }
    );
  };

  const cancelNotification = async(notificationId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.debug('NotificationContext', 'Notification cancelled', { notificationId });
    } catch (error) {
      logger.error('NotificationContext', 'Error cancelling notification', error);
    }
  };

  const getAllScheduledNotifications = async() => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      logger.error('NotificationContext', 'Error getting scheduled notifications', error);
      return [];
    }
  };

  const clearAllNotifications = async() => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.debug('NotificationContext', 'All notifications cleared');
    } catch (error) {
      logger.error('NotificationContext', 'Error clearing notifications', error);
    }
  };

  const value = {
    notificationsEnabled,
    toggleNotifications,
    isLoading,
    expoPushToken,
    permissionStatus,
    scheduleNotification,
    sendPharmacyReminder,
    sendDailyReminder,
    cancelNotification,
    getAllScheduledNotifications,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook to access notification context
 * @returns {object} Notification context object with notification management functions
 * @requires Must be wrapped with NotificationProvider component
 * @fails_safely Returns default context with noop functions if not wrapped with provider (development warning)
 *
 * Usage:
 * ```
 * const { notificationsEnabled, sendPharmacyReminder } = useNotifications();
 * ```
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);

  // Fail-safe: return sensible defaults if context not available
  if (!context) {
    logger.warn(
      'NotificationContext',
      'useNotifications called outside of NotificationProvider. Returning default values with disabled notifications.'
    );

    return {
      notificationsEnabled: false,
      toggleNotifications: async() => {
        logger.warn('NotificationContext', 'toggleNotifications called but provider not available');
      },
      isLoading: false,
      expoPushToken: null,
      permissionStatus: 'undetermined',
      scheduleNotification: async() => {
        logger.warn('NotificationContext', 'scheduleNotification called but provider not available');
      },
      sendPharmacyReminder: async() => {
        logger.warn('NotificationContext', 'sendPharmacyReminder called but provider not available');
      },
      sendDailyReminder: async() => {
        logger.warn('NotificationContext', 'sendDailyReminder called but provider not available');
      },
      cancelNotification: async() => {
        logger.warn('NotificationContext', 'cancelNotification called but provider not available');
      },
      getAllScheduledNotifications: async() => [],
      clearAllNotifications: async() => {
        logger.warn('NotificationContext', 'clearAllNotifications called but provider not available');
      },
    };
  }

  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Note: With Expo SDK 53+, push notifications are not available in Expo Go
// Only local notifications work. For push notifications, use a development build.
// See: https://docs.expo.dev/develop/development-builds/introduction/

const NotificationContext = createContext();

const NOTIFICATION_STORAGE_KEY = '@PharmaciesDeGarde_Notifications';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
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

  const loadNotificationSettings = async () => {
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
      console.log('Error loading notification settings:', error);
      // Set default values on error
      setNotificationsEnabled(false);
      setPermissionStatus('undetermined');
    } finally {
      setIsLoading(false);
    }
  };

  const registerForPushNotificationsAsync = async () => {
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
        console.log('Failed to get notification permissions!');
        setPermissionStatus(finalStatus);
        return;
      }
      
      // Note: Push tokens are not available in Expo Go with SDK 53+
      // Local notifications will still work without push tokens
      console.log('Local notifications are ready to use');
      setPermissionStatus('granted');
      return null;
    } else {
      console.log('Must use physical device for notifications');
      setPermissionStatus('unavailable');
      return null;
    }
  };

  const toggleNotifications = async (enabled) => {
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
      console.log('Error toggling notifications:', error);
    }
  };

  const scheduleNotification = async (title, body, trigger = null) => {
    if (!notificationsEnabled) {
      console.log('Notifications are disabled');
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
      
      console.log('Notification scheduled with ID:', id);
      return id;
    } catch (error) {
      console.log('Error scheduling notification:', error);
    }
  };

  const sendPharmacyReminder = async (pharmacyName, address) => {
    if (!notificationsEnabled) return;

    return await scheduleNotification(
      'Pharmacie de Garde',
      `${pharmacyName} est de garde maintenant. Adresse: ${address}`,
      {
        seconds: 2, // Send after 2 seconds for testing
      }
    );
  };

  const sendDailyReminder = async () => {
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

  const cancelNotification = async (notificationId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.log('Error cancelling notification:', error);
    }
  };

  const getAllScheduledNotifications = async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.log('Error getting scheduled notifications:', error);
      return [];
    }
  };

  const clearAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cleared');
    } catch (error) {
      console.log('Error clearing notifications:', error);
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

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
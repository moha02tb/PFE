import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons, Entypo, Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import RTLUtils from '../utils/RTLUtils';
import { useForceUpdate } from '../hooks/useForceUpdate';
import { loadPharmacies } from '../utils/pharmacyDataLoader';
import logger from '../utils/logger';

export default function CalendarScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { getCurrentLanguageKey, isRTL } = useLanguage();
  const forceUpdate = useForceUpdate();

  const endOfYear = new Date(new Date().getFullYear(), 11, 31);

  useEffect(() => {
    fetchPharmacies(selectedDate);
  }, [selectedDate, t, getCurrentLanguageKey]);

  // Force re-render when RTL changes for instant updates
  useEffect(() => {
    forceUpdate();
  }, [isRTL, forceUpdate]);

  const fetchPharmacies = (date) => {
    try {
      const pharmaciesData = loadPharmacies(t, date);
      setPharmacies(pharmaciesData);
    } catch (error) {
      logger.error('CalendarScreen', 'Error loading pharmacies data', error);
      // Fallback to empty array if data loading fails
      setPharmacies([]);
    }
  };

  const callPhone = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch((err) =>
      logger.error('CalendarScreen', 'Erreur lors de l\'appel', err)
    );
  };

  const openMap = (address) => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`
    });

    Linking.openURL(url).catch(err =>
      logger.error('CalendarScreen', 'Erreur lors de l\'ouverture de la carte', err)
    );
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Helper function to convert Arabic-Indic digits to Western digits
  const convertToWesternDigits = (str) => {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const westernDigits = '0123456789';

    return str.replace(/[٠-٩]/g, (digit) => {
      return westernDigits[arabicDigits.indexOf(digit)];
    });
  };

  const displayDate = (date) => {
    const currentLang = getCurrentLanguageKey();

    // Map language keys to locale strings
    const localeMap = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'ar': 'ar-SA' // Arabic (Saudi Arabia) - more universal Arabic locale
    };

    const locale = localeMap[currentLang] || 'fr-FR';

    try {
      let formattedDate = date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Convert Arabic-Indic digits to Western digits for Arabic locale
      if (currentLang === 'ar') {
        formattedDate = convertToWesternDigits(formattedDate);
      }

      return formattedDate;
    } catch (error) {
      // Fallback to French if locale is not supported
      logger.warn('CalendarScreen', 'Date locale not supported, falling back to French', error);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const onChange = (event, date) => {
    if (date) setSelectedDate(date);
    if (Platform.OS !== 'ios') setShowPicker(false);
  };

  const styles = getStyles(isDarkMode, isRTL);

  return (
    <View style={styles.container}>
      {/* Title Container */}
      <View style={styles.titleContainer}>
        <Feather name="calendar" size={20} color="#fff" />
        <Text style={styles.titleText}>{t('calendar.title')} - {displayDate(selectedDate)}</Text>
      </View>

      <View style={styles.dateInputContainer}>
        <Feather name="search" size={20} color={styles.icon.color} style={styles.icon} />
        <TextInput
          style={styles.dateInput}
          value={formatDate(selectedDate)}
          editable={false}
          placeholderTextColor={styles.placeholder.color}
        />
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={styles.calendarButton}
        >
          <Feather name="calendar" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChange}
          maximumDate={endOfYear}
        />
      )}

      <FlatList
        data={pharmacies}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.noEventsText}>
            {t('calendar.noEventsToday')}
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                ...(isRTL
                  ? { borderRightColor: item.isOpen ? '#4CAF50' : '#ccc' }
                  : { borderLeftColor: item.isOpen ? '#4CAF50' : '#ccc' }
                ),
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.pharmacyName}>{item.name}</Text>
              <View style={styles.badges}>
                <Text style={[styles.badge, item.isOpen ? styles.open : styles.closed]}>
                  {item.isOpen ? t('home.open') : t('home.closed')}
                </Text>
                {item.emergency && (
                  <Text style={[styles.badge, styles.emergency]}>
                    {t('home.emergency')}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Entypo name="location-pin" size={16} color={styles.infoIcon.color} />
              <Text style={styles.infoText}>{item.address}</Text>
            </View>

            <View style={styles.infoRow}>
              <Feather name="clock" size={16} color={styles.infoIcon.color} />
              <Text style={styles.infoText}>{item.openHours}</Text>
            </View>

            <View style={styles.infoRow}>
              <Feather name="phone" size={16} color={styles.infoIcon.color} />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => callPhone(item.phone)}
              >
                <Feather name="phone" size={16} color="white" />
                <Text style={styles.buttonText}>{t('home.call')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.mapButton]}
                onPress={async() => {
                  try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                      // Silent fallback: open in-app map without coords
                      if (navigation?.jumpTo) {
                        navigation.jumpTo('Carte', { pharmacies });
                      } else {
                        navigation.navigate('Carte', { pharmacies });
                      }
                      return;
                    }

                    const { coords } = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.Highest,
                    });

                    const params = { pharmacies, initialLocation: coords };
                    if (navigation?.jumpTo) {
                      navigation.jumpTo('Carte', params);
                    } else {
                      navigation.navigate('Carte', params);
                    }
                  } catch (e) {
                    // Silent fallback: navigate without coords
                    if (navigation?.jumpTo) {
                      navigation.jumpTo('Carte', { pharmacies });
                    } else {
                      navigation.navigate('Carte', { pharmacies });
                    }
                  }
                }}
              >
                <Entypo name="map" size={16} color="white" />
                <Text style={styles.buttonText}>{t('home.directions')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const getStyles = (isDarkMode, isRTL = false) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: isDarkMode ? '#121212' : '#f4f4f4',
      flex: 1,
    },
    titleContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 20,
      backgroundColor: '#007ACC',
      borderRadius: 8,
      marginHorizontal: 16,
      marginTop: 16,
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
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    noEventsText: {
      textAlign: 'center',
      fontSize: 16,
      color: isDarkMode ? '#ccc' : '#666',
      marginTop: 50,
      fontStyle: 'italic',
    },
    titleIcon: {
      color: isDarkMode ? '#fff' : '#000',
    },
    dateInputContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#ccc',
      borderRadius: 8,
      paddingHorizontal: 10,
    },
    icon: {
      ...(isRTL ? { marginLeft: 8 } : { marginRight: 8 }),
      color: isDarkMode ? '#ccc' : '#555',
    },
    dateInput: {
      flex: 1,
      paddingVertical: 8,
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    placeholder: {
      color: isDarkMode ? '#ccc' : '#888',
    },
    calendarButton: {
      ...(isRTL ? { marginRight: 10 } : { marginLeft: 10 }),
      padding: 6,
    },
    card: {
      backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      ...(isRTL ? { borderRightWidth: 4 } : { borderLeftWidth: 4 }),
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pharmacyName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#000',
      textAlign: isRTL ? 'right' : 'left',
    },
    badges: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 6,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      fontSize: 12,
      marginLeft: 6,
    },
    open: {
      backgroundColor: '#C8E6C9',
      color: '#1B5E20',
    },
    closed: {
      backgroundColor: isDarkMode ? '#424242' : '#E0E0E0',
      color: isDarkMode ? '#BDBDBD' : '#424242',
    },
    emergency: {
      backgroundColor: '#FFCDD2',
      color: '#B71C1C',
    },
    infoRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    infoIcon: {
      color: isDarkMode ? '#ccc' : '#555',
    },
    infoText: {
      ...(isRTL ? { marginRight: 6 } : { marginLeft: 6 }),
      fontSize: 14,
      color: isDarkMode ? '#ccc' : '#555',
      textAlign: isRTL ? 'right' : 'left',
    },
    actions: {
      flexDirection: 'row',
      marginTop: 12,
      justifyContent: 'flex-end',
      gap: 10,
    },
    button: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      backgroundColor: '#4CAF50',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: 'center',
      gap: 6,
    },
    mapButton: {
      backgroundColor: '#2196F3',
    },
    buttonText: {
      color: 'white',
      fontSize: 14,
    },
  });

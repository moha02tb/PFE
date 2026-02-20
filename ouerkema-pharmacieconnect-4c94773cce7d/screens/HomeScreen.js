import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Feather, Entypo } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useNotifications } from './NotificationContext';
import { useLanguage } from './LanguageContext';
import { useForceUpdate } from '../hooks/useForceUpdate';
import { loadPharmacies, filterPharmacies } from '../utils/pharmacyDataLoader';

const HomeScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { sendPharmacyReminder, notificationsEnabled } = useNotifications();
  const { isRTL } = useLanguage();
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    try {
      const pharmaciesData = loadPharmacies(t);
      setPharmacies(pharmaciesData);
    } catch (error) {
      console.error('Error loading pharmacies data:', error);
      // Fallback to empty array if data loading fails
      setPharmacies([]);
    }
  }, [t]);

  const goToUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Show translated error message
        if (typeof alert === 'function') {
          alert(t('home.locationPermissionDenied'));
        }
        // Fallback: still navigate; MapScreen will handle lack of location
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

      // Save locally for other buttons (e.g., directions)
      setUserLocation(coords);

      // Navigate to MapScreen with initial user location
      const params = { pharmacies, initialLocation: coords };
      if (navigation?.jumpTo) {
        navigation.jumpTo('Carte', params);
      } else {
        navigation.navigate('Carte', params);
      }
    } catch (e) {
      // Show generic translated error and navigate without coords
      if (typeof alert === 'function') {
        alert(t('home.locationError'));
      }
      if (navigation?.jumpTo) {
        navigation.jumpTo('Carte', { pharmacies });
      } else {
        navigation.navigate('Carte', { pharmacies });
      }
    }
  };

  const callPhone = (phoneNumber) => {
    const url = `tel:${phoneNumber.replace(/\s+/g, '')}`;
    Linking.openURL(url).catch((err) =>
      console.error('Erreur lors de l’appel', err)
    );
  };

  const filteredPharmacies = filterPharmacies(pharmacies, searchTerm);

  useEffect(() => {
    forceUpdate();
  }, [isRTL, forceUpdate]);

  const styles = getStyles(isDarkMode, isRTL);

  return (
    <View style={styles.container}>
      {/* العنوان الجديد بنفس ستايل الصورة الثانية */}
      <View style={styles.titleContainer}>
        {/* Use outline (empty) style to match other screens */}
        <Feather name="map-pin" size={20} color="#fff" />
        <Text style={styles.titleText}>{t('home.nearbyPharmacies')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={styles.searchIcon.color} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder={t('home.searchPlacePlaceholder', 'Search a place...')}
          placeholderTextColor={styles.placeholder.color}
        />
      </View>

      <TouchableOpacity onPress={goToUserLocation} style={styles.locationButton}>
        <Feather name="navigation" size={16} color="white" />
        <Text style={styles.locationText}>{t('home.myLocation')}</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredPharmacies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[
            styles.card,
            isRTL ? { borderRightColor: item.isOpen ? '#4CAF50' : '#ccc' }
                  : { borderLeftColor: item.isOpen ? '#4CAF50' : '#ccc' }
          ]}>
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
                onPress={() => {
                  callPhone(item.phone);
                  if (notificationsEnabled) {
                    sendPharmacyReminder(item.name, `Appel vers ${item.name} - ${item.address}`);
                  }
                }}
              >
                <Feather name="phone" size={16} color="white" />
                <Text style={styles.buttonText}>{t('home.call')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.mapButton]}
                onPress={async () => {
                  try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                      // No "enable location first" alert; navigate anyway
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

                    setUserLocation(coords);

                    const params = { pharmacies, initialLocation: coords };
                    if (navigation?.jumpTo) {
                      navigation.jumpTo('Carte', params);
                    } else {
                      navigation.navigate('Carte', params);
                    }
                  } catch (e) {
                    // Silent fallback; navigate without coords
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
};

export default HomeScreen;

const getStyles = (isDarkMode, isRTL = false) => StyleSheet.create({
  container: {
    padding: 0,
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
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    // Shadow for Android
    elevation: 8,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: isRTL ? 0 : 10,
    marginRight: isRTL ? 10 : 0,
  },
  searchContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#333' : '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
    margin: 16,
    marginBottom: 12,
  },
  searchIcon: {
    color: isDarkMode ? '#ccc' : '#888',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: isDarkMode ? '#fff' : '#333',
    textAlign: isRTL ? 'right' : 'left',
  },
  placeholder: {
    color: isDarkMode ? '#ccc' : '#888',
  },
  locationButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  locationText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
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
    backgroundColor: '#d0f0d0',
    color: '#2e7d32',
  },
  closed: {
    backgroundColor: isDarkMode ? '#333' : '#eee',
    color: isDarkMode ? '#ccc' : '#555',
  },
  emergency: {
    backgroundColor: '#fdecea',
    color: '#c62828',
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

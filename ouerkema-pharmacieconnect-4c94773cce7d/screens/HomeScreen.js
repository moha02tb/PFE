import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { Feather, Entypo } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useNotifications } from './NotificationContext';
import { useLanguage } from './LanguageContext';
import { useForceUpdate } from '../hooks/useForceUpdate';
import { useDebounce } from '../hooks/useDebounce';
import { useFavorites } from './FavoritesContext';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { loadPharmacies, loadPharmaciesAsync, filterPharmacies } from '../utils/pharmacyDataLoader';
import logger from '../utils/logger';
import { Button, Card, Badge, Input, EmptyState } from '../components/design-system';
import PharmacyDetailsModal from '../components/PharmacyDetailsModal';
import { useRating } from './RatingContext';
import { getColors } from '../utils/colors';
import { SPACING, LAYOUT } from '../utils/spacing';
import { getContextualShadow } from '../utils/shadows';
import { TEXT_STYLES } from '../utils/typography';

const HomeScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { sendPharmacyReminder, notificationsEnabled } = useNotifications();
  const { isRTL } = useLanguage();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { copyToClipboard } = useCopyToClipboard(
    () => {
      // Feedback shown inline
    },
    (error) => {
      logger.error('HomeScreen', 'Copy error', error);
    }
  );
  const { getRating, setRating } = useRating();
  const forceUpdate = useForceUpdate();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      let coords = userLocation;
      if (!coords) {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = current.coords;
          setUserLocation(current.coords);
        }
      }

      // Try to load from API first, fallback to static data
      const pharmaciesData = await loadPharmaciesAsync(t, true, coords);
      setPharmacies(pharmaciesData);
    } catch (error) {
      logger.error('HomeScreen', 'Error refreshing pharmacies data', error);
      // Fallback to static data
      try {
        const staticPharmacies = loadPharmacies(t);
        setPharmacies(staticPharmacies);
      } catch (staticError) {
        logger.error('HomeScreen', 'Error loading static data', staticError);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        let coords = null;
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = current.coords;
          setUserLocation(current.coords);
        }

        // Try to load from API first, fallback to static data
        const pharmaciesData = await loadPharmaciesAsync(t, true, coords);
        setPharmacies(pharmaciesData);
      } catch (error) {
        logger.error('HomeScreen', 'Error loading pharmacies data', error);
        // Fallback to empty array if data loading fails
        try {
          const staticPharmacies = loadPharmacies(t);
          setPharmacies(staticPharmacies);
        } catch (staticError) {
          logger.error('HomeScreen', 'Error loading static data', staticError);
          setPharmacies([]);
        }
      }
    };
    
    loadData();
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

      // Refresh list with nearby pharmacies around current user location
      const nearbyPharmacies = await loadPharmaciesAsync(t, true, coords);
      setPharmacies(nearbyPharmacies);

      // Navigate to MapScreen with initial user location
      const params = {
        pharmacies: nearbyPharmacies && nearbyPharmacies.length > 0 ? nearbyPharmacies : pharmacies,
        initialLocation: coords,
      };
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
    Linking.openURL(url).catch((err) => logger.error('HomeScreen', "Erreur lors de l'appel", err));
  };

  // Debounce search input for performance (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const filteredPharmacies = filterPharmacies(pharmacies, debouncedSearchTerm);

  useEffect(() => {
    forceUpdate();
  }, [isRTL, forceUpdate]);

  const styles = getStyles(isDarkMode, isRTL);

  return (
    <View style={styles.container}>
      {/* Header with title */}
      <View style={styles.titleContainer}>
        <Feather name="map-pin" size={20} color="#fff" />
        <Text style={styles.titleText}>{t('home.nearbyPharmacies')}</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Input
          placeholder={t('home.searchPlacePlaceholder', 'Search a place...')}
          value={searchTerm}
          onChangeText={setSearchTerm}
          isDarkMode={isDarkMode}
          isRTL={isRTL}
          clearable={true}
          onClear={() => setSearchTerm('')}
          icon={<Feather name="search" size={20} color={getColors(isDarkMode).textSecondary} />}
          accessibilityLabel={t('home.searchAccessibility', 'Search for pharmacies')}
          editable={true}
        />
      </View>

      {/* Location Button */}
      <View style={styles.locationButtonWrapper}>
        <Button
          title={t('home.myLocation')}
          onPress={goToUserLocation}
          variant="contained"
          color="primary"
          isDarkMode={isDarkMode}
          fullWidth={true}
          icon={<Feather name="navigation" size={16} color="white" />}
        />
      </View>

      {/* Pharmacy List */}
      <FlatList
        data={filteredPharmacies}
        keyExtractor={(item) => item.id.toString()}
        keyboardShouldPersistTaps="always"
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#fff' : '#0066CC'}
            colors={['#0066CC']}
          />
        }
        renderItem={({ item }) => (
          <Card
            isDarkMode={isDarkMode}
            elevation={2}
            marginBottom={LAYOUT.cardMarginBottom}
            margin={LAYOUT.screenHorizontalPadding}
            borderAccent={true}
            style={[
              isRTL && { borderLeftWidth: 4, borderLeftColor: '#0066CC', borderRightWidth: 0 },
              !isRTL && { borderLeftWidth: 4, borderLeftColor: '#0066CC' },
            ]}
          >
            {/* Card Header with Pharmacy Name and Badges */}
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pharmacyName}>{item.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleFavorite(item.id)}
                accessibilityLabel={
                  isFavorite(item.id) ? t('home.removeFavorite') : t('home.addFavorite')
                }
                accessibilityRole="button"
                style={styles.favoriteButton}
              >
                <Feather
                  name={isFavorite(item.id) ? 'heart' : 'heart'}
                  size={24}
                  color={isFavorite(item.id) ? '#e74c3c' : '#cccccc'}
                  fill={isFavorite(item.id) ? '#e74c3c' : 'none'}
                />
              </TouchableOpacity>
            </View>

            {/* Badges Row */}
            <View style={styles.badgesContainer}>
              <Badge
                status={item.isOpen ? 'open' : 'closed'}
                isDarkMode={isDarkMode}
                size="medium"
              />
              {item.emergency && (
                <Badge
                  status="onDuty"
                  isDarkMode={isDarkMode}
                  size="medium"
                  style={{ marginLeft: SPACING.sm }}
                >
                  {t('home.onDuty')}
                </Badge>
              )}
            </View>

            {/* Pharmacy Info Rows */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Entypo name="location-pin" size={16} color={getColors(isDarkMode).textSecondary} />
                <Text style={[styles.infoText, { flex: 1 }]}>{item.address}</Text>
                <TouchableOpacity
                  onPress={() => {
                    copyToClipboard(item.address);
                    setCopiedId(`addr-${item.id}`);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  accessibilityLabel={t('home.copyAddress')}
                  accessibilityRole="button"
                  style={{ padding: SPACING.xs }}
                >
                  <Feather
                    name={copiedId === `addr-${item.id}` ? 'check' : 'copy'}
                    size={16}
                    color={
                      copiedId === `addr-${item.id}` ? '#10B981' : getColors(isDarkMode).primary
                    }
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <Feather name="clock" size={16} color={getColors(isDarkMode).textSecondary} />
                <Text style={styles.infoText}>{item.openHours}</Text>
              </View>

              <View style={styles.infoRow}>
                <Feather name="phone" size={16} color={getColors(isDarkMode).textSecondary} />
                <Text style={[styles.infoText, { flex: 1 }]}>{item.phone}</Text>
                <TouchableOpacity
                  onPress={() => {
                    copyToClipboard(item.phone);
                    setCopiedId(`phone-${item.id}`);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  accessibilityLabel={t('home.copyPhone')}
                  accessibilityRole="button"
                  style={{ padding: SPACING.xs }}
                >
                  <Feather
                    name={copiedId === `phone-${item.id}` ? 'check' : 'copy'}
                    size={16}
                    color={
                      copiedId === `phone-${item.id}` ? '#10B981' : getColors(isDarkMode).primary
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Button
                title={t('home.call')}
                onPress={() => {
                  callPhone(item.phone);
                  if (notificationsEnabled) {
                    sendPharmacyReminder(item.name, `Appel vers ${item.name} - ${item.address}`);
                  }
                }}
                variant="contained"
                color="secondary"
                isDarkMode={isDarkMode}
                size="small"
                icon={<Feather name="phone" size={14} color="white" />}
                accessibilityLabel={`${t('home.call')} ${item.name}, ${item.phone}`}
                accessibilityRole="button"
              />

              <Button
                title={t('home.directions')}
                onPress={async () => {
                  try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                      if (navigation?.jumpTo) {
                        navigation.jumpTo('Carte', { pharmacies, targetPharmacy: item });
                      } else {
                        navigation.navigate('Carte', { pharmacies, targetPharmacy: item });
                      }
                      return;
                    }

                    const { coords } = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.Highest,
                    });

                    setUserLocation(coords);

                    const params = { pharmacies, initialLocation: coords, targetPharmacy: item };
                    if (navigation?.jumpTo) {
                      navigation.jumpTo('Carte', params);
                    } else {
                      navigation.navigate('Carte', params);
                    }
                  } catch (e) {
                    if (navigation?.jumpTo) {
                      navigation.jumpTo('Carte', { pharmacies, targetPharmacy: item });
                    } else {
                      navigation.navigate('Carte', { pharmacies, targetPharmacy: item });
                    }
                  }
                }}
                variant="contained"
                color="primary"
                isDarkMode={isDarkMode}
                size="small"
                icon={<Entypo name="map" size={14} color="white" />}
                accessibilityLabel={`${t('home.directions')} ${t('home.to')} ${item.name}, ${item.address}`}
                accessibilityRole="button"
              />

              <Button
                title={t('home.details', 'Details')}
                onPress={() => {
                  setSelectedPharmacy(item);
                  setDetailsModalVisible(true);
                }}
                variant="outlined"
                isDarkMode={isDarkMode}
                size="small"
                icon={<Feather name="info" size={14} color={getColors(isDarkMode).primary} />}
                accessibilityLabel={`${t('home.details', 'View details for')} ${item.name}`}
                accessibilityRole="button"
              />
            </View>
          </Card>
        )}
        scrollEnabled={true}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title={t('home.noPharmacies')}
            message={t('home.noPharmaciesMessage')}
            isDarkMode={isDarkMode}
          />
        }
        contentContainerStyle={{ paddingBottom: SPACING.lg }}
      />

      {/* Pharmacy Details Modal with Rating */}
      <PharmacyDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        pharmacy={selectedPharmacy}
        isDarkMode={isDarkMode}
        isRTL={isRTL}
      />
    </View>
  );
};

export default HomeScreen;

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
      borderRadius: 0,
      marginHorizontal: 0,
      marginTop: 0,
      marginBottom: SPACING.lg,
      ...shadow,
    },
    titleText: {
      ...TEXT_STYLES.headerMedium,
      color: '#FFFFFF',
      marginLeft: isRTL ? 0 : SPACING.md,
      marginRight: isRTL ? SPACING.md : 0,
    },
    searchWrapper: {
      paddingHorizontal: LAYOUT.screenHorizontalPadding,
      paddingBottom: SPACING.md,
      zIndex: 20,
      pointerEvents: 'auto',
    },
    locationButtonWrapper: {
      paddingHorizontal: LAYOUT.screenHorizontalPadding,
      paddingBottom: SPACING.lg,
    },
    cardHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    pharmacyName: {
      ...TEXT_STYLES.headerSmall,
      color: colors.text,
      flex: 1,
    },
    badgesContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: SPACING.sm,
    },
    infoSection: {
      marginVertical: SPACING.md,
    },
    infoRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginVertical: SPACING.sm,
    },
    infoText: {
      ...TEXT_STYLES.bodySmall,
      color: colors.textSecondary,
      marginLeft: isRTL ? 0 : SPACING.sm,
      marginRight: isRTL ? SPACING.sm : 0,
      flex: 1,
    },
    actionsContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: SPACING.sm,
      marginTop: SPACING.md,
      justifyContent: 'flex-end',
    },
  });
};

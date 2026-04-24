import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { useNotifications } from './NotificationContext';
import { useLanguage } from './LanguageContext';
import { useFavorites } from './FavoritesContext';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useDebounce } from '../hooks/useDebounce';
import { useLocationHistory } from '../hooks/useLocationHistory';
import {
  loadPharmacies,
  loadPharmaciesAsync,
  filterPharmacies,
  searchPharmaciesAsync,
} from '../utils/pharmacyDataLoader';
import logger from '../utils/logger';
import {
  AppButton,
  AppCard,
  AppText,
  EmptyState,
  LoadingSkeleton,
  PharmacyListItem,
  SearchBar,
  SectionTitle,
} from '../components/design-system';
import PharmacyDetailsModal from '../components/PharmacyDetailsModal';
import LocationPicker from '../components/LocationPicker';
import { useRating } from './RatingContext';
import { useAppTheme } from '../utils/theme';
import {
  ALL_LOCATION_OPTIONS,
  createLocationSearchTarget,
  POPULAR_GOVERNORATES,
} from '../constants/locations';

export default function HomeScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, radius, shadows } = useAppTheme();
  const { sendPharmacyReminder, notificationsEnabled } = useNotifications();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { getRating } = useRating();
  const { copyToClipboard } = useCopyToClipboard(() => {}, (error) => {
    logger.error('HomeScreen', 'Copy error', error);
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [basePharmacies, setBasePharmacies] = useState([]);
  const [visiblePharmacies, setVisiblePharmacies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const { history: locationHistory, addToHistory } = useLocationHistory();

  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const selectedGovernorate = searchTarget?.governorate || null;
  const searchTargetCoords = useMemo(() => {
    if (typeof searchTarget?.latitude === 'number' && typeof searchTarget?.longitude === 'number') {
      return { latitude: searchTarget.latitude, longitude: searchTarget.longitude };
    }

    const firstPharmacyWithCoords = visiblePharmacies.find(
      (item) => typeof item.latitude === 'number' && typeof item.longitude === 'number'
    );

    if (firstPharmacyWithCoords) {
      return {
        latitude: firstPharmacyWithCoords.latitude,
        longitude: firstPharmacyWithCoords.longitude,
      };
    }

    if (
      typeof searchTarget?.fallbackLatitude === 'number' &&
      typeof searchTarget?.fallbackLongitude === 'number'
    ) {
      return {
        latitude: searchTarget.fallbackLatitude,
        longitude: searchTarget.fallbackLongitude,
      };
    }

    return null;
  }, [searchTarget, visiblePharmacies]);
  const openCount = visiblePharmacies.filter((item) => item.isOpen).length;
  const dutyCount = visiblePharmacies.filter((item) => item.emergency).length;
  const styles = useMemo(() => createStyles(colors, radius, shadows, isRTL, insets.top), [colors, radius, shadows, isRTL, insets.top]);

  const loadData = async ({ coords = userLocation, target = searchTarget } = {}) => {
    try {
      if (target && !(target?.latitude && target?.longitude)) {
        if (target?.queryText) {
          const zoneResults = await searchPharmaciesAsync(target.queryText, {
            governorate: target.governorate,
            limit: 200,
          });

          if (Array.isArray(zoneResults)) {
            setBasePharmacies(zoneResults);
            return zoneResults;
          }
        }

        setBasePharmacies([]);
        return [];
      }

      const apiOptions = target?.latitude && target?.longitude
        ? {
          searchCoords: {
            latitude: target.latitude,
            longitude: target.longitude,
          },
          radiusKm: target.radiusKm ?? 20,
          limit: 200,
          fallbackGovernorate: target.governorate || target.label || null,
        }
        : coords?.latitude && coords?.longitude
          ? {
            searchCoords: coords,
            radiusKm: 20,
            limit: 100,
          }
          : null;

      const data = await loadPharmaciesAsync(t, true, apiOptions);
      setBasePharmacies(data);
      return data;
    } catch (error) {
      logger.error('HomeScreen', 'Error loading pharmacies data', error);
      const fallbackData = loadPharmacies(t);
      setBasePharmacies(fallbackData);
      return fallbackData;
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  const geocodeSearchTarget = async (placeLabel, baseTarget = null) => {
    const trimmedPlace = `${placeLabel || ''}`.trim();
    if (!trimmedPlace) {
      return null;
    }

    const queries = [
      [baseTarget?.label || trimmedPlace, baseTarget?.governorate, 'Tunisia']
        .filter(Boolean)
        .join(', '),
      [baseTarget?.label || trimmedPlace, 'Tunisia'].filter(Boolean).join(', '),
      trimmedPlace,
    ];

    for (const query of queries) {
      try {
        const results = await Location.geocodeAsync(query);
        const firstResult = results?.[0];
        if (firstResult) {
          return {
            ...(baseTarget || {}),
            type: baseTarget?.type || 'place',
            label: baseTarget?.label || trimmedPlace,
            queryText: baseTarget?.queryText || trimmedPlace,
            latitude: firstResult.latitude,
            longitude: firstResult.longitude,
            radiusKm: baseTarget?.radiusKm ?? 18,
          };
        }
      } catch (error) {
        logger.warn('HomeScreen', 'Place geocoding attempt failed', { query, error });
      }
    }

    return null;
  };

  const getLocationWithAndroidFix = async () => {
    try {
      // First, ensure permission is granted
      let permStatus = await Location.getForegroundPermissionsAsync();
      if (permStatus.status !== 'granted') {
        logger.warn('HomeScreen', 'Permission not granted, requesting...');
        const requestResult = await Location.requestForegroundPermissionsAsync();
        if (requestResult.status !== 'granted') {
          logger.warn('HomeScreen', 'Location permission denied by user');
          return null;
        }
      }

      // Check if location services are enabled (Android specific)
      try {
        const isEnabled = await Location.hasServicesEnabledAsync();
        if (!isEnabled) {
          logger.warn('HomeScreen', 'Location services disabled on device');
          return null;
        }
      } catch (checkError) {
        logger.warn('HomeScreen', 'Could not check location services', checkError);
        // Continue anyway - some devices might not support this check
      }

      // Try to get current position with timeout
      const coords = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 10000, // Use cached location if available
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('getCurrentPositionAsync timeout')), 10000)
        ),
      ]);

      return coords.coords;
    } catch (currentError) {
      logger.warn('HomeScreen', 'getCurrentPositionAsync failed', currentError);

      // Fallback to last known position
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords) {
          logger.warn('HomeScreen', 'Using last known position');
          return lastKnown.coords;
        }
      } catch (lastKnownError) {
        logger.warn('HomeScreen', 'getLastKnownPosition failed', lastKnownError);
      }

      return null;
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const coords = await getLocationWithAndroidFix();
      if (coords) {
        setUserLocation(coords);
        await loadData({ coords, target: null });
      } else {
        await loadData({ coords: null, target: null });
      }
    };

    bootstrap();
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    const syncVisiblePharmacies = async () => {
      const term = debouncedSearchTerm.trim();

      if (!term) {
        if (!cancelled) {
          setVisiblePharmacies(basePharmacies);
        }
        return;
      }

      if (term.length < 2) {
        if (!cancelled) {
          setVisiblePharmacies(filterPharmacies(basePharmacies, term));
        }
        return;
      }

      const searchedPharmacies = await searchPharmaciesAsync(term, {
        governorate: selectedGovernorate,
        limit: 100,
      });

      if (cancelled) {
        return;
      }

      if (Array.isArray(searchedPharmacies)) {
        setVisiblePharmacies(searchedPharmacies);
        return;
      }

      setVisiblePharmacies(filterPharmacies(basePharmacies, term));
    };

    syncVisiblePharmacies();

    return () => {
      cancelled = true;
    };
  }, [basePharmacies, debouncedSearchTerm, selectedGovernorate]);

  // When the selected place changes, reload the base location result set.
  useEffect(() => {
    const loadForSearchTarget = async () => {
      await loadData({ coords: userLocation, target: searchTarget });
    };

    if (!initialLoading) {
      loadForSearchTarget();
    }
  }, [searchTarget, initialLoading, userLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData({ coords: userLocation, target: searchTarget });
  };

  const goToUserLocation = async () => {
    try {
      const coords = await getLocationWithAndroidFix();

      if (coords) {
        setUserLocation(coords);
        setSearchTarget(null);
        const nextPharmacies = await loadData({ coords, target: null });
        const params = { pharmacies: nextPharmacies, initialLocation: coords };
        if (navigation?.jumpTo) navigation.jumpTo('Carte', params);
        else navigation.navigate('Carte', params);
      } else {
        logger.warn('HomeScreen', 'No location available, navigating to map without coordinates');
        if (navigation?.jumpTo) navigation.jumpTo('Carte', { pharmacies: visiblePharmacies });
        else navigation.navigate('Carte', { pharmacies: visiblePharmacies });
      }
    } catch (error) {
      logger.error('HomeScreen', 'goToUserLocation failed', error);
      if (navigation?.jumpTo) navigation.jumpTo('Carte', { pharmacies: visiblePharmacies });
      else navigation.navigate('Carte', { pharmacies: visiblePharmacies });
    }
  };

  const goToDirections = async (item) => {
    try {
      const coords = await getLocationWithAndroidFix();
      const fallbackLocation = searchTargetCoords;
      const params = coords
        ? { pharmacies: visiblePharmacies, initialLocation: coords, targetPharmacy: item }
        : fallbackLocation
          ? { pharmacies: visiblePharmacies, initialLocation: fallbackLocation, targetPharmacy: item }
          : { pharmacies: visiblePharmacies, targetPharmacy: item };
      
      if (navigation?.jumpTo) navigation.jumpTo('Carte', params);
      else navigation.navigate('Carte', params);
    } catch (error) {
      logger.warn('HomeScreen', 'goToDirections failed', error);
      const fallbackLocation = searchTargetCoords;
      const params = fallbackLocation
        ? { pharmacies: visiblePharmacies, initialLocation: fallbackLocation, targetPharmacy: item }
        : { pharmacies: visiblePharmacies, targetPharmacy: item };
      if (navigation?.jumpTo) navigation.jumpTo('Carte', params);
      else navigation.navigate('Carte', params);
    }
  };

  const callPhone = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch((error) =>
      logger.error('HomeScreen', 'Call failed', error)
    );
  };

  const formatDistance = (item) => {
    if (typeof item.distanceKm !== 'number') return t('home.distanceUnavailable', 'Location pending');
    return item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} m` : `${item.distanceKm.toFixed(1)} km`;
  };

  const openPharmacyDetails = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setDetailsModalVisible(true);
  };

  const handleSelectLocation = async (locationLabel) => {
    if (!locationLabel) {
      setSearchTarget(null);
      return;
    }

    const baseTarget = createLocationSearchTarget(locationLabel);

    if (baseTarget?.latitude && baseTarget?.longitude) {
      setSearchTarget(baseTarget);
      addToHistory(baseTarget.label);
      return;
    }

    setResolvingLocation(true);
    try {
      const geocodedTarget = await geocodeSearchTarget(locationLabel, baseTarget);
      const nextTarget =
        geocodedTarget ||
        (baseTarget?.fallbackLatitude && baseTarget?.fallbackLongitude
          ? {
            ...baseTarget,
            latitude: baseTarget.fallbackLatitude,
            longitude: baseTarget.fallbackLongitude,
          }
          : baseTarget || {
            type: 'place',
            label: `${locationLabel}`.trim(),
            queryText: `${locationLabel}`.trim(),
            governorate: null,
            radiusKm: 18,
          });

      setSearchTarget(nextTarget);
      if (nextTarget?.label) {
        addToHistory(nextTarget.label);
      }
    } finally {
      setResolvingLocation(false);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroOrbOne} />
        <View style={styles.heroOrbTwo} />
        <View style={styles.heroTop}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="shield-plus-outline" size={16} color="#D9F5FF" />
            <AppText variant="labelMedium" color="#FFFFFF">
              {t('home.trustedNetwork', 'Trusted pharmacy network')}
            </AppText>
          </View>
          <TouchableOpacity
            style={styles.heroAction}
            onPress={() => navigation.navigate('Chatbot')}
            accessibilityRole="button"
            accessibilityLabel={t('chatbot.bubbleLabel', 'Open first aid assistant')}
          >
            <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <AppText variant="headerLarge" color="#FFFFFF">
          {searchTarget
            ? t('home.pharmaciesInLocation', 'Pharmacies in {{location}}', {
              location: searchTarget.label,
            })
            : t('home.nearbyPharmacies', 'Nearby pharmacies')}
        </AppText>
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.84)" style={{ marginTop: 8 }}>
          {searchTarget
            ? searchTarget.type === 'city'
              ? t(
                'home.heroSubtitleZone',
                'Browsing pharmacies in {{location}}, filtered inside {{governorate}}.',
                { location: searchTarget.label, governorate: searchTarget.governorate }
              )
              : t(
                'home.heroSubtitleLocation',
                'Browsing pharmacies around {{location}} using map coordinates, even when address details are incomplete.',
                { location: searchTarget.label }
              )
            : t(
              'home.heroSubtitle',
              'Search, call, and navigate to nearby pharmacies from one calm and reliable dashboard.'
            )}
        </AppText>

        <View style={styles.metricsRow}>
          {[
            { value: visiblePharmacies.length, label: t('home.results', 'Results') },
            { value: openCount, label: t('home.openNow', 'Open now') },
            { value: dutyCount, label: t('home.onDuty', 'On duty') },
          ].map((metric) => (
            <View key={metric.label} style={styles.metricCard}>
              <AppText variant="headerMedium" color="#FFFFFF" align="center">
                {metric.value}
              </AppText>
              <AppText variant="labelSmall" color="rgba(255,255,255,0.72)" align="center">
                {metric.label}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <AppCard style={{ marginBottom: 18 }}>
        <SearchBar
          placeholder={t('home.searchPlacePlaceholder', 'Search by pharmacy or area')}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        
        {/* Location Filter - Quick Access Chips */}
        <View style={styles.locationFilterScroll}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locationFilterContent}
          >
            {/* All Locations */}
            <TouchableOpacity
              style={[
                styles.locationFilterButton,
                !searchTarget && styles.locationFilterButtonActive,
              ]}
              onPress={() => handleSelectLocation(null)}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('home.allLocations', 'All locations')}
            >
              <Feather
                name="map"
                size={14}
                color={!searchTarget ? '#FFFFFF' : colors.primary}
              />
              <AppText
                variant="labelSmall"
                color={!searchTarget ? '#FFFFFF' : colors.textSecondary}
              >
                {t('home.all', 'All')}
              </AppText>
            </TouchableOpacity>

            {/* Popular Governorates */}
            {POPULAR_GOVERNORATES.map((gov) => (
              <TouchableOpacity
                key={gov}
                style={[
                  styles.locationFilterButton,
                  searchTarget?.type === 'governorate' &&
                    selectedGovernorate === gov &&
                    styles.locationFilterButtonActive,
                ]}
                onPress={() => handleSelectLocation(gov)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={gov}
              >
                <Feather
                  name="map-pin"
                  size={14}
                  color={
                    searchTarget?.type === 'governorate' && selectedGovernorate === gov
                      ? '#FFFFFF'
                      : colors.primary
                  }
                />
                <AppText
                  variant="labelSmall"
                  color={
                    searchTarget?.type === 'governorate' && selectedGovernorate === gov
                      ? '#FFFFFF'
                      : colors.textSecondary
                  }
                >
                  {gov.split(' ')[0]}
                </AppText>
              </TouchableOpacity>
            ))}

            {/* More Locations Button */}
            <TouchableOpacity
              style={[styles.locationFilterButton, styles.locationFilterButtonMore]}
              onPress={() => setLocationPickerVisible(true)}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('home.moreLocations', 'More locations')}
            >
              <Ionicons
                name="add"
                size={14}
                color={colors.primary}
              />
              <AppText
                variant="labelSmall"
                color={colors.textSecondary}
              >
                {t('home.more', 'More')}
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Location Denial Banner */}
        {!userLocation && !selectedGovernorate && (
          <View style={styles.locationBanner}>
            <MaterialCommunityIcons name="information" size={16} color={colors.primary} />
            <AppText variant="labelSmall" color={colors.primary} style={{ flex: 1, marginLeft: 10 }}>
              {t('home.selectLocationBanner', 'Select a location below to browse pharmacies. Enable location for nearby results.')}
            </AppText>
          </View>
        )}
        
        <View style={styles.quickActions}>
          <AppButton
            title={t('home.refresh', 'Refresh')}
            onPress={onRefresh}
            variant="outlined"
            style={{ flex: 1 }}
            disabled={resolvingLocation}
            icon={<Feather name="refresh-cw" size={16} color={colors.primary} />}
          />
          <AppButton
            title={t('home.myLocation', 'My location')}
            onPress={goToUserLocation}
            style={{ flex: 1.1 }}
            disabled={resolvingLocation}
            icon={<Feather name="navigation" size={16} color="#FFFFFF" />}
          />
        </View>
      </AppCard>

      <SectionTitle
        eyebrow={t('home.careDirectory', 'Care directory')}
        title={t('home.availablePharmacies', 'Available pharmacies')}
        subtitle={t('home.resultsSubtitle', 'Tap a pharmacy for actions, details, and directions')}
        aside={
          <View style={styles.countPill}>
            <AppText variant="labelLarge" color={colors.primary}>
              {visiblePharmacies.length}
            </AppText>
          </View>
        }
      />
    </View>
  );

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => item.toString()}
          ListHeaderComponent={renderHeader()}
          renderItem={() => <LoadingSkeleton height={188} borderRadius={24} style={{ marginBottom: 14 }} />}
          contentContainerStyle={styles.content}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visiblePharmacies}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => {
          const rating = getRating(item.id);
          const favorite = isFavorite(item.id);
          return (
            <PharmacyListItem
              item={item}
              distanceLabel={`${item.governorate || t('home.localCare', 'Local care')} · ${formatDistance(item)}`}
              rating={rating}
              favorite={favorite}
              onToggleFavorite={() => toggleFavorite(item.id)}
              onOpenDetails={() => openPharmacyDetails(item)}
              onCall={() => {
                callPhone(item.phone);
                if (notificationsEnabled) {
                  sendPharmacyReminder(item.name, `${item.name} - ${item.address}`);
                }
              }}
              onDirections={() => goToDirections(item)}
            />
          );
        }}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={t('home.noPharmacies', 'No pharmacies found')}
            message={t('home.noPharmaciesMessage', 'Try another keyword or refresh your location.')}
            actionTitle={t('home.refresh', 'Refresh')}
            onAction={onRefresh}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <PharmacyDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        pharmacy={selectedPharmacy}
        isDarkMode={isDarkMode}
        isRTL={isRTL}
        onCopy={copyToClipboard}
      />

      <LocationPicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        allLocations={ALL_LOCATION_OPTIONS}
        recentLocations={locationHistory}
        selectedLocation={searchTarget?.label || null}
        onSelectLocation={handleSelectLocation}
      />
    </View>
  );
}

const createStyles = (colors, radius, shadows, isRTL, topInset) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundAccent,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: Math.max(topInset + 24, 96),
      paddingBottom: 140,
    },
    heroCard: {
      backgroundColor: colors.primary,
      borderRadius: radius.xxl,
      padding: 24,
      marginBottom: 18,
      overflow: 'hidden',
      ...shadows.floating,
    },
    heroOrbOne: {
      position: 'absolute',
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: 'rgba(255,255,255,0.08)',
      top: -52,
      right: isRTL ? undefined : -48,
      left: isRTL ? -48 : undefined,
    },
    heroOrbTwo: {
      position: 'absolute',
      width: 116,
      height: 116,
      borderRadius: 58,
      backgroundColor: 'rgba(106, 202, 255, 0.18)',
      bottom: -24,
      right: isRTL ? undefined : 34,
      left: isRTL ? 34 : undefined,
    },
    heroTop: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    heroBadge: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    heroAction: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    metricsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
      marginTop: 20,
    },
    metricCard: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radius.xl,
      backgroundColor: 'rgba(5, 21, 46, 0.22)',
    },
    quickActions: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
    },
    countPill: {
      minWidth: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
    },
    locationFilterScroll: {
      marginVertical: 12,
    },
    locationFilterContent: {
      paddingHorizontal: 0,
      gap: 8,
    },
    locationFilterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locationFilterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    locationFilterButtonMore: {
      borderColor: colors.borderStrong,
      borderWidth: 1.5,
    },
    locationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginVertical: 12,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryMuted,
    },
  });

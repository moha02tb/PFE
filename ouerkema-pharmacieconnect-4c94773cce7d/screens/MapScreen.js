import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather, Entypo } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useForceUpdate } from '../hooks/useForceUpdate';
import logger from '../utils/logger';
import { Input } from '../components/design-system';
import { getColors } from '../utils/colors';
import { SPACING, LAYOUT } from '../utils/spacing';
import { getContextualShadow } from '../utils/shadows';
import { TEXT_STYLES } from '../utils/typography';
import { API_CONFIG } from '../config/api';

// Tile provider configurations - Choose the one that works best for Tunisia
const TILE_PROVIDERS = {
  osmFrance: {
    name: 'OpenStreetMap France',
    urlTemplate: 'https://tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    maxZoom: 20,
    attribution: '© OpenStreetMap France',
  },
  cartoDB: {
    name: 'CartoDB Positron',
    urlTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    maxZoom: 18,
    attribution: '© CartoDB, © OpenStreetMap',
  },
  cartoDBDark: {
    name: 'CartoDB Dark Matter',
    urlTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    maxZoom: 18,
    attribution: '© CartoDB, © OpenStreetMap',
  },
  stamen: {
    name: 'Stamen Terrain',
    urlTemplate: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png',
    maxZoom: 18,
    attribution: '© Stamen Design, © OpenStreetMap',
  },
  openCycleMap: {
    name: 'OpenCycleMap',
    urlTemplate: 'https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=YOUR_API_KEY',
    maxZoom: 18,
    attribution: '© Thunderforest, © OpenStreetMap',
  },
};

export default function MapScreen({ route, navigation }) {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapPharmacies, setMapPharmacies] = useState(route?.params?.pharmacies || []);
  const [markerInfo, setMarkerInfo] = useState('');
  const [currentTileProvider, setCurrentTileProvider] = useState('osmFrance'); // Default to OSM France
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { isRTL } = useLanguage();
  const forceUpdate = useForceUpdate();

  const pharmacies = route?.params?.pharmacies || [];
  const initialLocation = route?.params?.initialLocation;

  useEffect(() => {
    setMapPharmacies(pharmacies);
  }, [pharmacies]);

  const getPharmacyCoordinate = (pharmacy) => {
    if (
      pharmacy?.coords &&
      typeof pharmacy.coords.latitude === 'number' &&
      typeof pharmacy.coords.longitude === 'number'
    ) {
      return pharmacy.coords;
    }

    if (
      pharmacy?.coordinates &&
      typeof pharmacy.coordinates.latitude === 'number' &&
      typeof pharmacy.coordinates.longitude === 'number'
    ) {
      return pharmacy.coordinates;
    }

    if (typeof pharmacy?.latitude === 'number' && typeof pharmacy?.longitude === 'number') {
      return {
        latitude: pharmacy.latitude,
        longitude: pharmacy.longitude,
      };
    }

    return null;
  };

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    } else {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setErrorMsg(t('home.locationPermissionDenied'));
            return;
          }

          const { coords } = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });

          setLocation(coords);
        } catch (error) {
          setErrorMsg(t('home.locationError'));
          logger.error('MapScreen', 'Error getting location', error);
        }
      })();
    }
  }, []);

  useEffect(() => {
    const fetchNearbyForMap = async () => {
      if (!location?.latitude || !location?.longitude) return;

      try {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.pharmaciesNearby}?lat=${location.latitude}&lon=${location.longitude}&radius_km=20&limit=200`;
        const resp = await fetch(url, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!resp.ok) {
          logger.warn('MapScreen', `Nearby API failed with status ${resp.status}`);
          return;
        }

        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setMapPharmacies(data);
          setMarkerInfo(`${data.length} nearby pharmacies`);
        } else {
          // If no nearby pharmacies, keep passed pharmacies and center map on first known pharmacy.
          setMarkerInfo('No nearby pharmacies in radius; showing available pharmacies');
          if (Array.isArray(pharmacies) && pharmacies.length > 0) {
            const first = getPharmacyCoordinate(pharmacies[0]);
            if (first) {
              setLocation((prev) => ({
                latitude: first.latitude,
                longitude: first.longitude,
                latitudeDelta: prev?.latitudeDelta ?? 0.2,
                longitudeDelta: prev?.longitudeDelta ?? 0.2,
              }));
            }
          }
        }
      } catch (e) {
        logger.warn('MapScreen', 'Failed to fetch nearby pharmacies for map', e);
      }
    };

    fetchNearbyForMap();
  }, [location]);

  // Show all pharmacies that have valid coordinates; search bar is used for place search
  const filteredPharmacies = useMemo(
    () =>
      mapPharmacies
        .map((ph) => ({ ...ph, markerCoordinate: getPharmacyCoordinate(ph) }))
        .filter((ph) => ph.markerCoordinate),
    [mapPharmacies]
  );

  useEffect(() => {
    if (!mapRef.current || filteredPharmacies.length === 0) return;

    const coords = filteredPharmacies
      .slice(0, 150)
      .map((ph) => ph.markerCoordinate)
      .filter(Boolean);

    if (coords.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 60, bottom: 120, left: 60 },
          animated: true,
        });
      }, 300);
    }
  }, [filteredPharmacies]);

  // Get current tile provider configuration
  const currentProvider = TILE_PROVIDERS[currentTileProvider];

  // Handle tile provider change
  const switchTileProvider = (providerKey) => {
    setCurrentTileProvider(providerKey);
    setShowProviderSelector(false);
    Alert.alert(
      t('map.tileProviderChanged', 'Tile Provider Changed'),
      `${t('map.nowUsing', 'Now using:')} ${TILE_PROVIDERS[providerKey].name}`,
      [{ text: t('common.ok', 'OK') }]
    );
  };

  // Place search using Nominatim (OpenStreetMap)
  const handlePlaceSearch = async () => {
    const query = searchTerm?.trim();
    if (!query) return;
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        {
          headers: {
            Accept: 'application/json',
            'Accept-Language': isRTL ? 'ar' : 'fr',
          },
        }
      );
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const { lat, lon } = data[0];
        setLocation((prev) => ({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          // Preserve previous deltas if present
          latitudeDelta: prev?.latitudeDelta ?? 0.05,
          longitudeDelta: prev?.longitudeDelta ?? 0.05,
        }));
      }
    } catch (e) {
      logger.warn('MapScreen', 'Place search failed', e);
    }
  };

  // Force re-render when RTL changes for instant updates
  useEffect(() => {
    forceUpdate();
  }, [isRTL, forceUpdate, currentTileProvider]);

  // Graceful back handling: close selector first, then return to home tab
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showProviderSelector) {
        setShowProviderSelector(false);
        return true;
      }
      if (navigation?.navigate) {
        navigation.navigate('Accueil');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [showProviderSelector, navigation]);

  if (!location) {
    return (
      <View style={getStyles(isDarkMode).loaderContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={[getStyles(isDarkMode).loadingText]}>{t('map.loading')}</Text>
      </View>
    );
  }

  const styles = getStyles(isDarkMode, isRTL);

  return (
    <View style={styles.container}>
      {/* Map at the back */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Tile Provider */}
        <UrlTile
          urlTemplate={currentProvider.urlTemplate}
          maximumZ={currentProvider.maxZoom}
          shouldReplaceMapContent={true}
        />

        {/* Pharmacy Markers */}
        {filteredPharmacies.map((ph) => (
          <Marker
            key={ph.id}
            coordinate={ph.markerCoordinate}
            title={ph.name}
            description={ph.address}
          />
        ))}

        {/* User Location Marker */}
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={t('map.userLocation')}
          pinColor="blue"
        />
      </MapView>

      {/* Overlays above the map */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Title Container */}
        <View style={[styles.titleContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Entypo name="map" size={20} color="#fff" />
          <Text
            style={[
              styles.titleText,
              {
                marginLeft: isRTL ? 0 : SPACING.md,
                marginRight: isRTL ? SPACING.md : 0,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}
          >
            {t('map.title')}
          </Text>
        </View>

        {markerInfo ? (
          <View style={styles.markerInfoBadge}>
            <Text style={styles.markerInfoText}>{markerInfo}</Text>
          </View>
        ) : null}

        {/* Search Container */}
        <View style={styles.searchWrapper} pointerEvents="auto">
          <Input
            placeholder={t('map.searchPlacePlaceholder', 'Search a place...')}
            value={searchTerm}
            onChangeText={setSearchTerm}
            onBlur={handlePlaceSearch}
            isDarkMode={isDarkMode}
            isRTL={isRTL}
            icon={<Feather name="search" size={20} color={getColors(isDarkMode).textSecondary} />}
          />
        </View>

        {/* Tile Provider Selector Button */}
        <TouchableOpacity
          style={styles.providerButton}
          onPress={() => setShowProviderSelector(!showProviderSelector)}
          accessibilityLabel={t('map.changeTileProvider', 'Change tile provider')}
        >
          <Feather name="layers" size={20} color="white" />
        </TouchableOpacity>

        {/* Provider Selector Dropdown */}
        {showProviderSelector && (
          <View style={styles.providerSelector}>
            {Object.entries(TILE_PROVIDERS).map(([key, provider]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.providerOption,
                  currentTileProvider === key && styles.selectedProvider,
                ]}
                onPress={() => switchTileProvider(key)}
              >
                <Text
                  style={[
                    styles.providerOptionText,
                    currentTileProvider === key && styles.selectedProviderText,
                  ]}
                >
                  {provider.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (isDarkMode, isRTL = false) => {
  const colors = getColors(isDarkMode);
  const shadow = getContextualShadow(2, isDarkMode);

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background || '#FFFFFF',
    },
    loadingText: {
      marginTop: SPACING.lg,
      ...TEXT_STYLES.bodyLarge,
      color: colors.text,
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
      marginBottom: 0,
      ...shadow,
      zIndex: 20,
    },
    titleText: {
      ...TEXT_STYLES.headerMedium,
      color: '#FFFFFF',
    },
    searchWrapper: {
      position: 'absolute',
      top: SPACING.xxl,
      left: SPACING.lg,
      right: SPACING.lg,
      zIndex: 30,
      paddingHorizontal: 0,
    },
    providerButton: {
      position: 'absolute',
      top: SPACING.xxl * 2 + 60,
      right: SPACING.lg,
      zIndex: 15,
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: '#0066CC',
      justifyContent: 'center',
      alignItems: 'center',
      ...shadow,
    },
    providerSelector: {
      position: 'absolute',
      top: SPACING.xxl * 2 + 110,
      right: SPACING.lg,
      zIndex: 20,
      backgroundColor: colors.surface || '#FFFFFF',
      borderRadius: 8,
      paddingVertical: SPACING.sm,
      minWidth: 200,
      ...shadow,
    },
    providerOption: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || '#E0E0E0',
    },
    selectedProvider: {
      backgroundColor: colors.surfaceVariant || '#F5F5F5',
    },
    providerOptionText: {
      ...TEXT_STYLES.bodyMedium,
      color: colors.text,
    },
    selectedProviderText: {
      color: '#0066CC',
      fontWeight: '600',
    },
    markerInfoBadge: {
      position: 'absolute',
      top: SPACING.xxl + 8,
      alignSelf: 'center',
      zIndex: 40,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 16,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    markerInfoText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
  });
};

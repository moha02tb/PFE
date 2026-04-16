import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Entypo, Feather, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';
import logger from '../utils/logger';
import {
  AppButton,
  AppCard,
  AppText,
  EmptyState,
  SearchBar,
  StatusBadge,
} from '../components/design-system';
import { API_CONFIG } from '../config/api';
import { useAppTheme } from '../utils/theme';

const MAPBOX_API_TOKEN =
  'pk.eyJ1IjoiamlueDAyIiwiYSI6ImNtbmdlNDNucTAzenoyb3MzN2IxMDR0dmIifQ.Lyv-7qbgd64fajrdF7bZAA';

const MAPBOX_STYLES = {
  streets: {
    name: 'Streets',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`,
  },
  satellite: {
    name: 'Satellite',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`,
  },
  light: {
    name: 'Light',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`,
  },
  dark: {
    name: 'Dark',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`,
  },
};

const DEFAULT_REGION = {
  latitude: 36.8065,
  longitude: 10.1815,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

export default function MapboxMapScreen({ route }) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { colors, radius, shadows } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, radius, shadows, isRTL), [colors, radius, shadows, isRTL]);
  const mapRef = useRef(null);
  const getPharmacyCoordinate = (pharmacy) => {
    if (pharmacy?.coords?.latitude && pharmacy?.coords?.longitude) return pharmacy.coords;
    if (pharmacy?.coordinates?.latitude && pharmacy?.coordinates?.longitude) return pharmacy.coordinates;
    if (pharmacy?.latitude && pharmacy?.longitude) return { latitude: pharmacy.latitude, longitude: pharmacy.longitude };
    return null;
  };
  const initialMapCenter = useMemo(() => {
    const initialLocation = route?.params?.initialLocation;
    if (initialLocation?.latitude && initialLocation?.longitude) {
      return {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: initialLocation.latitudeDelta || DEFAULT_REGION.latitudeDelta,
        longitudeDelta: initialLocation.longitudeDelta || DEFAULT_REGION.longitudeDelta,
      };
    }

    const targetCoordinate = getPharmacyCoordinate(route?.params?.targetPharmacy);
    if (targetCoordinate) {
      return {
        ...targetCoordinate,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    const firstPharmacy = Array.isArray(route?.params?.pharmacies)
      ? route.params.pharmacies.find((item) => getPharmacyCoordinate(item))
      : null;
    const firstCoordinate = getPharmacyCoordinate(firstPharmacy);
    if (firstCoordinate) {
      return {
        ...firstCoordinate,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };
    }

    return DEFAULT_REGION;
  }, [route?.params?.initialLocation, route?.params?.pharmacies, route?.params?.targetPharmacy]);

  const [location, setLocation] = useState(initialMapCenter);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapPharmacies, setMapPharmacies] = useState(Array.isArray(route?.params?.pharmacies) ? route.params.pharmacies : []);
  const [selectedPharmacy, setSelectedPharmacy] = useState(route?.params?.targetPharmacy || null);
  const [currentStyle, setCurrentStyle] = useState('streets');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [canFetchNearby, setCanFetchNearby] = useState(Boolean(route?.params?.initialLocation));

  useEffect(() => {
    let isMounted = true;

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          logger.warn('MapboxMapScreen', 'Location permission not granted');
          return;
        }

        // Try last known position first (fast)
        try {
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (isMounted && lastKnown?.coords) {
            setLocation((previous) => ({
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
              latitudeDelta: previous?.latitudeDelta || DEFAULT_REGION.latitudeDelta,
              longitudeDelta: previous?.longitudeDelta || DEFAULT_REGION.longitudeDelta,
            }));
            setCanFetchNearby(true);
          }
        } catch (lastKnownError) {
          logger.warn('MapboxMapScreen', 'Could not get last known position', lastKnownError);
        }

        // Try current position with timeout
        try {
          const current = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              maximumAge: 15000,
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Location request timeout')), 20000)
            ),
          ]);

          if (!isMounted || !current?.coords) return;
          setLocation((previous) => ({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            latitudeDelta: previous?.latitudeDelta || DEFAULT_REGION.latitudeDelta,
            longitudeDelta: previous?.longitudeDelta || DEFAULT_REGION.longitudeDelta,
          }));
          setCanFetchNearby(true);
        } catch (currentError) {
          logger.warn('MapboxMapScreen', 'Could not get current position', currentError);
          // Still allow search/nearby if we have last known or initial location
          if (isMounted && (location?.latitude || initialMapCenter?.latitude)) {
            setCanFetchNearby(true);
          }
        }
      } catch (error) {
        logger.error('MapboxMapScreen', 'Location initialization failed', error);
      }
    };

    loadLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchNearby = async () => {
      if (!canFetchNearby || !location?.latitude || !location?.longitude) return;
      try {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.pharmaciesNearby}?lat=${location.latitude}&lon=${location.longitude}&radius_km=20&limit=200`;
        const resp = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!resp.ok) return;
        const data = await resp.json();
        if (Array.isArray(data) && data.length) setMapPharmacies(data);
      } catch (error) {
        logger.warn('MapboxMapScreen', 'Nearby fetch failed', error);
      }
    };
    fetchNearby();
  }, [canFetchNearby, location]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showStyleSelector) {
        setShowStyleSelector(false);
        return true;
      }
      if (selectedPharmacy) {
        setSelectedPharmacy(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [selectedPharmacy, showStyleSelector]);

  const fetchDirections = async (origin, destination) => {
    try {
      // Validate input coordinates
      if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
        logger.warn('MapboxMapScreen', 'Invalid coordinates for directions', { origin, destination });
        return;
      }

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?access_token=${MAPBOX_API_TOKEN}&geometries=geojson`;
      const response = await fetch(url);
      
      if (!response.ok) {
        logger.warn('MapboxMapScreen', 'Directions API error', { status: response.status });
        return;
      }

      const data = await response.json();
      if (!data.routes?.length) {
        logger.warn('MapboxMapScreen', 'No routes found in directions response');
        return;
      }

      const route = data.routes[0];
      
      if (!route.geometry?.coordinates?.length) {
        logger.warn('MapboxMapScreen', 'Invalid route geometry');
        return;
      }

      const nextCoordinates = route.geometry.coordinates
        .map((coord) => ({
          latitude: coord[1],
          longitude: coord[0],
        }))
        .filter((c) => typeof c.latitude === 'number' && typeof c.longitude === 'number');

      if (!nextCoordinates.length) {
        logger.warn('MapboxMapScreen', 'No valid coordinates in route');
        return;
      }

      setRouteCoordinates(nextCoordinates);
      setRouteDistance(route.distance / 1000);
      setRouteDuration(route.duration / 60);

      // Safely fit map to coordinates with error handling
      if (mapRef.current && nextCoordinates.length > 0) {
        try {
          mapRef.current.fitToCoordinates(nextCoordinates, {
            edgePadding: { top: 140, right: 60, bottom: 220, left: 60 },
            animated: true,
          });
        } catch (mapError) {
          logger.warn('MapboxMapScreen', 'fitToCoordinates failed', mapError);
          // Silently fail - map state remains as is
        }
      }
    } catch (error) {
      logger.error('MapboxMapScreen', 'Directions fetch failed', error);
      // Clear route data on failure
      setRouteCoordinates([]);
      setRouteDistance(null);
      setRouteDuration(null);
    }
  };

  useEffect(() => {
    if (selectedPharmacy && location && canFetchNearby) {
      const destination = getPharmacyCoordinate(selectedPharmacy);
      if (destination) fetchDirections(location, destination);
      return;
    }
    setRouteCoordinates([]);
    setRouteDistance(null);
    setRouteDuration(null);
  }, [canFetchNearby, selectedPharmacy, location]);

  const filteredPharmacies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return mapPharmacies
      .map((item) => ({ ...item, markerCoordinate: getPharmacyCoordinate(item) }))
      .filter(
        (item) =>
          item.markerCoordinate &&
          (!normalizedSearch ||
            (item.name || '').toLowerCase().includes(normalizedSearch) ||
            (item.address || '').toLowerCase().includes(normalizedSearch))
      );
  }, [mapPharmacies, searchTerm]);

  const openExternalMap = (address) => {
    const query = encodeURIComponent(address);
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  useEffect(() => {
    if (!mapRef.current || !filteredPharmacies.length) return;
    const coords = filteredPharmacies.slice(0, 150).map((item) => item.markerCoordinate).filter(Boolean);
    if (!coords.length) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 140, right: 60, bottom: 200, left: 60 },
        animated: true,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [filteredPharmacies]);

  if (!MAPBOX_API_TOKEN) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="map-outline"
          title={t('map.mapboxTokenRequired', 'Mapbox token required')}
          message={t('map.mapboxInstructions', 'Add a valid Mapbox token to display the map.')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialMapCenter}
        mapType="none"
      >
        <UrlTile urlTemplate={MAPBOX_STYLES[currentStyle].urlTemplate} maximumZ={18} shouldReplaceMapContent />
        {filteredPharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            coordinate={pharmacy.markerCoordinate}
            title={pharmacy.name}
            description={pharmacy.address}
            pinColor={pharmacy.isOpen ? '#22AA66' : '#BA1A1A'}
            tracksViewChanges={false}
            onPress={() => setSelectedPharmacy(pharmacy)}
          />
        ))}
        {location?.latitude && location?.longitude ? (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={t('map.userLocation', 'My location')}
            pinColor={colors.primary}
            tracksViewChanges={false}
          />
        ) : null}
        {routeCoordinates.length ? <Polyline coordinates={routeCoordinates} strokeColor={colors.primary} strokeWidth={4} /> : null}
      </MapView>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.topOverlay}>
          <AppCard style={styles.topCard}>
            <View style={styles.titleRow}>
              <View>
                <AppText variant="labelSmall" color={colors.textSecondary}>
                  {t('navigation.map', 'Map')}
                </AppText>
                <AppText variant="headerSmall">{t('map.title', 'Pharmacy map')}</AppText>
              </View>
              <TouchableOpacity
                style={styles.layerButton}
                onPress={() => setShowStyleSelector((current) => !current)}
              >
                <Feather name="layers" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <SearchBar
              placeholder={t('map.searchPlaceholder', 'Search by pharmacy or area')}
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={{ marginBottom: 0 }}
            />
          </AppCard>

          {showStyleSelector ? (
            <AppCard style={styles.selectorCard}>
              <AppText variant="labelMedium" color={colors.textSecondary} style={{ marginBottom: 10 }}>
                {t('map.changeMapStyle', 'Map style')}
              </AppText>
              <View style={styles.styleChips}>
                {Object.entries(MAPBOX_STYLES).map(([key, value]) => (
                  <AppButton
                    key={key}
                    title={value.name}
                    onPress={() => {
                      setCurrentStyle(key);
                      setShowStyleSelector(false);
                    }}
                    variant={currentStyle === key ? 'contained' : 'tonal'}
                    size="small"
                  />
                ))}
              </View>
            </AppCard>
          ) : null}
        </View>

        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={async () => {
              const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              setLocation((previous) => ({
                latitude: current.coords.latitude,
                longitude: current.coords.longitude,
                latitudeDelta: previous?.latitudeDelta || 0.05,
                longitudeDelta: previous?.longitudeDelta || 0.05,
              }));
              setCanFetchNearby(true);
              mapRef.current?.animateToRegion({
                latitude: current.coords.latitude,
                longitude: current.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
            }}
          >
            <Ionicons name="locate" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {selectedPharmacy ? (
          <View style={styles.bottomOverlay}>
            <AppCard style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View style={{ flex: 1 }}>
                  <AppText variant="headerSmall">{selectedPharmacy.name}</AppText>
                  <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 4 }}>
                    {selectedPharmacy.address}
                  </AppText>
                </View>
                <StatusBadge status={selectedPharmacy.isOpen ? 'open' : 'closed'} />
              </View>
              {(routeDistance || routeDuration) ? (
                <View style={styles.routeRow}>
                  {routeDistance ? (
                    <View style={styles.routePill}>
                      <Entypo name="map" size={14} color={colors.primary} />
                      <AppText variant="labelMedium" color={colors.primary}>{routeDistance.toFixed(1)} km</AppText>
                    </View>
                  ) : null}
                  {routeDuration ? (
                    <View style={styles.routePill}>
                      <Feather name="clock" size={14} color={colors.primary} />
                      <AppText variant="labelMedium" color={colors.primary}>{Math.round(routeDuration)} min</AppText>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <View style={styles.selectedActions}>
                <AppButton
                  title={t('home.directions', 'Directions')}
                  onPress={() => openExternalMap(selectedPharmacy.address)}
                  style={{ flex: 1 }}
                  icon={<Entypo name="map" size={14} color="#FFFFFF" />}
                />
                <AppButton
                  title={t('common.close', 'Close')}
                  onPress={() => setSelectedPharmacy(null)}
                  variant="outlined"
                  style={{ flex: 1 }}
                />
              </View>
            </AppCard>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors, radius, shadows, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundAccent,
      padding: 24,
    },
    topOverlay: {
      paddingTop: 104,
      paddingHorizontal: 16,
    },
    topCard: {
      marginBottom: 10,
    },
    titleRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    layerButton: {
      width: 42,
      height: 42,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
    },
    selectorCard: {
      marginBottom: 10,
    },
    styleChips: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    floatingControls: {
      position: 'absolute',
      right: isRTL ? undefined : 16,
      left: isRTL ? 16 : undefined,
      bottom: 206,
    },
    floatingButton: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.floating,
    },
    bottomOverlay: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 124,
    },
    selectedCard: {
      ...shadows.floating,
    },
    selectedHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    routeRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    routePill: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: colors.primaryMuted,
    },
    selectedActions: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
      marginTop: 14,
    },
  });

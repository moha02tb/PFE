import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Entypo, Feather, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from './LanguageContext';
import logger from '../utils/logger';
import {
  AppButton,       
  AppCard,
  AppText,
  SearchBar,
  StatusBadge,
} from '../components/design-system';
import { API_CONFIG } from '../config/api';
import { useAppTheme } from '../utils/theme';

const DEFAULT_REGION = {
  latitude: 36.8065,
  longitude: 10.1815,
  latitudeDelta: 0.32,
  longitudeDelta: 0.32,
};

const TILE_PROVIDERS = {
  standard: {
    label: 'OSM',
    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
  light: {
    label: 'Light',
    urlTemplate: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
  dark: {
    label: 'Dark',
    urlTemplate: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
};

const parseCoordinate = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getPharmacyCoordinate = (pharmacy) => {
  const candidates = [
    pharmacy?.coords,
    pharmacy?.coordinates,
    pharmacy,
  ];

  for (const item of candidates) {
    const latitude = parseCoordinate(item?.latitude ?? item?.lat);
    const longitude = parseCoordinate(item?.longitude ?? item?.lon ?? item?.lng);
    if (latitude !== null && longitude !== null) {
      return { latitude, longitude };
    }
  }

  return null;
};

const getRegionFromCoordinate = (coordinate, delta = 0.08) => ({
  latitude: coordinate.latitude,
  longitude: coordinate.longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

const getInitialRegion = (params) => {
  const initialCoordinate = getPharmacyCoordinate(params?.initialLocation);
  if (initialCoordinate) {
    return {
      ...getRegionFromCoordinate(initialCoordinate),
      latitudeDelta: params.initialLocation.latitudeDelta || 0.1,
      longitudeDelta: params.initialLocation.longitudeDelta || 0.1,
    };
  }

  const targetCoordinate = getPharmacyCoordinate(params?.targetPharmacy);
  if (targetCoordinate) return getRegionFromCoordinate(targetCoordinate);

  const firstPharmacy = Array.isArray(params?.pharmacies)
    ? params.pharmacies.find((item) => getPharmacyCoordinate(item))
    : null;
  const firstCoordinate = getPharmacyCoordinate(firstPharmacy);

  return firstCoordinate ? getRegionFromCoordinate(firstCoordinate, 0.12) : DEFAULT_REGION;
};

const normalizePharmacy = (pharmacy, index) => {
  const markerCoordinate = getPharmacyCoordinate(pharmacy);
  if (!markerCoordinate) return null;

  return {
    ...pharmacy,
    id: pharmacy?.id ?? `${markerCoordinate.latitude}-${markerCoordinate.longitude}-${index}`,
    markerCoordinate,
  };
};

const normalizePharmacies = (items) =>
  Array.isArray(items) ? items.map(normalizePharmacy).filter(Boolean) : [];

const getDistanceKm = (from, to) => {
  if (!from || !to) return null;

  const earthRadius = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getStatus = (pharmacy) => {
  if (pharmacy?.isOpen === false) return 'closed';
  if (pharmacy?.emergency) return 'emergency';
  if (pharmacy?.is_on_duty || pharmacy?.onDuty || pharmacy?.garde) return 'onDuty';
  return 'open';
};

export default function MapboxMapScreen({ route }) {
  const params = route?.params;
  const routeInitialLocation = params?.initialLocation;
  const routePharmacies = params?.pharmacies;
  const routeTargetPharmacy = params?.targetPharmacy;
  const mapRef = useRef(null);
  const initialLocationRequestRef = useRef(false);
  const lastNearbyRequestRef = useRef(null);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { colors, radius, shadows } = useAppTheme();
  const styles = useMemo(
    () => createStyles(colors, radius, shadows, isRTL, insets),
    [colors, radius, shadows, isRTL, insets]
  );

  const initialRegion = useMemo(
    () => getInitialRegion(params),
    [params, routeInitialLocation, routePharmacies, routeTargetPharmacy]
  );
  const initialPharmacies = useMemo(() => normalizePharmacies(routePharmacies), [routePharmacies]);
  const initialTarget = useMemo(() => normalizePharmacy(routeTargetPharmacy, 0), [routeTargetPharmacy]);

  const [region, setRegion] = useState(initialRegion);
  const [userLocation, setUserLocation] = useState(getPharmacyCoordinate(routeInitialLocation));
  const [pharmacies, setPharmacies] = useState(initialPharmacies);
  const [selectedPharmacy, setSelectedPharmacy] = useState(initialTarget);
  const [searchTerm, setSearchTerm] = useState('');
  const [tileProvider, setTileProvider] = useState('standard');
  const [showLayers, setShowLayers] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [fetchState, setFetchState] = useState('idle');
  const [permissionMessage, setPermissionMessage] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [isRouting, setIsRouting] = useState(false);

  const filteredPharmacies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return pharmacies;

    return pharmacies.filter((item) =>
      [item.name, item.address, item.governorate, item.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [pharmacies, searchTerm]);

  const fitMapToCoordinates = useCallback(
    (coordinates) => {
      if (!mapRef.current || !mapReady) return;

      if (coordinates.length > 1) {
        mapRef.current.fitToCoordinates(coordinates.slice(0, 150), {
          edgePadding: { top: 150, right: 56, bottom: 220, left: 56 },
          animated: true,
        });
        return;
      }

      if (coordinates.length === 1) {
        mapRef.current.animateToRegion(getRegionFromCoordinate(coordinates[0], 0.08), 450);
      }
    },
    [mapReady]
  );

  const fitCoordinates = useCallback(
    (nextPharmacies = filteredPharmacies, includeUser = true) => {
      const coordinates = nextPharmacies.map((item) => item.markerCoordinate).filter(Boolean);
      if (includeUser && userLocation) coordinates.push(userLocation);
      fitMapToCoordinates(coordinates);
    },
    [filteredPharmacies, fitMapToCoordinates, userLocation]
  );

  const loadNearby = useCallback(async(coordinate) => {
    if (!coordinate?.latitude || !coordinate?.longitude) return;

    setFetchState('loading');
    try {
      const query = `lat=${coordinate.latitude}&lon=${coordinate.longitude}&radius_km=20&limit=200`;
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.pharmaciesNearby}?${query}`, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        logger.warn('MapboxMapScreen', `Nearby API failed with status ${response.status}`);
        setFetchState('idle');
        return;
      }

      const rows = normalizePharmacies(await response.json());
      if (rows.length) {
        setPharmacies(rows);
        setFetchState('ready');
        return;
      }

      setFetchState('empty');
    } catch (error) {
      logger.warn('MapboxMapScreen', 'Nearby fetch failed', error);
      setFetchState('idle');
    }
  }, []);

  const centerOnCoordinate = useCallback((coordinate, delta = 0.08) => {
    if (!coordinate) return;
    const nextRegion = getRegionFromCoordinate(coordinate, delta);
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 450);
  }, []);

  const requestLocation = useCallback(async() => {
    setIsLocating(true);
    setPermissionMessage('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionMessage(t('home.locationPermissionDenied', 'Location permission denied'));
        return null;
      }

      let position = null;
      try {
        position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Location request timeout')), 15000)),
        ]);
      } catch (currentError) {
        logger.warn('MapboxMapScreen', 'Current location failed, trying last known location', currentError);
        position = await Location.getLastKnownPositionAsync();
      }

      const coordinate = getPharmacyCoordinate(position?.coords);
      if (!coordinate) {
        setPermissionMessage(t('home.locationError', 'Unable to determine your location'));
        return null;
      }

      setUserLocation(coordinate);
      centerOnCoordinate(coordinate);
      await loadNearby(coordinate);
      return coordinate;
    } catch (error) {
      logger.error('MapboxMapScreen', 'Location request failed', error);
      setPermissionMessage(t('home.locationError', 'Unable to determine your location'));
      return null;
    } finally {
      setIsLocating(false);
    }
  }, [centerOnCoordinate, loadNearby, t]);

  const clearRoute = useCallback(() => {
    setRouteCoordinates([]);
    setRouteDistance(null);
    setRouteDuration(null);
    setRouteError('');
    setIsRouting(false);
  }, []);

  const showRouteInApp = useCallback(
    async(pharmacy) => {
      const destination = pharmacy?.markerCoordinate || getPharmacyCoordinate(pharmacy);
      if (!destination) return;

      setRouteError('');
      setRouteCoordinates([]);
      setRouteDistance(null);
      setRouteDuration(null);
      setIsRouting(true);

      try {
        const origin = userLocation || await requestLocation();
        if (!origin) {
          setRouteError(t('map.locationNeededForRoute', 'Enable location to show the road in the app.'));
          return;
        }

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`,
          { headers: { Accept: 'application/json' } }
        );

        if (!response.ok) {
          throw new Error(`Route service failed with status ${response.status}`);
        }

        const data = await response.json();
        const route = data?.routes?.[0];
        const nextRouteCoordinates = Array.isArray(route?.geometry?.coordinates)
          ? route.geometry.coordinates
            .map(([longitude, latitude]) => ({ latitude, longitude }))
            .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
          : [];

        if (!nextRouteCoordinates.length) {
          throw new Error('Route service returned no geometry');
        }

        setRouteCoordinates(nextRouteCoordinates);
        setRouteDistance(typeof route.distance === 'number' ? route.distance / 1000 : null);
        setRouteDuration(typeof route.duration === 'number' ? route.duration / 60 : null);
        fitMapToCoordinates([origin, ...nextRouteCoordinates, destination]);
      } catch (error) {
        logger.warn('MapboxMapScreen', 'In-app route fetch failed', error);
        setRouteCoordinates([]);
        setRouteDistance(null);
        setRouteDuration(null);
        setRouteError(t('map.routeUnavailable', 'Could not draw the road inside the app right now.'));
      } finally {
        setIsRouting(false);
      }
    },
    [fitMapToCoordinates, requestLocation, t, userLocation]
  );

  const selectPharmacy = useCallback(
    (pharmacy) => {
      setSelectedPharmacy(pharmacy);
      centerOnCoordinate(pharmacy.markerCoordinate, 0.055);
      showRouteInApp(pharmacy);
    },
    [centerOnCoordinate, showRouteInApp]
  );

  useEffect(() => {
    const nextRegion = getInitialRegion(params);
    const nextPharmacies = normalizePharmacies(routePharmacies);
    const nextTarget = normalizePharmacy(routeTargetPharmacy, 0);
    const nextUserLocation = getPharmacyCoordinate(routeInitialLocation);

    setRegion(nextRegion);
    if (nextPharmacies.length) setPharmacies(nextPharmacies);
    setSelectedPharmacy(nextTarget);
    if (nextUserLocation) setUserLocation(nextUserLocation);

    const timer = setTimeout(() => {
      if (nextTarget?.markerCoordinate) {
        centerOnCoordinate(nextTarget.markerCoordinate, 0.055);
        showRouteInApp(nextTarget);
      } else if (nextPharmacies.length) {
        const coordinates = nextPharmacies.map((item) => item.markerCoordinate).filter(Boolean);
        if (nextUserLocation) coordinates.push(nextUserLocation);
        fitMapToCoordinates(coordinates);
      } else {
        mapRef.current?.animateToRegion(nextRegion, 350);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [
    centerOnCoordinate,
    fitMapToCoordinates,
    params,
    routeInitialLocation,
    routePharmacies,
    routeTargetPharmacy,
    showRouteInApp,
  ]);

  useEffect(() => {
    if (initialLocationRequestRef.current || routeInitialLocation || initialPharmacies.length) return;
    initialLocationRequestRef.current = true;
    requestLocation();
  }, [initialPharmacies.length, requestLocation, routeInitialLocation]);

  useEffect(() => {
    const coordinate = getPharmacyCoordinate(routeInitialLocation);
    if (!coordinate) return;

    const requestKey = `${coordinate.latitude}:${coordinate.longitude}`;
    if (lastNearbyRequestRef.current === requestKey) return;
    lastNearbyRequestRef.current = requestKey;

    setUserLocation(coordinate);
    loadNearby(coordinate);
  }, [loadNearby, routeInitialLocation]);

  useEffect(() => {
    if (!mapReady || !filteredPharmacies.length) return undefined;
    const timer = setTimeout(() => fitCoordinates(filteredPharmacies, true), 250);
    return () => clearTimeout(timer);
  }, [filteredPharmacies, fitCoordinates, mapReady]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showLayers) {
        setShowLayers(false);
        return true;
      }
      if (routeCoordinates.length) {
        clearRoute();
        return true;
      }
      if (selectedPharmacy) {
        setSelectedPharmacy(null);
        clearRoute();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [clearRoute, routeCoordinates.length, selectedPharmacy, showLayers]);

  const selectedDistance = selectedPharmacy
    ? getDistanceKm(userLocation, selectedPharmacy.markerCoordinate)
    : null;
  const provider = TILE_PROVIDERS[tileProvider];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        mapType="none"
        loadingEnabled
        onMapReady={() => setMapReady(true)}
        onRegionChangeComplete={setRegion}
      >
        <UrlTile
          urlTemplate={provider.urlTemplate}
          maximumZ={provider.maxZoom}
          shouldReplaceMapContent
        />

        {filteredPharmacies.map((pharmacy) => (
          <Marker
            key={String(pharmacy.id)}
            coordinate={pharmacy.markerCoordinate}
            title={pharmacy.name}
            description={pharmacy.address || pharmacy.governorate}
            pinColor={selectedPharmacy?.id === pharmacy.id ? colors.primary : colors.success}
            tracksViewChanges={false}
            onPress={() => selectPharmacy(pharmacy)}
          />
        ))}

        {userLocation ? (
          <Marker
            coordinate={userLocation}
            title={t('map.userLocation', 'My location')}
            pinColor={colors.primary}
            tracksViewChanges={false}
          />
        ) : null}

        {routeCoordinates.length ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}
      </MapView>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.topOverlay} pointerEvents="box-none">
          <AppCard style={styles.topCard} elevation={4}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <AppText variant="labelSmall" color={colors.textSecondary}>
                  {t('navigation.map', 'Map')}
                </AppText>
                <AppText variant="headerSmall">
                  {t('map.title', 'Pharmacy map')}
                </AppText>
              </View>
              <View style={styles.headerActions}>
                <View style={styles.countPill}>
                  <AppText variant="labelMedium" color={colors.primary}>
                    {filteredPharmacies.length}
                  </AppText>
                </View>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowLayers((current) => !current)}
                  accessibilityRole="button"
                  accessibilityLabel={t('map.changeMapStyle', 'Map style')}
                >
                  <Feather name="layers" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <SearchBar
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder={t('map.searchPlaceholder', 'Search by pharmacy or area')}
              style={styles.search}
            />

            {permissionMessage ? (
              <AppText variant="bodySmall" color={colors.warning} style={styles.noticeText}>
                {permissionMessage}
              </AppText>
            ) : null}

            {fetchState === 'empty' ? (
              <AppText variant="bodySmall" color={colors.textSecondary} style={styles.noticeText}>
                {t('map.noNearbyFallback', 'No nearby pharmacies found. Showing available records.')}
              </AppText>
            ) : null}

            {routeError ? (
              <AppText variant="bodySmall" color={colors.error} style={styles.noticeText}>
                {routeError}
              </AppText>
            ) : null}
          </AppCard>

          {showLayers ? (
            <AppCard style={styles.layersCard} elevation={4}>
              <View style={styles.layerOptions}>
                {Object.entries(TILE_PROVIDERS).map(([key, value]) => (
                  <AppButton
                    key={key}
                    title={value.label}
                    size="small"
                    variant={tileProvider === key ? 'contained' : 'tonal'}
                    onPress={() => {
                      setTileProvider(key);
                      setShowLayers(false);
                    }}
                    style={styles.layerButton}
                  />
                ))}
              </View>
            </AppCard>
          ) : null}
        </View>

        <View style={styles.controlStack} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={requestLocation}
            disabled={isLocating}
            accessibilityRole="button"
            accessibilityLabel={t('map.userLocation', 'My location')}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="locate" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => fitCoordinates(filteredPharmacies, true)}
            accessibilityRole="button"
            accessibilityLabel={t('map.fitMarkers', 'Fit markers')}
          >
            <Feather name="maximize-2" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {!filteredPharmacies.length ? (
          <View style={styles.emptyCard}>
            <AppText variant="labelLarge">{t('map.noMatches', 'No matching pharmacies')}</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} style={styles.emptyDescription}>
              {t('map.noMatchesDesc', 'Try another pharmacy name or area.')}
            </AppText>
          </View>
        ) : null}

        <View style={styles.attribution} pointerEvents="none">
          <AppText variant="labelSmall" color={colors.textSecondary}>
            OpenStreetMap contributors
          </AppText>
        </View>

        {selectedPharmacy ? (
          <View style={styles.bottomOverlay} pointerEvents="box-none">
            <AppCard style={styles.selectedCard} elevation={5}>
              <View style={styles.selectedHeader}>
                <View style={styles.selectedText}>
                  <AppText variant="headerSmall" numberOfLines={2}>
                    {selectedPharmacy.name || t('map.selectedPharmacy', 'Selected pharmacy')}
                  </AppText>
                  <AppText variant="bodySmall" color={colors.textSecondary} style={styles.addressText} numberOfLines={2}>
                    {selectedPharmacy.address || selectedPharmacy.governorate || t('map.noAddress', 'Address unavailable')}
                  </AppText>
                </View>
                <StatusBadge status={getStatus(selectedPharmacy)} size="small" />
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Entypo name="location-pin" size={15} color={colors.primary} />
                  <AppText variant="labelMedium" color={colors.primary}>
                    {selectedDistance ? `${selectedDistance.toFixed(1)} km` : t('home.distanceUnavailable', 'Location pending')}
                  </AppText>
                </View>
                {fetchState === 'loading' ? (
                  <View style={styles.metaPill}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <AppText variant="labelMedium" color={colors.primary}>
                      {t('common.loading', 'Loading')}
                    </AppText>
                  </View>
                ) : null}
                {routeDistance ? (
                  <View style={styles.metaPill}>
                    <Entypo name="map" size={15} color={colors.primary} />
                    <AppText variant="labelMedium" color={colors.primary}>
                      {routeDistance.toFixed(1)} km
                    </AppText>
                  </View>
                ) : null}
                {routeDuration ? (
                  <View style={styles.metaPill}>
                    <Feather name="clock" size={15} color={colors.primary} />
                    <AppText variant="labelMedium" color={colors.primary}>
                      {Math.round(routeDuration)} min
                    </AppText>
                  </View>
                ) : null}
              </View>

              <View style={styles.selectedActions}>
                <AppButton
                  title={isRouting ? t('map.loadingRoute', 'Loading route') : t('home.directions', 'Directions')}
                  onPress={() => showRouteInApp(selectedPharmacy)}
                  icon={<Entypo name="map" size={15} color={colors.primaryForeground} />}
                  loading={isRouting}
                  style={styles.actionButton}
                />
                <AppButton
                  title={routeCoordinates.length ? t('map.closeRoute', 'Close route') : t('common.close', 'Close')}
                  onPress={() => {
                    if (routeCoordinates.length) {
                      clearRoute();
                      return;
                    }
                    setSelectedPharmacy(null);
                  }}
                  variant="outlined"
                  style={styles.actionButton}
                />
              </View>
            </AppCard>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors, radius, shadows, isRTL, insets) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topOverlay: {
      paddingTop: insets.top + 74,
      paddingHorizontal: 16,
    },
    topCard: {
      marginBottom: 10,
    },
    headerRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14,
    },
    headerText: {
      flex: 1,
    },
    headerActions: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    },
    countPill: {
      minWidth: 42,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: 12,
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    search: {
      marginBottom: 0,
    },
    noticeText: {
      marginTop: 10,
    },
    layersCard: {
      alignSelf: isRTL ? 'flex-start' : 'flex-end',
      minWidth: 238,
    },
    layerOptions: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    layerButton: {
      minWidth: 0,
      flexGrow: 1,
    },
    controlStack: {
      position: 'absolute',
      right: isRTL ? undefined : 16,
      left: isRTL ? 16 : undefined,
      top: insets.top + 258,
      gap: 10,
    },
    floatingButton: {
      width: 52,
      height: 52,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.floating,
    },
    emptyCard: {
      position: 'absolute',
      left: 24,
      right: 24,
      top: insets.top + 300,
      borderRadius: radius.xxl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      ...shadows.card,
    },
    emptyDescription: {
      marginTop: 4,
    },
    attribution: {
      position: 'absolute',
      left: isRTL ? undefined : 16,
      right: isRTL ? 16 : undefined,
      bottom: insets.bottom + 96,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 5,
      opacity: 0.88,
    },
    bottomOverlay: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: insets.bottom + 112,
    },
    selectedCard: {
      ...shadows.floating,
    },
    selectedHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    selectedText: {
      flex: 1,
    },
    addressText: {
      marginTop: 5,
    },
    metaRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    metaPill: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 7,
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
    actionButton: {
      flex: 1,
    },
  });

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
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
import { loadPharmaciesAsync } from '../utils/pharmacyDataLoader';
import { geocodePlace } from '../utils/geocodingUtils';
import { useAppTheme } from '../utils/theme';
import { getPharmacyOpenStatus } from '../utils/pharmacySchedule';

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

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

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
  // Use new Tunisian schedule logic
  const status = getPharmacyOpenStatus(pharmacy);
  return status.statusType;
};

const createLeafletMapHtml = (initialRegion, palette) => {
  const bootState = JSON.stringify({
    initialRegion,
    palette,
    tileProviders: TILE_PROVIDERS,
  });

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="${LEAFLET_CSS_URL}" />
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      background: #eef3f8;
      overflow: hidden;
    }

    .leaflet-container {
      width: 100%;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #eef3f8;
    }

    .leaflet-control-zoom {
      margin-right: 16px !important;
      margin-bottom: 184px !important;
      border: 0 !important;
      box-shadow: 0 10px 24px rgba(16, 35, 58, 0.16) !important;
    }

    .leaflet-control-zoom a {
      width: 42px !important;
      height: 42px !important;
      line-height: 42px !important;
      color: #10233a !important;
      border: 0 !important;
    }



    .user-location-marker {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--marker-color);
      border: 4px solid #ffffff;
      box-shadow: 0 0 0 8px rgba(0, 102, 204, 0.18), 0 6px 16px rgba(16, 35, 58, 0.22);
      box-sizing: border-box;
    }

    .map-error {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #10233a;
      text-align: center;
      background: #eef3f8;
      font: 600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="map-error" class="map-error">Map could not load.</div>
  <script src="${LEAFLET_JS_URL}"></script>
  <script>
    (function () {
      var boot = ${bootState};
      var map = null;
      var tileLayer = null;
      var markerLayer = null;
      var routeLayer = null;
      var selectedId = null;
      var currentTileProvider = 'standard';
      var palette = boot.palette || {};

      function post(type, payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
        }
      }

      function showError(message) {
        var errorEl = document.getElementById('map-error');
        if (errorEl) {
          errorEl.textContent = message || 'Map could not load.';
          errorEl.style.display = 'flex';
        }
        post('error', { message: message || 'Map could not load.' });
      }

      function zoomFromDelta(delta) {
        var nextDelta = Number(delta) || 0.08;
        return Math.max(3, Math.min(18, Math.round(Math.log2(360 / nextDelta))));
      }

      function toLatLng(coordinate) {
        if (!coordinate) return null;
        var latitude = Number(coordinate.latitude);
        var longitude = Number(coordinate.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        return [latitude, longitude];
      }

      function markerColor(status, isSelected) {
        // If selected, always show blue
        if (isSelected) return '#2563EB'; // Blue for selected
        
        // Status-based colors
        switch (status) {
          case 'open':
            return '#10B981'; // Green - Open
          case 'closed':
            return '#EF4444'; // Red - Closed
          case 'garde':
            return '#F97316'; // Orange - On duty
          case 'night':
            return '#A78BFA'; // Purple - Night pharmacy
          default:
            return '#9CA3AF'; // Gray - Unknown
        }
      }

      function createMarkerIcon(status, isSelected) {
        var color = markerColor(status, isSelected);
        var size = isSelected ? 40 : 32;
        
        // Inline SVG pharmacy marker with medical cross icon
        var svgHtml = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">' +
          // Circle background with border
          '<circle cx="20" cy="20" r="18" fill="' + color + '" />' +
          '<circle cx="20" cy="20" r="18" fill="none" stroke="white" stroke-width="2.5" />' +
          // White pharmacy cross/plus icon
          '<g fill="white">' +
          '<rect x="17" y="10" width="6" height="20" rx="1" />' +
          '<rect x="10" y="17" width="20" height="6" rx="1" />' +
          '</g>' +
          '</svg>';
        
        return L.divIcon({
          className: '',
          html: svgHtml,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });
      }

      function createUserIcon() {
        var color = palette.primary || '#0066cc';
        return L.divIcon({
          className: '',
          html: '<div class="user-location-marker" style="--marker-color:' + color + '"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
      }

      function applyTileProvider(providerKey) {
        currentTileProvider = providerKey || currentTileProvider || 'standard';
        var provider = boot.tileProviders[currentTileProvider] || boot.tileProviders.standard;
        if (!provider || !map) return;
        if (tileLayer) {
          map.removeLayer(tileLayer);
        }
        tileLayer = L.tileLayer(provider.urlTemplate, {
          maxZoom: provider.maxZoom || 19,
          attribution: 'OpenStreetMap contributors',
          crossOrigin: true
        }).addTo(map);
      }

      function renderData(payload) {
        if (!map || !markerLayer || !routeLayer) return;
        payload = payload || {};
        selectedId = payload.selectedId == null ? null : String(payload.selectedId);
        if (payload.tileProvider) {
          applyTileProvider(payload.tileProvider);
        }

        markerLayer.clearLayers();
        routeLayer.clearLayers();

        (payload.pharmacies || []).forEach(function (pharmacy) {
          var latLng = toLatLng(pharmacy);
          if (!latLng) return;
          var id = String(pharmacy.id);
          var isSelected = selectedId === id;
          L.marker(latLng, {
            icon: createMarkerIcon(pharmacy.status, isSelected),
            keyboard: false
          })
            .addTo(markerLayer)
            .on('click', function () {
              post('markerPress', { id: id });
            });
        });

        var userLatLng = toLatLng(payload.userLocation);
        if (userLatLng) {
          L.marker(userLatLng, {
            icon: createUserIcon(),
            keyboard: false,
            interactive: false
          }).addTo(markerLayer);
        }

        var route = (payload.routeCoordinates || []).map(toLatLng).filter(Boolean);
        if (route.length) {
          L.polyline(route, {
            color: palette.primary || '#0066cc',
            weight: 5,
            opacity: 0.88,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(routeLayer);
        }
      }

      function fitCoordinates(coordinates) {
        if (!map) return;
        var latLngs = (coordinates || []).map(toLatLng).filter(Boolean);
        if (latLngs.length > 1) {
          map.fitBounds(L.latLngBounds(latLngs), {
            paddingTopLeft: [56, 150],
            paddingBottomRight: [56, 220],
            animate: true
          });
        } else if (latLngs.length === 1) {
          map.setView(latLngs[0], 14, { animate: true });
        }
      }

      function centerOnRegion(region) {
        if (!map) return;
        var latLng = toLatLng(region);
        if (!latLng) return;
        map.setView(latLng, zoomFromDelta(region.latitudeDelta || region.delta), { animate: true });
      }

      function handleNativeMessage(rawMessage) {
        var message = rawMessage;
        if (typeof rawMessage === 'string') {
          try {
            message = JSON.parse(rawMessage);
          } catch (error) {
            return;
          }
        }
        if (!message || !message.type) return;

        if (message.type === 'setData') renderData(message.payload);
        if (message.type === 'fitCoordinates') fitCoordinates(message.payload && message.payload.coordinates);
        if (message.type === 'center') centerOnRegion(message.payload && message.payload.region);
        if (message.type === 'setTileProvider') applyTileProvider(message.payload && message.payload.tileProvider);
      }

      window.__PHARMACY_MAP_BRIDGE__ = handleNativeMessage;

      function init() {
        if (!window.L) {
          showError('OpenStreetMap map assets could not load.');
          return;
        }

        var initial = boot.initialRegion || {};
        map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true
        }).setView(
          [Number(initial.latitude) || 36.8065, Number(initial.longitude) || 10.1815],
          zoomFromDelta(initial.latitudeDelta || 0.32)
        );
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        markerLayer = L.layerGroup().addTo(map);
        routeLayer = L.layerGroup().addTo(map);
        applyTileProvider('standard');
        post('ready');
      }

      window.addEventListener('message', function (event) {
        handleNativeMessage(event.data);
      });
      document.addEventListener('message', function (event) {
        handleNativeMessage(event.data);
      });

      init();
    })();
  </script>
</body>
</html>`;
};

export default function MapboxMapScreen({ route }) {
  const params = route?.params;
  const routeInitialLocation = params?.initialLocation;
  const routePharmacies = params?.pharmacies;
  const routeTargetPharmacy = params?.targetPharmacy;
  const shouldRequestUserLocation = Boolean(params?.requestUserLocation);
  const locationRequestId = params?.locationRequestId;
  const mapRef = useRef(null);
  const initialLocationRequestRef = useRef(false);
  const lastLocationRequestIdRef = useRef(null);
  const lastRouteParamsRef = useRef(null);
  const lastNearbyRequestRef = useRef(null);
  const routeAbortControllerRef = useRef(null);
  const currentRoutePharmacyRef = useRef(null);
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
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const [activeSearchLocation, setActiveSearchLocation] = useState(null);

  const mapHtml = useMemo(
    () =>
      createLeafletMapHtml(initialRegion, {
        primary: colors.primary,
        primaryMuted: colors.primaryMuted,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
      }),
    [
      colors.error,
      colors.primary,
      colors.primaryMuted,
      colors.success,
      colors.warning,
      initialRegion,
    ]
  );
  const mapSource = useMemo(
    () => ({ html: mapHtml, baseUrl: 'https://osm.local' }),
    [mapHtml]
  );

  const sendMapMessage = useCallback((type, payload = {}) => {
    if (!mapRef.current || !mapReady) return;

    try {
      const message = JSON.stringify({ type, payload });
      mapRef.current.injectJavaScript(
        `window.__PHARMACY_MAP_BRIDGE__ && window.__PHARMACY_MAP_BRIDGE__(${JSON.stringify(message)}); true;`
      );
    } catch (error) {
      logger.warn('MapboxMapScreen', `${type} failed`, error);
    }
  }, [mapReady]);

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
      if (!mapReady) return;

      sendMapMessage('fitCoordinates', {
        coordinates: coordinates.slice(0, 150),
      });
    },
    [mapReady, sendMapMessage]
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
      const rows = normalizePharmacies(await loadPharmaciesAsync(t, true, {
        searchCoords: coordinate,
        radiusKm: 20,
        limit: 100,
      }));
      if (rows.length) {
        setPharmacies(rows);
        setFetchState('ready');
        return rows;
      }

      setPharmacies([]);
      setFetchState('empty');
      return [];
    } catch (error) {
      logger.warn('MapboxMapScreen', 'Nearby fetch failed', error);
      setPharmacies([]);
      setFetchState('idle');
      return [];
    }
  }, [t]);

  const centerOnCoordinate = useCallback((coordinate, delta = 0.08) => {
    if (!coordinate) return;
    const nextRegion = getRegionFromCoordinate(coordinate, delta);
    sendMapMessage('center', { region: nextRegion });
  }, [sendMapMessage]);

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

  const handleSearchPlace = useCallback(
    async (placeName) => {
      const trimmedPlace = `${placeName || ''}`.trim();

      // Clear previous geocoding error
      setGeocodingError('');

      // If search is empty, just filter existing pharmacies
      if (!trimmedPlace) {
        setActiveSearchLocation(null);
        return;
      }

      // If search term is very short, just filter existing pharmacies
      if (trimmedPlace.length < 2) {
        return;
      }

      // Try to geocode the place
      setIsGeocoding(true);
      try {
        const coordinates = await geocodePlace(trimmedPlace);

        if (coordinates) {
          // Successfully geocoded - load nearby pharmacies
          setActiveSearchLocation({
            name: trimmedPlace,
            ...coordinates,
          });

          // Center map on the geocoded location
          centerOnCoordinate(coordinates, 0.12);

          // Load nearby pharmacies at the geocoded location
          const nearbyPharmacies = await loadNearby(coordinates);

          if (!Array.isArray(nearbyPharmacies) || nearbyPharmacies.length === 0) {
            setGeocodingError(
              t('map.noPharmaciesNearby', 'No pharmacies found near {{place}}', {
                place: trimmedPlace,
              })
            );
          }
        } else {
          // Geocoding failed - show error
          setGeocodingError(
            t('map.placeNotFound', 'Could not find "{{place}}" on the map', {
              place: trimmedPlace,
            })
          );
          setActiveSearchLocation(null);
        }
      } catch (error) {
        logger.warn('MapboxMapScreen', 'Geocoding error', error);
        setGeocodingError(
          t('map.geocodingError', 'Error searching for location. Try again.')
        );
        setActiveSearchLocation(null);
      } finally {
        setIsGeocoding(false);
      }
    },
    [centerOnCoordinate, loadNearby, t]
  );

  // Debounce the search to avoid too many API calls (600ms)
  useEffect(() => {
    let timeoutId;

    const debouncedSearch = () => {
      handleSearchPlace(searchTerm);
    };

    timeoutId = setTimeout(debouncedSearch, 600);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchTerm, handleSearchPlace]);

  const clearRoute = useCallback(() => {
    setRouteCoordinates([]);
    setRouteDistance(null);
    setRouteDuration(null);
    setRouteError('');
    setIsRouting(false);
  }, []);

  const showRouteInApp = useCallback(
    async(pharmacy, originOverride = null) => {
      const destination = pharmacy?.markerCoordinate || getPharmacyCoordinate(pharmacy);
      if (!destination) return;

      // Cancel any previous OSRM request
      if (routeAbortControllerRef.current) {
        routeAbortControllerRef.current.abort();
      }
      routeAbortControllerRef.current = new AbortController();
      currentRoutePharmacyRef.current = pharmacy?.id;

      setRouteError('');
      setRouteCoordinates([]);
      setRouteDistance(null);
      setRouteDuration(null);
      setIsRouting(true);

      try {
        const origin = activeSearchLocation || originOverride || userLocation || await requestLocation();
        if (!origin) {
          setRouteError(t('map.locationNeededForRoute', 'Enable location to show the road in the app.'));
          return;
        }

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`,
          { headers: { Accept: 'application/json' }, signal: routeAbortControllerRef.current.signal }
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

        // Only apply if this is still the requested pharmacy (ignore stale responses)
        if (currentRoutePharmacyRef.current === pharmacy?.id) {
          setRouteCoordinates(nextRouteCoordinates);
          setRouteDistance(typeof route.distance === 'number' ? route.distance / 1000 : null);
          setRouteDuration(typeof route.duration === 'number' ? route.duration / 60 : null);
          fitMapToCoordinates([origin, ...nextRouteCoordinates, destination]);
        }
      } catch (error) {
        // Silently ignore abort errors (user switched pharmacy)
        if (error.name === 'AbortError') {
          logger.debug('MapboxMapScreen', 'Route request cancelled (pharmacy switched)');
          return;
        }
        logger.warn('MapboxMapScreen', 'In-app route fetch failed', error);
        setRouteCoordinates([]);
        setRouteDistance(null);
        setRouteDuration(null);
        setRouteError(t('map.routeUnavailable', 'Could not draw the road inside the app right now.'));
      } finally {
        setIsRouting(false);
      }
    },
    [fitMapToCoordinates, requestLocation, t, userLocation, activeSearchLocation]
  );

  const selectPharmacy = useCallback(
    (pharmacy) => {
      setSelectedPharmacy(pharmacy);
      centerOnCoordinate(pharmacy.markerCoordinate, 0.055);
      showRouteInApp(pharmacy);
    },
    [centerOnCoordinate, showRouteInApp]
  );

  const mapData = useMemo(
    () => ({
      tileProvider,
      selectedId: selectedPharmacy?.id == null ? null : String(selectedPharmacy.id),
      userLocation,
      routeCoordinates,
      pharmacies: filteredPharmacies.map((pharmacy) => ({
        id: String(pharmacy.id),
        latitude: pharmacy.markerCoordinate.latitude,
        longitude: pharmacy.markerCoordinate.longitude,
        status: getStatus(pharmacy),
      })),
    }),
    [filteredPharmacies, routeCoordinates, selectedPharmacy?.id, tileProvider, userLocation]
  );

  const handleMapMessage = useCallback(
    (event) => {
      let message = null;
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch (error) {
        logger.warn('MapboxMapScreen', 'Invalid map message', error);
        return;
      }

      if (message?.type === 'ready') {
        setMapReady(true);
        return;
      }

      if (message?.type === 'markerPress') {
        const markerId = String(message.payload?.id);
        const pharmacy = filteredPharmacies.find((item) => String(item.id) === markerId);
        if (pharmacy) {
          selectPharmacy(pharmacy);
        }
        return;
      }

      if (message?.type === 'error') {
        logger.warn('MapboxMapScreen', message.payload?.message || 'Leaflet map failed');
        setPermissionMessage(t('map.mapUnavailable', 'Map could not load. Check your connection.'));
      }
    },
    [filteredPharmacies, selectPharmacy, t]
  );

  useEffect(() => {
    if (!mapReady) return;
    sendMapMessage('setData', mapData);
  }, [mapData, mapReady, sendMapMessage]);

  useEffect(() => {
    if (lastRouteParamsRef.current === params) return undefined;
    lastRouteParamsRef.current = params;

    const nextRegion = getInitialRegion(params);
    const nextPharmacies = normalizePharmacies(routePharmacies);
    const nextTarget = normalizePharmacy(routeTargetPharmacy, 0);
    const nextUserLocation = getPharmacyCoordinate(routeInitialLocation);

    if (nextPharmacies.length) setPharmacies(nextPharmacies);
    setSelectedPharmacy(nextTarget);
    if (nextUserLocation) setUserLocation(nextUserLocation);

    const timer = setTimeout(() => {
      if (nextTarget?.markerCoordinate) {
        centerOnCoordinate(nextTarget.markerCoordinate, 0.055);
        showRouteInApp(nextTarget, nextUserLocation);
      } else if (nextPharmacies.length) {
        const coordinates = nextPharmacies.map((item) => item.markerCoordinate).filter(Boolean);
        if (nextUserLocation) coordinates.push(nextUserLocation);
        fitMapToCoordinates(coordinates);
      } else {
        sendMapMessage('center', { region: nextRegion });
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
    sendMapMessage,
  ]);

  useEffect(() => {
    if (shouldRequestUserLocation) {
      const requestKey = locationRequestId || 'requested';
      if (lastLocationRequestIdRef.current === requestKey) return;

      lastLocationRequestIdRef.current = requestKey;
      initialLocationRequestRef.current = true;
      requestLocation();
      return;
    }

    if (
      initialLocationRequestRef.current ||
      routeInitialLocation ||
      initialPharmacies.length
    ) return;
    initialLocationRequestRef.current = true;
    requestLocation();
  }, [
    initialPharmacies.length,
    locationRequestId,
    requestLocation,
    routeInitialLocation,
    shouldRequestUserLocation,
  ]);

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

  return (
    <View style={styles.container}>
      <WebView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        source={mapSource}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onLoadStart={() => setMapReady(false)}
        onMessage={handleMapMessage}
        onError={(event) => {
          logger.warn('MapboxMapScreen', 'OSM WebView failed', event.nativeEvent);
          setPermissionMessage(t('map.mapUnavailable', 'Map could not load. Check your connection.'));
        }}
      />

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

            <View style={styles.searchContainer}>
              <SearchBar
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder={t(
                  'map.cartePlaceholder',
                  'Search city name or place'
                )}
                style={styles.search}
              />
              {isGeocoding && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={styles.geocodingLoader}
                />
              )}
            </View>

            {geocodingError ? (
              <AppText
                variant="bodySmall"
                color={colors.warning}
                style={styles.noticeText}
              >
                {geocodingError}
              </AppText>
            ) : null}

            {permissionMessage ? (
              <AppText
                variant="bodySmall"
                color={colors.warning}
                style={styles.noticeText}
              >
                {permissionMessage}
              </AppText>
            ) : null}

            {fetchState === 'empty' && activeSearchLocation ? (
              <AppText
                variant="bodySmall"
                color={colors.textSecondary}
                style={styles.noticeText}
              >
                {t(
                  'map.noPharmaciesAtLocation',
                  'No pharmacies found in {{place}}',
                  { place: activeSearchLocation.name }
                )}
              </AppText>
            ) : null}

            {routeError ? (
              <AppText
                variant="bodySmall"
                color={colors.error}
                style={styles.noticeText}
              >
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
    searchContainer: {
      position: 'relative',
      marginBottom: 0,
    },
    geocodingLoader: {
      position: 'absolute',
      right: 12,
      top: '50%',
      marginTop: -10,
    },
  });

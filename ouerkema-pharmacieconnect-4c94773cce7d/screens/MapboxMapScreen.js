import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather, Entypo } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useForceUpdate } from '../hooks/useForceUpdate';
import logger from '../utils/logger';
import { Input } from '../components/design-system';
import { getColors } from '../utils/colors';
import { API_CONFIG } from '../config/api';

// Mapbox configuration
// Get your free API token from: https://account.mapbox.com/access-tokens/
const MAPBOX_API_TOKEN =
  'pk.eyJ1IjoiamlueDAyIiwiYSI6ImNtbmdlNDNucTAzenoyb3MzN2IxMDR0dmIifQ.Lyv-7qbgd64fajrdF7bZAA'; // Mapbox API Token

// Different Mapbox styles available
const MAPBOX_STYLES = {
  streets: {
    name: 'Streets',
    styleUrl: 'mapbox://styles/mapbox/streets-v11',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`,
  },
  satellite: {
    name: 'Satellite',
    styleUrl: 'mapbox://styles/mapbox/satellite-v9',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`,
  },
  light: {
    name: 'Light',
    styleUrl: 'mapbox://styles/mapbox/light-v10',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`,
  },
  dark: {
    name: 'Dark',
    styleUrl: 'mapbox://styles/mapbox/dark-v10',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`,
  },
};

export default function MapboxMapScreen({ route, navigation }) {
  const routePharmacies = Array.isArray(route?.params?.pharmacies)
    ? route.params.pharmacies
    : null;

  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapPharmacies, setMapPharmacies] = useState(routePharmacies || []);
  const [markerInfo, setMarkerInfo] = useState('');
  const [currentStyle, setCurrentStyle] = useState('streets');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { isRTL } = useLanguage();
  const forceUpdate = useForceUpdate();

  const initialLocation = route?.params?.initialLocation;
  const targetPharmacy = route?.params?.targetPharmacy;

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
      return { latitude: pharmacy.latitude, longitude: pharmacy.longitude };
    }

    return null;
  };

  useEffect(() => {
    // Avoid render loops when route params are missing by only syncing real arrays.
    if (Array.isArray(routePharmacies) && routePharmacies.length > 0) {
      setMapPharmacies(routePharmacies);
    }
  }, [routePharmacies]);

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
          logger.error('MapboxMapScreen', 'Error getting location', error);
        }
      })();
    }
  }, []);

  // Auto-select pharmacy if passed as route param
  useEffect(() => {
    if (targetPharmacy) {
      setSelectedPharmacy(targetPharmacy);
    }
  }, [targetPharmacy]);

  useEffect(() => {
    const fetchNearbyForMap = async () => {
      if (!location?.latitude || !location?.longitude) return;

      try {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.pharmaciesNearby}?lat=${location.latitude}&lon=${location.longitude}&radius_km=20&limit=200`;
        const resp = await fetch(url, { headers: { Accept: 'application/json' } });

        if (!resp.ok) {
          logger.warn('MapboxMapScreen', `Nearby API failed with status ${resp.status}`);
          return;
        }

        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setMapPharmacies(data);
          setMarkerInfo(`${data.length} nearby pharmacies`);
        } else {
          setMarkerInfo('No nearby pharmacies in radius');
        }
      } catch (e) {
        logger.warn('MapboxMapScreen', 'Failed to fetch nearby pharmacies for map', e);
      }
    };

    fetchNearbyForMap();
  }, [location]);

  // Fetch directions from Mapbox Directions API
  const fetchDirections = async (origin, destination) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?access_token=${MAPBOX_API_TOKEN}&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Convert GeoJSON coordinates to MapView format
        const routeCoordinates = route.geometry.coordinates.map((coord) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));

        setRouteCoordinates(routeCoordinates);
        setRouteDistance(route.distance / 1000); // Convert to km
        setRouteDuration(route.duration / 60); // Convert to minutes

        // Animate map to fit route
        if (routeCoordinates.length > 0) {
          mapRef.current?.fitToCoordinates(routeCoordinates, {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
          });
        }
      }
    } catch (error) {
      logger.error('MapboxMapScreen', 'Directions API error:', error);
    }
  };

  // Fetch directions when pharmacy is selected
  useEffect(() => {
    if (selectedPharmacy && location) {
      const destination = getPharmacyCoordinate(selectedPharmacy);
      if (destination) {
        fetchDirections(location, destination);
      }
    } else {
      setRouteCoordinates([]);
      setRouteDistance(null);
      setRouteDuration(null);
    }
  }, [selectedPharmacy, location]);

  const filteredPharmacies = mapPharmacies
    .map((ph) => ({ ...ph, markerCoordinate: getPharmacyCoordinate(ph) }))
    .filter(
      (ph) =>
        ph.markerCoordinate &&
        ((ph.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ph.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          searchTerm.trim() === '')
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
          edgePadding: { top: 120, right: 60, bottom: 140, left: 60 },
          animated: true,
        });
      }, 250);
    }
  }, [filteredPharmacies]);

  // Get current Mapbox style configuration
  const currentMapboxStyle = MAPBOX_STYLES[currentStyle];

  // Handle style change
  const switchMapStyle = (styleKey) => {
    setCurrentStyle(styleKey);
    setShowStyleSelector(false);
  };

  // Check if API token is set
  const isMapboxConfigured = MAPBOX_API_TOKEN && MAPBOX_API_TOKEN !== 'YOUR_MAPBOX_API_TOKEN_HERE';

  // Force re-render when RTL changes for instant updates
  useEffect(() => {
    forceUpdate();
  }, [isRTL, forceUpdate, currentStyle]);

  // Graceful back handling: close overlays first, then return to home tab
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
      if (navigation?.navigate) {
        navigation.navigate('Accueil');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [showStyleSelector, selectedPharmacy, navigation]);

  if (!isMapboxConfigured) {
    return (
      <View style={styles.loaderContainer}>
        <Entypo name="warning" size={48} color="#ff9800" />
        <Text style={[styles.warningText, { color: isDarkMode ? '#fff' : '#000' }]}>
          {t('map.mapboxTokenRequired', 'Mapbox API Token Required')}
        </Text>
        <Text style={[styles.instructionText, { color: isDarkMode ? '#ccc' : '#666' }]}>
          {t(
            'map.mapboxInstructions',
            'Please get your free API token from mapbox.com and replace YOUR_MAPBOX_API_TOKEN_HERE in MapboxMapScreen.js'
          )}
        </Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#000' }]}>
          {t('map.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map sits at the bottom of the stack */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        mapType="none" // Disable default tiles to use custom ones
        ref={mapRef}
      >
        {/* Mapbox Custom Tiles */}
        {isMapboxConfigured && (
          <UrlTile
            urlTemplate={currentMapboxStyle.urlTemplate}
            maximumZ={18}
            shouldReplaceMapContent={true}
          />
        )}

        {/* Pharmacy Markers */}
        {filteredPharmacies.map((ph) => (
          <Marker
            key={ph.id}
            coordinate={ph.markerCoordinate}
            title={ph.name}
            description={ph.address}
            pinColor={ph.isOpen ? '#4CAF50' : '#f44336'}
            onPress={() => setSelectedPharmacy(ph)}
          />
        ))}

        {/* User Location Marker */}
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={t('map.userLocation')}
          pinColor="#2196F3"
        />

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeColor="#2196F3" strokeWidth={3} />
        )}
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
                marginLeft: isRTL ? 0 : 10,
                marginRight: isRTL ? 10 : 0,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}
          >
            {t('map.title')} - Mapbox
          </Text>
        </View>

        {markerInfo ? (
          <View style={styles.markerInfoBadge}>
            <Text style={styles.markerInfoText}>{markerInfo}</Text>
          </View>
        ) : null}

        <View style={styles.searchContainer} pointerEvents="auto">
          <Input
            placeholder={t('map.searchPlaceholder', 'Search a place...')}
            value={searchTerm}
            onChangeText={setSearchTerm}
            isDarkMode={isDarkMode}
            isRTL={isRTL}
            icon={<Feather name="search" size={20} color={getColors(isDarkMode).textSecondary} />}
            accessibilityLabel={t('home.searchAccessibility', 'Search for pharmacies')}
          />
        </View>

        {/* Style Selector Button (icon only to hide visible label) */}
        <TouchableOpacity
          style={styles.styleButton}
          onPress={() => setShowStyleSelector(!showStyleSelector)}
          accessibilityLabel={t('map.changeMapStyle', 'Change map style')}
        >
          <Feather name="layers" size={18} color="white" />
        </TouchableOpacity>

        {/* Style Selector Dropdown */}
        {showStyleSelector && (
          <View style={styles.styleSelector}>
            {Object.entries(MAPBOX_STYLES).map(([key, style]) => (
              <TouchableOpacity
                key={key}
                style={[styles.styleOption, currentStyle === key && styles.selectedStyle]}
                onPress={() => switchMapStyle(key)}
                accessibilityLabel={style.name}
                accessibilityRole="radio"
                accessibilityState={{ selected: currentStyle === key }}
              >
                <Text
                  style={[styles.styleOptionText, currentStyle === key && styles.selectedStyleText]}
                >
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Route Info Card */}
        {selectedPharmacy && routeDistance && routeDuration && (
          <View style={[styles.routeCard, { backgroundColor: isDarkMode ? '#1e1e1e' : 'white' }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedPharmacy(null)}
              accessibilityLabel={t('map.closeRoute', 'Close route')}
              accessibilityRole="button"
            >
              <Feather name="x" size={24} color={isDarkMode ? '#fff' : '#333'} />
            </TouchableOpacity>
            <Text style={[styles.pharmacyName, { color: isDarkMode ? '#fff' : '#333' }]}>
              {selectedPharmacy.name}
            </Text>
            <Text style={[styles.routeInfo, { color: isDarkMode ? '#ccc' : '#666' }]}>
              {t('map.getDirections')}: {routeDistance.toFixed(1)} km • {Math.round(routeDuration)}{' '}
              min
            </Text>
            <Text style={[styles.addressText, { color: isDarkMode ? '#aaa' : '#888' }]}>
              {selectedPharmacy.address}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedPharmacy(null)}
              style={styles.closeTextButton}
              accessibilityLabel={t('common.close', 'Close')}
              accessibilityRole="button"
            >
              <Text style={[styles.closeText, { color: isDarkMode ? '#fff' : '#007ACC' }]}>
                {t('common.close', 'Close')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { marginTop: 16, fontSize: 16 },
  warningText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  titleContainer: {
    flexDirection: 'row',
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
    zIndex: 20,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  searchContainer: {
    position: 'absolute',
    top: 90,
    left: 10,
    right: 10,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: { flex: 1, fontSize: 16, color: '#333' },
  styleButton: {
    position: 'absolute',
    top: 150,
    right: 10,
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  styleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    maxWidth: 120,
  },
  styleSelector: {
    position: 'absolute',
    top: 190,
    right: 10,
    zIndex: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 8,
  },
  markerInfoBadge: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
    zIndex: 45,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markerInfoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  styleOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedStyle: {
    backgroundColor: '#ffe3e3',
  },
  styleOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedStyleText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  routeCard: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
  },
  closeTextButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  routeInfo: {
    fontSize: 14,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather, Entypo } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useForceUpdate } from '../hooks/useForceUpdate';

// Tile provider configurations - Choose the one that works best for Tunisia
const TILE_PROVIDERS = {
  osmFrance: {
    name: 'OpenStreetMap France',
    urlTemplate: 'https://tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    maxZoom: 20,
    attribution: '© OpenStreetMap France'
  },
  cartoDB: {
    name: 'CartoDB Positron',
    urlTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    maxZoom: 18,
    attribution: '© CartoDB, © OpenStreetMap'
  },
  cartoDBDark: {
    name: 'CartoDB Dark Matter',
    urlTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    maxZoom: 18,
    attribution: '© CartoDB, © OpenStreetMap'
  },
  stamen: {
    name: 'Stamen Terrain',
    urlTemplate: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png',
    maxZoom: 18,
    attribution: '© Stamen Design, © OpenStreetMap'
  },
  openCycleMap: {
    name: 'OpenCycleMap',
    urlTemplate: 'https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=YOUR_API_KEY',
    maxZoom: 18,
    attribution: '© Thunderforest, © OpenStreetMap'
  }
};

export default function MapScreen({ route }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTileProvider, setCurrentTileProvider] = useState('osmFrance'); // Default to OSM France
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { isRTL } = useLanguage();
  const forceUpdate = useForceUpdate();

  const pharmacies = route?.params?.pharmacies || [];
  const initialLocation = route?.params?.initialLocation;

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
          console.error(error);
        }
      })();
    }
  }, []);

  // Show all pharmacies that have valid coordinates; search bar is used for place search
  const filteredPharmacies = pharmacies
    .filter(ph => ph?.coords &&
      typeof ph.coords.latitude === 'number' &&
      typeof ph.coords.longitude === 'number'
    );

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
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': isRTL ? 'ar' : 'fr',
        }
      });
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const { lat, lon } = data[0];
        setLocation(prev => ({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          // Preserve previous deltas if present
          latitudeDelta: prev?.latitudeDelta ?? 0.05,
          longitudeDelta: prev?.longitudeDelta ?? 0.05,
        }));
      }
    } catch (e) {
      console.warn('Place search failed', e);
    }
  };

  // Force re-render when RTL changes for instant updates
  useEffect(() => {
    forceUpdate();
  }, [isRTL, forceUpdate, currentTileProvider]);

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
          {t('map.title')}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={handlePlaceSearch}>
          <Feather name="search" size={20} color="#888" style={{ marginRight: 8 }} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={t('map.searchPlacePlaceholder', 'Search a place...')}
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handlePlaceSearch}
          returnKeyType="search"
        />
      </View>

      {/* Tile Provider Selector Button (icon only to hide provider name) */}
      <TouchableOpacity 
        style={styles.providerButton}
        onPress={() => setShowProviderSelector(!showProviderSelector)}
        accessibilityLabel={t('map.changeTileProvider', 'Change tile provider')}
      >
        <Feather name="layers" size={18} color="white" />
        {/* Intentionally hide provider name text to remove visible attribution label */}
      </TouchableOpacity>

      {/* Provider Selector Dropdown */}
      {showProviderSelector && (
        <View style={styles.providerSelector}>
          {Object.entries(TILE_PROVIDERS).map(([key, provider]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.providerOption,
                currentTileProvider === key && styles.selectedProvider
              ]}
              onPress={() => switchTileProvider(key)}
            >
              <Text style={[
                styles.providerOptionText,
                currentTileProvider === key && styles.selectedProviderText
              ]}>
                {provider.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <MapView
        style={{ flex: 1 }}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* ✅ Configurable tile providers that work well in Tunisia */}
        <UrlTile
          urlTemplate={currentProvider.urlTemplate}
          maximumZ={currentProvider.maxZoom}
          shouldReplaceMapContent={true}
        />

        {/* ✅ علامات الصيدليات */}
        {filteredPharmacies.map(ph => (
          <Marker
            key={ph.id}
            coordinate={ph.coords}
            title={ph.name}
            description={ph.address}
          />
        ))}

        {/* ✅ موقع المستخدم */}
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={t('map.userLocation')}
          pinColor="blue"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
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
    zIndex: 15,
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
  providerButton: {
    position: 'absolute',
    top: 150,
    right: 10,
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    // Hide the green attribution label styling while keeping the button functional
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  providerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    maxWidth: 120,
  },
  providerSelector: {
    position: 'absolute',
    top: 190,
    right: 10,
    zIndex: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 8,
  },
  providerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedProvider: {
    backgroundColor: '#e3f2fd',
  },
  providerOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedProviderText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
});

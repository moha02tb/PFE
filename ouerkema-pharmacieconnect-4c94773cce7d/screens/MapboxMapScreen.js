import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, TextInput, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather, Entypo } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useForceUpdate } from '../hooks/useForceUpdate';

// Mapbox configuration
// Get your free API token from: https://account.mapbox.com/access-tokens/
const MAPBOX_API_TOKEN = 'YOUR_MAPBOX_API_TOKEN_HERE'; // Replace with your actual token

// Different Mapbox styles available
const MAPBOX_STYLES = {
  streets: {
    name: 'Streets',
    styleUrl: 'mapbox://styles/mapbox/streets-v11',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`
  },
  satellite: {
    name: 'Satellite',
    styleUrl: 'mapbox://styles/mapbox/satellite-v9',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`
  },
  light: {
    name: 'Light',
    styleUrl: 'mapbox://styles/mapbox/light-v10',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`
  },
  dark: {
    name: 'Dark',
    styleUrl: 'mapbox://styles/mapbox/dark-v10',
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_API_TOKEN}`
  }
};

export default function MapboxMapScreen({ route }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStyle, setCurrentStyle] = useState('streets');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
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

  const filteredPharmacies = pharmacies.filter(ph =>
    ph.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ph.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (!isMapboxConfigured) {
    return (
      <View style={styles.loaderContainer}>
        <Entypo name="warning" size={48} color="#ff9800" />
        <Text style={[styles.warningText, { color: isDarkMode ? '#fff' : '#000' }]}>
          {t('map.mapboxTokenRequired', 'Mapbox API Token Required')}
        </Text>
        <Text style={[styles.instructionText, { color: isDarkMode ? '#ccc' : '#666' }]}>
          {t('map.mapboxInstructions', 'Please get your free API token from mapbox.com and replace YOUR_MAPBOX_API_TOKEN_HERE in MapboxMapScreen.js')}
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

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Style Selector Button (icon only to hide visible label) */}
      <TouchableOpacity 
        style={styles.styleButton}
        onPress={() => setShowStyleSelector(!showStyleSelector)}
        accessibilityLabel={t('map.changeMapStyle', 'Change map style')}
      >
        <Feather name="layers" size={18} color="white" />
        {/* Intentionally hide style name text to remove visible label */}
      </TouchableOpacity>

      {/* Style Selector Dropdown */}
      {showStyleSelector && (
        <View style={styles.styleSelector}>
          {Object.entries(MAPBOX_STYLES).map(([key, style]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.styleOption,
                currentStyle === key && styles.selectedStyle
              ]}
              onPress={() => switchMapStyle(key)}
            >
              <Text style={[
                styles.styleOptionText,
                currentStyle === key && styles.selectedStyleText
              ]}>
                {style.name}
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
        mapType="none" // Disable default tiles to use custom ones
      >
        {/* Mapbox Custom Tiles */}
        {isMapboxConfigured && (
          <MapView.UrlTile
            urlTemplate={currentMapboxStyle.urlTemplate}
            maximumZ={18}
            shouldReplaceMapContent={true}
          />
        )}

        {/* Pharmacy Markers */}
        {filteredPharmacies.map(ph => (
          <Marker
            key={ph.id}
            coordinate={ph.coords}
            title={ph.name}
            description={ph.address}
            pinColor={ph.isOpen ? "green" : "red"}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20 
  },
  loadingText: { marginTop: 16, fontSize: 16 },
  warningText: { 
    marginTop: 16, 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center'
  },
  instructionText: { 
    marginTop: 10, 
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
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
});
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../utils/theme';
import AppModal from './design-system/Modal';
import AppText from './design-system/Text';
import Input from './design-system/Input';
import { POPULAR_GOVERNORATES } from '../constants/locations';

const normalizeSearchValue = (value) =>
  `${value || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const isSubsequenceMatch = (candidate, term) => {
  if (!term) {
    return true;
  }

  let termIndex = 0;
  for (const character of candidate) {
    if (character === term[termIndex]) {
      termIndex += 1;
      if (termIndex === term.length) {
        return true;
      }
    }
  }

  return false;
};

const matchesLocationSearch = (candidate, term) => {
  const normalizedCandidate = normalizeSearchValue(candidate);
  const normalizedTerm = normalizeSearchValue(term);

  if (!normalizedTerm) {
    return true;
  }

  return (
    normalizedCandidate.includes(normalizedTerm) ||
    isSubsequenceMatch(normalizedCandidate, normalizedTerm)
  );
};

export default function LocationPicker({
  visible,
  onClose,
  allLocations = [],
  recentLocations = [],
  selectedLocation,
  onSelectLocation,
}) {
  const { t } = useTranslation();
  const { colors, radius } = useAppTheme();
  const [searchText, setSearchText] = useState('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    searchBar: {
      marginBottom: 20,
    },
    sectionHeader: {
      marginBottom: 12,
      marginTop: 20,
    },
    sectionTitle: {
      marginBottom: 8,
    },
    sectionContent: {
      marginBottom: 16,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.full,
      backgroundColor: colors.chip,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '500',
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: radius.lg,
      marginBottom: 8,
      backgroundColor: colors.surfaceSecondary,
    },
    listItemActive: {
      backgroundColor: colors.primary,
    },
    listItemIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
    },
    listItemIconActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    listing: {
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    emptyState: {
      paddingVertical: 40,
      alignItems: 'center',
    },
  });

  // Filter locations based on search text
  const filteredLocations = useMemo(() => {
    if (!searchText.trim()) {
      return allLocations;
    }
    return allLocations.filter((loc) => {
      return (
        matchesLocationSearch(loc.label, searchText) ||
        matchesLocationSearch(loc.governorate, searchText)
      );
    });
  }, [searchText, allLocations]);

  // Get popular locations that aren't filtered out
  const visiblePopularLocations = POPULAR_GOVERNORATES.filter((gov) =>
    matchesLocationSearch(gov, searchText)
  );

  const recentLocationOptions = useMemo(() => {
    return recentLocations
      .map((recentLabel) => allLocations.find((option) => option.value === recentLabel))
      .filter(Boolean);
  }, [allLocations, recentLocations]);

  const handleSelectLocation = (location) => {
    onSelectLocation(location?.value || null);
    setSearchText('');
    onClose();
  };

  const handleSubmitTypedLocation = () => {
    const typedLocation = searchText.trim();
    if (!typedLocation) {
      return;
    }

    onSelectLocation(typedLocation);
    setSearchText('');
    onClose();
  };

  const renderChip = (governorate) => (
    <Pressable
      key={governorate}
      style={[
        styles.chip,
        selectedLocation === governorate && styles.chipActive,
      ]}
      onPress={() => handleSelectLocation(governorate)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={governorate}
    >
      <Feather
        name="map-pin"
        size={14}
        color={selectedLocation === governorate ? '#FFFFFF' : colors.primary}
      />
      <AppText
        variant="labelMedium"
        color={selectedLocation === governorate ? '#FFFFFF' : colors.text}
      >
        {governorate}
      </AppText>
      {selectedLocation === governorate && (
        <Feather name="check" size={14} color="#FFFFFF" />
      )}
    </Pressable>
  );

  const renderLocationItem = (locationOption) => {
    const locationLabel = locationOption?.label || t('home.allLocations', 'All locations');
    const locationMeta = locationOption?.type === 'city' ? locationOption.governorate : null;
    const locationValue = locationOption?.value || null;
    const key = locationValue || 'all-locations';
    const isActive = selectedLocation === locationValue;

    return (
      <Pressable
        key={key}
        style={[
          styles.listItem,
          isActive && styles.listItemActive,
        ]}
        onPress={() => handleSelectLocation(locationOption)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={locationLabel}
      >
        <View
          style={[
            styles.listItemIcon,
            isActive && styles.listItemIconActive,
          ]}
        >
          <Feather
            name="map-pin"
            size={16}
            color={isActive ? '#FFFFFF' : colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppText
            variant="bodyMedium"
            color={isActive ? '#FFFFFF' : colors.text}
          >
            {locationLabel}
          </AppText>
          {locationMeta ? (
            <AppText
              variant="labelSmall"
              color={isActive ? 'rgba(255,255,255,0.82)' : colors.textSecondary}
              style={{ marginTop: 2 }}
            >
              {locationMeta}
            </AppText>
          ) : null}
        </View>
        {isActive && (
          <Feather name="check" size={18} color="#FFFFFF" />
        )}
      </Pressable>
    );
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={t('home.selectLocation', 'Select location')}
      fullHeight
    >
      <View style={styles.container}>
        <Input
          placeholder={t('home.searchLocation', 'Search city or governorate...')}
          value={searchText}
          onChangeText={setSearchText}
          icon={<Feather name="search" size={18} color={colors.textSecondary} />}
          style={styles.searchBar}
          clearButtonMode="while-editing"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.listing}
        >
          {searchText.trim() ? (
            <View style={styles.sectionContent}>
              <Pressable
                style={styles.listItem}
                onPress={handleSubmitTypedLocation}
                accessible
                accessibilityRole="button"
                accessibilityLabel={searchText.trim()}
              >
                <View style={styles.listItemIcon}>
                  <Feather
                    name="search"
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium" color={colors.text}>
                    {t('home.useSearchedPlace', 'Use "{{place}}"', {
                      place: searchText.trim(),
                    })}
                  </AppText>
                  <AppText
                    variant="labelSmall"
                    color={colors.textSecondary}
                    style={{ marginTop: 2 }}
                  >
                    {t('home.useSearchedPlaceHint', 'Search pharmacies near this place')}
                  </AppText>
                </View>
              </Pressable>
            </View>
          ) : null}

          {/* "All Locations" option */}
          {!searchText.trim() && (
            <>
              {renderLocationItem(null)}
              <AppText
                variant="labelSmall"
                color={colors.textSecondary}
                style={{ marginTop: 2, marginBottom: 16, marginLeft: 16 }}
              >
                {t('home.showsAllLocations', 'Shows all pharmacies')}
              </AppText>
              <View style={styles.divider} />
            </>
          )}

          {/* Popular Governorates */}
          {visiblePopularLocations.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <AppText
                  variant="labelMedium"
                  color={colors.textSecondary}
                  style={styles.sectionTitle}
                >
                {t('home.popular', 'Popular')}
              </AppText>
            </View>
            <View style={styles.chipContainer}>
              {visiblePopularLocations.map(renderChip)}
              </View>
            </>
          )}

          {/* Recently Viewed */}
          {recentLocations.length > 0 && !searchText.trim() && (
            <>
              <View style={styles.sectionHeader}>
                <AppText
                  variant="labelMedium"
                  color={colors.textSecondary}
                  style={styles.sectionTitle}
                >
                  {t('home.recentlyViewed', 'Recently viewed')}
                </AppText>
              </View>
              <View style={styles.sectionContent}>
                {recentLocationOptions.map(renderLocationItem)}
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* All Locations */}
          <View style={styles.sectionHeader}>
            <AppText
              variant="labelMedium"
              color={colors.textSecondary}
              style={styles.sectionTitle}
            >
              {t('home.allGovernorate', 'All areas')}
            </AppText>
          </View>

          {filteredLocations.length > 0 ? (
            <View>
              {filteredLocations.map(renderLocationItem)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="map-search-outline"
                size={48}
                color={colors.textSecondary}
              />
              <AppText
                variant="bodyMedium"
                color={colors.textSecondary}
                style={{ marginTop: 12 }}
              >
                {t('home.noLocationFound', 'No location found')}
              </AppText>
            </View>
          )}
        </ScrollView>
      </View>
    </AppModal>
  );
}

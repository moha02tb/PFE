import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Platform, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { fetchCalendarPharmaciesFromAPI } from '../utils/pharmacyDataLoader';
import logger from '../utils/logger';
import {
  AppButton,
  AppCard,
  AppText,
  EmptyState,
  PharmacyListItem,
  SectionTitle,
} from '../components/design-system';
import PharmacyDetailsModal from '../components/PharmacyDetailsModal';
import { useRating } from './RatingContext';
import { useAppTheme } from '../utils/theme';

export default function CalendarScreen({ navigation }) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { isRTL, getCurrentLanguageKey } = useLanguage();
  const { getRating } = useRating();
  const insets = useSafeAreaInsets();
  const { colors, radius, shadows } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, radius, shadows, isRTL, insets.top), [colors, radius, shadows, isRTL, insets.top]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCalendar = async () => {
      setLoading(true);
      try {
        const data = await fetchCalendarPharmaciesFromAPI(selectedDate);
        if (isMounted) {
          setPharmacies(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        logger.error('CalendarScreen', 'Error loading pharmacies data', error);
        if (isMounted) {
          setPharmacies([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCalendar();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, t, getCurrentLanguageKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchCalendarPharmaciesFromAPI(selectedDate);
      setPharmacies(Array.isArray(data) ? data : []);
    } finally {
      setRefreshing(false);
    }
  };

  const displayDate = (date) => {
    const localeMap = { fr: 'fr-FR', en: 'en-US', ar: 'ar-SA' };
    try {
      return date.toLocaleDateString(localeMap[getCurrentLanguageKey()] || 'fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date.toDateString();
    }
  };

  const openDirections = async (item) => {
    if (item.latitude == null || item.longitude == null) {
      setSelectedPharmacy(item);
      setDetailsModalVisible(true);
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('CalendarScreen', 'Location permission denied', { status });
        if (navigation?.jumpTo) navigation.jumpTo('Carte', { pharmacies, targetPharmacy: item });
        else navigation.navigate('Carte', { pharmacies, targetPharmacy: item });
        return;
      }

      // Try to get current position with timeout
      let position;
      try {
        position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Location request timeout')), 15000)
          ),
        ]);
      } catch (positionError) {
        // Fallback to last known position if current request fails
        logger.warn('CalendarScreen', 'getCurrentPosition failed, trying last known', positionError);
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (!lastKnown?.coords) {
          throw new Error('Could not determine user location');
        }
        position = lastKnown;
      }

      const coords = position?.coords;
      if (!coords?.latitude || !coords?.longitude) {
        throw new Error('Invalid coordinates received');
      }

      const params = { pharmacies, initialLocation: coords, targetPharmacy: item };
      if (navigation?.jumpTo) navigation.jumpTo('Carte', params);
      else navigation.navigate('Carte', params);
    } catch (error) {
      logger.error('CalendarScreen', 'Error in openDirections', error);
      // Navigate to map anyway without user's current location
      if (navigation?.jumpTo) navigation.jumpTo('Carte', { pharmacies, targetPharmacy: item });
      else navigation.navigate('Carte', { pharmacies, targetPharmacy: item });
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={pharmacies}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            <SectionTitle
              eyebrow={t('calendar.title', 'Calendar')}
              title={t('calendar.onDutyPharmacies', 'On-duty pharmacies')}
              subtitle={t('calendar.subtitle', 'Browse pharmacies available for the selected day')}
            />

            <AppCard style={styles.dateCard}>
              <View style={styles.dateRow}>
                <View style={styles.dateIcon}>
                  <Feather name="calendar" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="labelMedium" color={colors.textSecondary}>
                    {t('calendar.selectDate', 'Select date')}
                  </AppText>
                  <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.8}>
                    <AppText variant="headerSmall" style={{ marginTop: 4 }}>
                      {displayDate(selectedDate)}
                    </AppText>
                  </TouchableOpacity>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={22} color={colors.iconMuted} />
              </View>
              <AppButton
                title={t('calendar.today', 'Today')}
                onPress={() => setSelectedDate(new Date())}
                variant="tonal"
                style={{ marginTop: 12 }}
                fullWidth
              />
            </AppCard>
            {showPicker ? (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (date) setSelectedDate(date);
                  if (Platform.OS !== 'ios') setShowPicker(false);
                }}
                maximumDate={new Date(new Date().getFullYear(), 11, 31)}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="calendar-outline"
              title={t('calendar.noEventsToday', 'No pharmacies found for this day')}
              message={t('calendar.emptyMessage', 'Try another date or refresh the schedule.')}
            />
          )
        }
        renderItem={({ item }) => (
          <PharmacyListItem
            item={item}
            distanceLabel={item.shiftType || item.openHours || t('calendar.schedulePending', 'Hours pending')}
            rating={getRating(item.id)}
            favorite={false}
            onToggleFavorite={() => {}}
            onOpenDetails={() => {
              setSelectedPharmacy(item);
              setDetailsModalVisible(true);
            }}
            onCall={() => {
              if (item.phone) {
                Linking.openURL(`tel:${(item.phone || '').replace(/\s+/g, '')}`);
              }
            }}
            onDirections={() => openDirections(item)}
          />
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <PharmacyDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        pharmacy={selectedPharmacy}
        isDarkMode={isDarkMode}
        isRTL={isRTL}
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
      paddingBottom: 130,
    },
    dateCard: {
      marginBottom: 18,
    },
    dateRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
    },
    dateIcon: {
      width: 46,
      height: 46,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
    },
  });

import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
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
  EntranceView,
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
  const currentLanguageKey = getCurrentLanguageKey();
  const { getRating } = useRating();
  const insets = useSafeAreaInsets();
  const { colors, radius, shadows } = useAppTheme();
  const styles = useMemo(
    () => createStyles(colors, radius, shadows, isRTL, insets.top),
    [colors, radius, shadows, isRTL, insets.top]
  );

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
  }, [selectedDate, currentLanguageKey]);

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
      return date.toLocaleDateString(localeMap[currentLanguageKey] || 'fr-FR', {
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
        logger.warn(
          'CalendarScreen',
          'getCurrentPosition failed, trying last known',
          positionError
        );
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
            <EntranceView delay={0} distance={18}>
              <View style={styles.heroCard}>
                <View style={styles.heroPanel} />
                <View style={styles.heroGridLine} />
                <View style={styles.heroBadge}>
                  <Feather name="calendar" size={16} color="#D9F5FF" />
                  <AppText variant="labelMedium" color={colors.textInverse}>
                    {t('calendar.title', 'Calendar')}
                  </AppText>
                </View>
                <AppText variant="headerLarge" color={colors.textInverse}>
                  {t('calendar.onDutyPharmacies', 'On-duty pharmacies')}
                </AppText>
                <AppText
                  variant="bodyMedium"
                  color="rgba(247,251,255,0.84)"
                  style={{ marginTop: 8 }}
                >
                  {t('calendar.subtitle', 'Browse pharmacies available for the selected day')}
                </AppText>
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <AppText variant="headerMedium" color={colors.textInverse} align="center">
                      {pharmacies.length}
                    </AppText>
                    <AppText variant="labelSmall" color="rgba(247,251,255,0.72)" align="center">
                      {t('calendar.results', 'Results')}
                    </AppText>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroStat}>
                    <AppText
                      variant="labelLarge"
                      color={colors.textInverse}
                      align="center"
                      numberOfLines={1}
                    >
                      {displayDate(selectedDate).split(' ')[0]}
                    </AppText>
                    <AppText variant="labelSmall" color="rgba(247,251,255,0.72)" align="center">
                      {t('calendar.selectedDay', 'Selected day')}
                    </AppText>
                  </View>
                </View>
              </View>
            </EntranceView>

            <EntranceView delay={90} distance={12}>
              <SectionTitle
                eyebrow={t('calendar.planning', 'Planning')}
                title={t('calendar.chooseDate', 'Choose a date')}
                subtitle={t(
                  'calendar.chooseDateSubtitle',
                  'The list updates as soon as you select a schedule date'
                )}
              />
            </EntranceView>

            <EntranceView delay={140} distance={12}>
              <AppCard style={styles.dateCard} contentStyle={{ padding: 18 }}>
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
            </EntranceView>
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
        renderItem={({ item, index }) => (
          <PharmacyListItem
            item={item}
            distanceLabel={
              item.shiftType || item.openHours || t('calendar.schedulePending', 'Hours pending')
            }
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
            animationIndex={index}
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
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: Math.max(topInset + 24, 96),
      paddingBottom: 130,
    },
    dateCard: {
      marginBottom: 18,
    },
    heroCard: {
      backgroundColor: colors.primary,
      borderRadius: radius.xl,
      padding: 24,
      marginBottom: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(247,251,255,0.12)',
      ...shadows.floating,
    },
    heroPanel: {
      position: 'absolute',
      width: 154,
      height: 220,
      borderRadius: radius.xxl,
      backgroundColor: 'rgba(247,251,255,0.1)',
      top: -46,
      right: isRTL ? undefined : -54,
      left: isRTL ? -54 : undefined,
      transform: [{ rotate: isRTL ? '-14deg' : '14deg' }],
    },
    heroGridLine: {
      position: 'absolute',
      height: 1,
      left: 24,
      right: 24,
      bottom: 104,
      backgroundColor: 'rgba(247,251,255,0.12)',
    },
    heroBadge: {
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(247,251,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(247,251,255,0.12)',
      marginBottom: 16,
    },
    heroStats: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginTop: 20,
      backgroundColor: 'rgba(5, 22, 46, 0.22)',
      borderRadius: radius.lg,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(247,251,255,0.1)',
    },
    heroStat: {
      flex: 1,
      alignItems: 'center',
    },
    heroDivider: {
      width: 1,
      height: 32,
      backgroundColor: 'rgba(247,251,255,0.18)',
    },
    dateRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
    },
    dateIcon: {
      width: 46,
      height: 46,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

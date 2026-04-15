import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { useNotifications } from './NotificationContext';
import { useLanguage } from './LanguageContext';
import { useFavorites } from './FavoritesContext';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useDebounce } from '../hooks/useDebounce';
import { loadPharmacies, loadPharmaciesAsync, filterPharmacies } from '../utils/pharmacyDataLoader';
import logger from '../utils/logger';
import {
  AppButton,
  AppCard,
  AppText,
  EmptyState,
  LoadingSkeleton,
  PharmacyListItem,
  SearchBar,
  SectionTitle,
} from '../components/design-system';
import PharmacyDetailsModal from '../components/PharmacyDetailsModal';
import { useRating } from './RatingContext';
import { useAppTheme } from '../utils/theme';

export default function HomeScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, radius, shadows } = useAppTheme();
  const { sendPharmacyReminder, notificationsEnabled } = useNotifications();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { getRating } = useRating();
  const { copyToClipboard } = useCopyToClipboard(() => {}, (error) => {
    logger.error('HomeScreen', 'Copy error', error);
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const filteredPharmacies = filterPharmacies(pharmacies, debouncedSearchTerm);
  const openCount = pharmacies.filter((item) => item.isOpen).length;
  const dutyCount = pharmacies.filter((item) => item.emergency).length;
  const styles = useMemo(() => createStyles(colors, radius, shadows, isRTL, insets.top), [colors, radius, shadows, isRTL, insets.top]);

  const loadData = async (coords = userLocation) => {
    try {
      const data = await loadPharmaciesAsync(t, true, coords);
      setPharmacies(data);
    } catch (error) {
      logger.error('HomeScreen', 'Error loading pharmacies data', error);
      setPharmacies(loadPharmacies(t));
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation(current.coords);
          await loadData(current.coords);
          return;
        }
      } catch (error) {
        logger.warn('HomeScreen', 'Location bootstrap failed', error);
      }
      await loadData(null);
    };

    bootstrap();
  }, [t]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const goToUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (navigation?.jumpTo) navigation.jumpTo('Carte', { pharmacies });
        else navigation.navigate?.('Carte', { pharmacies });
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setUserLocation(coords);
      await loadData(coords);
      const nextPharmacies = await loadPharmaciesAsync(t, true, coords).catch(() => pharmacies);
      setPharmacies(nextPharmacies);
      const params = { pharmacies: nextPharmacies, initialLocation: coords };
      if (navigation?.jumpTo) navigation.jumpTo('Carte', params);
      else navigation.navigate('Carte', params);
    } catch (error) {
      logger.error('HomeScreen', 'goToUserLocation failed', error);
      if (navigation?.jumpTo) navigation.jumpTo('Carte', { pharmacies });
      else navigation.navigate('Carte', { pharmacies });
    }
  };

  const goToDirections = async (item) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (navigation?.jumpTo) navigation.jumpTo('Carte', { pharmacies, targetPharmacy: item });
        else navigation.navigate('Carte', { pharmacies, targetPharmacy: item });
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const params = { pharmacies, initialLocation: coords, targetPharmacy: item };
      if (navigation?.jumpTo) navigation.jumpTo('Carte', params);
      else navigation.navigate('Carte', params);
    } catch (error) {
      logger.warn('HomeScreen', 'Directions location failed', error);
      if (navigation?.jumpTo) navigation.jumpTo('Carte', { pharmacies, targetPharmacy: item });
      else navigation.navigate('Carte', { pharmacies, targetPharmacy: item });
    }
  };

  const callPhone = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch((error) =>
      logger.error('HomeScreen', 'Call failed', error)
    );
  };

  const formatDistance = (item) => {
    if (typeof item.distanceKm !== 'number') return t('home.distanceUnavailable', 'Location pending');
    return item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} m` : `${item.distanceKm.toFixed(1)} km`;
  };

  const openPharmacyDetails = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setDetailsModalVisible(true);
  };

  const renderHeader = () => (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroOrbOne} />
        <View style={styles.heroOrbTwo} />
        <View style={styles.heroTop}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="shield-plus-outline" size={16} color="#D9F5FF" />
            <AppText variant="labelMedium" color="#FFFFFF">
              {t('home.trustedNetwork', 'Trusted pharmacy network')}
            </AppText>
          </View>
          <TouchableOpacity
            style={styles.heroAction}
            onPress={() => navigation.navigate('Chatbot')}
            accessibilityRole="button"
            accessibilityLabel={t('chatbot.bubbleLabel', 'Open first aid assistant')}
          >
            <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <AppText variant="headerLarge" color="#FFFFFF">
          {t('home.nearbyPharmacies', 'Nearby pharmacies')}
        </AppText>
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.84)" style={{ marginTop: 8 }}>
          {t(
            'home.heroSubtitle',
            'Search, call, and navigate to nearby pharmacies from one calm and reliable dashboard.'
          )}
        </AppText>

        <View style={styles.metricsRow}>
          {[
            { value: filteredPharmacies.length, label: t('home.results', 'Results') },
            { value: openCount, label: t('home.openNow', 'Open now') },
            { value: dutyCount, label: t('home.onDuty', 'On duty') },
          ].map((metric) => (
            <View key={metric.label} style={styles.metricCard}>
              <AppText variant="headerMedium" color="#FFFFFF" align="center">
                {metric.value}
              </AppText>
              <AppText variant="labelSmall" color="rgba(255,255,255,0.72)" align="center">
                {metric.label}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <AppCard style={{ marginBottom: 18 }}>
        <SearchBar
          placeholder={t('home.searchPlacePlaceholder', 'Search by pharmacy or area')}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <View style={styles.quickActions}>
          <AppButton
            title={t('home.refresh', 'Refresh')}
            onPress={onRefresh}
            variant="outlined"
            style={{ flex: 1 }}
            icon={<Feather name="refresh-cw" size={16} color={colors.primary} />}
          />
          <AppButton
            title={t('home.myLocation', 'My location')}
            onPress={goToUserLocation}
            style={{ flex: 1.1 }}
            icon={<Feather name="navigation" size={16} color="#FFFFFF" />}
          />
        </View>
      </AppCard>

      <SectionTitle
        eyebrow={t('home.careDirectory', 'Care directory')}
        title={t('home.availablePharmacies', 'Available pharmacies')}
        subtitle={t('home.resultsSubtitle', 'Tap a pharmacy for actions, details, and directions')}
        aside={
          <View style={styles.countPill}>
            <AppText variant="labelLarge" color={colors.primary}>
              {filteredPharmacies.length}
            </AppText>
          </View>
        }
      />
    </View>
  );

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => item.toString()}
          ListHeaderComponent={renderHeader()}
          renderItem={() => <LoadingSkeleton height={188} borderRadius={24} style={{ marginBottom: 14 }} />}
          contentContainerStyle={styles.content}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPharmacies}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => {
          const rating = getRating(item.id);
          const favorite = isFavorite(item.id);
          return (
            <PharmacyListItem
              item={item}
              distanceLabel={`${item.governorate || t('home.localCare', 'Local care')} · ${formatDistance(item)}`}
              rating={rating}
              favorite={favorite}
              onToggleFavorite={() => toggleFavorite(item.id)}
              onOpenDetails={() => openPharmacyDetails(item)}
              onCall={() => {
                callPhone(item.phone);
                if (notificationsEnabled) {
                  sendPharmacyReminder(item.name, `${item.name} - ${item.address}`);
                }
              }}
              onDirections={() => goToDirections(item)}
            />
          );
        }}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={t('home.noPharmacies', 'No pharmacies found')}
            message={t('home.noPharmaciesMessage', 'Try another keyword or refresh your location.')}
            actionTitle={t('home.refresh', 'Refresh')}
            onAction={onRefresh}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <PharmacyDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        pharmacy={selectedPharmacy}
        isDarkMode={isDarkMode}
        isRTL={isRTL}
        onCopy={copyToClipboard}
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
      paddingBottom: 140,
    },
    heroCard: {
      backgroundColor: colors.primary,
      borderRadius: radius.xxl,
      padding: 24,
      marginBottom: 18,
      overflow: 'hidden',
      ...shadows.floating,
    },
    heroOrbOne: {
      position: 'absolute',
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: 'rgba(255,255,255,0.08)',
      top: -52,
      right: isRTL ? undefined : -48,
      left: isRTL ? -48 : undefined,
    },
    heroOrbTwo: {
      position: 'absolute',
      width: 116,
      height: 116,
      borderRadius: 58,
      backgroundColor: 'rgba(106, 202, 255, 0.18)',
      bottom: -24,
      right: isRTL ? undefined : 34,
      left: isRTL ? 34 : undefined,
    },
    heroTop: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    heroBadge: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    heroAction: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    metricsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
      marginTop: 20,
    },
    metricCard: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radius.xl,
      backgroundColor: 'rgba(5, 21, 46, 0.22)',
    },
    quickActions: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
    },
    countPill: {
      minWidth: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
    },
  });

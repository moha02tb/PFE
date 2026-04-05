import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Linking,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons, Entypo, Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import RTLUtils from '../utils/RTLUtils';
import { useForceUpdate } from '../hooks/useForceUpdate';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { loadPharmacies } from '../utils/pharmacyDataLoader';
import logger from '../utils/logger';
import { Button, Card, Badge, Input } from '../components/design-system';
import PharmacyDetailsModal from '../components/PharmacyDetailsModal';
import { useRating } from './RatingContext';
import { getColors } from '../utils/colors';
import { SPACING, LAYOUT } from '../utils/spacing';
import { getContextualShadow } from '../utils/shadows';
import { TEXT_STYLES } from '../utils/typography';

export default function CalendarScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { getCurrentLanguageKey, isRTL } = useLanguage();
  const { getRating, setRating } = useRating();
  const { copyToClipboard } = useCopyToClipboard(
    () => {
      // Feedback shown inline
    },
    (error) => {
      logger.error('CalendarScreen', 'Copy error', error);
    }
  );
  const forceUpdate = useForceUpdate();

  const endOfYear = new Date(new Date().getFullYear(), 11, 31);

  useEffect(() => {
    fetchPharmacies(selectedDate);
  }, [selectedDate, t, getCurrentLanguageKey]);

  // Force re-render when RTL changes for instant updates
  useEffect(() => {
    forceUpdate();
  }, [isRTL, forceUpdate]);

  const fetchPharmacies = (date) => {
    try {
      const pharmaciesData = loadPharmacies(t, date);
      setPharmacies(pharmaciesData);
    } catch (error) {
      logger.error('CalendarScreen', 'Error loading pharmacies data', error);
      // Fallback to empty array if data loading fails
      setPharmacies([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      fetchPharmacies(selectedDate);
    } finally {
      setRefreshing(false);
    }
  };

  const callPhone = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch((err) =>
      logger.error('CalendarScreen', "Erreur lors de l'appel", err)
    );
  };

  const openMap = (address) => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });

    Linking.openURL(url).catch((err) =>
      logger.error('CalendarScreen', "Erreur lors de l'ouverture de la carte", err)
    );
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Helper function to convert Arabic-Indic digits to Western digits
  const convertToWesternDigits = (str) => {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const westernDigits = '0123456789';

    return str.replace(/[٠-٩]/g, (digit) => {
      return westernDigits[arabicDigits.indexOf(digit)];
    });
  };

  const displayDate = (date) => {
    const currentLang = getCurrentLanguageKey();

    // Map language keys to locale strings
    const localeMap = {
      fr: 'fr-FR',
      en: 'en-US',
      ar: 'ar-SA', // Arabic (Saudi Arabia) - more universal Arabic locale
    };

    const locale = localeMap[currentLang] || 'fr-FR';

    try {
      let formattedDate = date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Convert Arabic-Indic digits to Western digits for Arabic locale
      if (currentLang === 'ar') {
        formattedDate = convertToWesternDigits(formattedDate);
      }

      return formattedDate;
    } catch (error) {
      // Fallback to French if locale is not supported
      logger.warn('CalendarScreen', 'Date locale not supported, falling back to French', error);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const onChange = (event, date) => {
    if (date) setSelectedDate(date);
    if (Platform.OS !== 'ios') setShowPicker(false);
  };

  const styles = getStyles(isDarkMode, isRTL);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('calendar.title')}</Text>
      </View>

      {/* Date Display Section - Clean, Single Display */}
      <View style={styles.dateDisplaySection}>
        <View style={styles.dateDisplayContainer}>
          <Feather name="calendar" size={24} color={getColors(isDarkMode).primary} />
          <View style={styles.dateDisplayContent}>
            <Text style={styles.dateLabel}>{t('calendar.selectDate')}</Text>
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              style={styles.dateDisplayTouchable}
              accessibilityLabel={t('calendar.selectDate')}
              accessibilityRole="button"
            >
              <Text style={styles.dateDisplayText}>{displayDate(selectedDate)}</Text>
            </TouchableOpacity>
          </View>
          <Feather name="chevron-down" size={20} color={getColors(isDarkMode).textSecondary} />
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChange}
          maximumDate={endOfYear}
        />
      )}

      {/* Pharmacy List */}
      <FlatList
        data={pharmacies}
        keyExtractor={(item) => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#fff' : '#0066CC'}
            colors={['#0066CC']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={getColors(isDarkMode).textSecondary} />
            <Text style={styles.noEventsText}>{t('calendar.noEventsToday')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.pharmacyCardContainer}>
            <Card
              isDarkMode={isDarkMode}
              elevation={2}
              margin={0}
              borderAccent={false}
              style={styles.pharmacyCard}
            >
              {/* Card Header - Pharmacy Name and Status */}
              <View style={styles.cardHeader}>
                <View style={styles.nameSection}>
                  <Text style={styles.pharmacyName}>{item.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: item.isOpen ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {item.isOpen ? t('home.open') : t('home.closed')}
                    </Text>
                  </View>
                </View>
                {item.emergency && (
                  <View style={styles.emergencyBadge}>
                    <MaterialIcons name="emergency" size={16} color="#FCD34D" />
                    <Text style={styles.emergencyText}>{t('home.onDuty')}</Text>
                  </View>
                )}
              </View>

              {/* Pharmacy Details Grid */}
              <View style={styles.detailsGrid}>
                {/* Address */}
                <View style={[styles.detailItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.detailIconContainer}>
                    <Entypo name="location-pin" size={18} color={getColors(isDarkMode).primary} />
                  </View>
                  <View style={[styles.detailContent, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{t('calendar.address')}</Text>
                    <Text style={styles.detailValue}>{item.address}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      copyToClipboard(item.address);
                      setCopiedId(`addr-${item.id}`);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    accessibilityLabel={t('home.copyAddress')}
                    accessibilityRole="button"
                    style={{ padding: SPACING.xs }}
                  >
                    <Feather
                      name={copiedId === `addr-${item.id}` ? 'check' : 'copy'}
                      size={16}
                      color={
                        copiedId === `addr-${item.id}` ? '#10B981' : getColors(isDarkMode).primary
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Hours - Conditional Display */}
                {item.isOpen ? (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                      <Feather name="clock" size={18} color={getColors(isDarkMode).primary} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('calendar.hours')}</Text>
                      <Text style={styles.detailValue}>{item.openHours}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Phone */}
                <View style={[styles.detailItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.detailIconContainer}>
                    <Feather name="phone" size={18} color={getColors(isDarkMode).primary} />
                  </View>
                  <View style={[styles.detailContent, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{t('calendar.phone')}</Text>
                    <Text style={styles.detailValue}>{item.phone}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      copyToClipboard(item.phone);
                      setCopiedId(`phone-${item.id}`);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    accessibilityLabel={t('home.copyPhone')}
                    accessibilityRole="button"
                    style={{ padding: SPACING.xs }}
                  >
                    <Feather
                      name={copiedId === `phone-${item.id}` ? 'check' : 'copy'}
                      size={16}
                      color={
                        copiedId === `phone-${item.id}` ? '#10B981' : getColors(isDarkMode).primary
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <Button
                  title={t('home.call')}
                  onPress={() => callPhone(item.phone)}
                  variant="contained"
                  color="secondary"
                  isDarkMode={isDarkMode}
                  size="small"
                  icon={<Feather name="phone" size={14} color="white" />}
                  accessibilityLabel={`${t('home.call')} ${item.name}, ${item.phone}`}
                />

                <Button
                  title={t('home.directions')}
                  onPress={async () => {
                    try {
                      const { status } = await Location.requestForegroundPermissionsAsync();
                      if (status !== 'granted') {
                        if (navigation?.jumpTo) {
                          navigation.jumpTo('Carte', { pharmacies, targetPharmacy: item });
                        } else {
                          navigation.navigate('Carte', { pharmacies, targetPharmacy: item });
                        }
                        return;
                      }

                      const { coords } = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Highest,
                      });

                      const params = { pharmacies, initialLocation: coords, targetPharmacy: item };
                      if (navigation?.jumpTo) {
                        navigation.jumpTo('Carte', params);
                      } else {
                        navigation.navigate('Carte', params);
                      }
                    } catch (e) {
                      if (navigation?.jumpTo) {
                        navigation.jumpTo('Carte', { pharmacies, targetPharmacy: item });
                      } else {
                        navigation.navigate('Carte', { pharmacies, targetPharmacy: item });
                      }
                    }
                  }}
                  variant="contained"
                  color="primary"
                  isDarkMode={isDarkMode}
                  size="small"
                  icon={<Entypo name="map" size={14} color="white" />}
                  accessibilityLabel={`${t('home.directions')} ${t('home.to')} ${item.name}, ${item.address}`}
                />

                <Button
                  title={t('home.details', 'Details')}
                  onPress={() => {
                    setSelectedPharmacy(item);
                    setDetailsModalVisible(true);
                  }}
                  variant="outlined"
                  isDarkMode={isDarkMode}
                  size="small"
                  icon={<Feather name="info" size={14} color={getColors(isDarkMode).primary} />}
                  accessibilityLabel={`${t('home.details', 'View details for')} ${item.name}`}
                />
              </View>
            </Card>
          </View>
        )}
        scrollEnabled={true}
        contentContainerStyle={{ paddingBottom: SPACING.lg }}
      />

      {/* Pharmacy Details Modal with Rating */}
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

const getStyles = (isDarkMode, isRTL = false) => {
  const colors = getColors(isDarkMode);
  const shadow = getContextualShadow(2, isDarkMode);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background || '#FFFFFF',
    },

    /* Header Section */
    header: {
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.lg,
      backgroundColor: colors.primary || '#0066CC',
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      marginBottom: SPACING.lg,
      ...shadow,
    },
    headerTitle: {
      ...TEXT_STYLES.headerMedium,
      color: '#FFFFFF',
    },

    /* Date Display Section */
    dateDisplaySection: {
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    dateDisplayContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: colors.surface || '#FFFFFF',
      borderRadius: 12,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border || '#E0E0E0',
      ...shadow,
    },
    dateDisplayContent: {
      flex: 1,
      marginLeft: isRTL ? 0 : SPACING.md,
      marginRight: isRTL ? SPACING.md : 0,
    },
    dateLabel: {
      ...TEXT_STYLES.bodySmall,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
    dateDisplayTouchable: {
      // Additional styling if needed
    },
    dateDisplayText: {
      ...TEXT_STYLES.headerSmall,
      color: colors.text,
      fontWeight: '600',
    },

    /* Pharmacy List */
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.xxxl,
    },
    noEventsText: {
      ...TEXT_STYLES.bodyMedium,
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: SPACING.md,
      fontStyle: 'italic',
    },

    /* Pharmacy Card Container */
    pharmacyCardContainer: {
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
    },
    pharmacyCard: {
      borderRadius: 12,
      padding: SPACING.lg,
      overflow: 'hidden',
    },

    /* Card Header - Name and Status */
    cardHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.lg,
      gap: SPACING.md,
    },
    nameSection: {
      flex: 1,
    },
    pharmacyName: {
      ...TEXT_STYLES.headerSmall,
      color: colors.text,
      marginBottom: SPACING.sm,
      fontSize: 18,
      fontWeight: '600',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: 6,
    },
    statusText: {
      ...TEXT_STYLES.bodySmall,
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 12,
    },
    emergencyBadge: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: '#FBBF24',
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: 6,
      gap: SPACING.xs,
    },
    emergencyText: {
      ...TEXT_STYLES.bodySmall,
      color: '#78350F',
      fontWeight: '600',
      fontSize: 12,
    },

    /* Details Grid */
    detailsGrid: {
      marginVertical: SPACING.md,
      gap: SPACING.md,
    },
    detailItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: SPACING.md,
    },
    detailIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.primary + '20' || '#0066CC20',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      ...TEXT_STYLES.bodySmall,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
      fontSize: 12,
      fontWeight: '500',
    },
    detailValue: {
      ...TEXT_STYLES.bodyMedium,
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },

    /* Action Buttons */
    actionsContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: SPACING.md,
      marginTop: SPACING.lg,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.border || '#E0E0E0',
    },
  });
};

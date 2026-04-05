import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Platform,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import { Feather, Entypo, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getColors } from '../utils/colors';
import { SPACING, BORDER_RADIUS } from '../utils/spacing';
import { TEXT_STYLES } from '../utils/typography';
import { getContextualShadow } from '../utils/shadows';
import { Button } from './design-system';

const PharmacyDetailsModal = ({ visible, onClose, pharmacy, isDarkMode, isRTL }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const colors = getColors(isDarkMode);
  const shadow = getContextualShadow(2, isDarkMode);

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true; // Consume the event
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  if (!pharmacy) return null;

  const callPhone = (phoneNumber) => {
    const url = `tel:${phoneNumber.replace(/\s+/g, '')}`;
    Linking.openURL(url);
  };

  const openMap = (address) => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    Linking.openURL(url);
  };

  const sharePharmacy = () => {
    const message = `${pharmacy.name}\n${pharmacy.address}\n${pharmacy.phone}`;
    if (Platform.OS === 'ios') {
      // Use native share on iOS
      Linking.openURL(`mailto:?subject=${pharmacy.name}&body=${message}`);
    } else {
      // Share intent on Android
      Linking.openURL(`sms:?body=${message}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : 'overFullScreen'}
      hardwareAccelerated={true}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#F5F5F5' }]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }, shadow]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.6}
            accessibilityLabel="Close details"
            accessibilityRole="button"
            accessibilityState={{ disabled: false }}
            hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>
            {t('home.details', 'Details')}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section with Gradient Background */}
          <View
            style={[
              styles.heroSection,
              {
                backgroundColor: colors.primary,
              },
              getContextualShadow(4, isDarkMode),
            ]}
          >
            {/* Pharmacy Icon */}
            <View
              style={[
                styles.pharmacyIcon,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)',
                },
              ]}
            >
              <MaterialIcons name="local-pharmacy" size={32} color="white" />
            </View>

            {/* Pharmacy Info */}
            <Text style={[styles.pharmacyName, { color: 'white' }]}>{pharmacy.name}</Text>

            {/* Status Badges */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: pharmacy.isOpen
                      ? 'rgba(16, 185, 129, 0.9)'
                      : 'rgba(239, 68, 68, 0.9)',
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderWidth: 1,
                  },
                ]}
              >
                <Feather
                  name={pharmacy.isOpen ? 'check-circle' : 'clock'}
                  size={14}
                  color="white"
                  style={{ marginRight: SPACING.xs }}
                />
                <Text style={styles.statusText}>
                  {pharmacy.isOpen ? t('home.open') : t('home.closed')}
                </Text>
              </View>
              {pharmacy.emergency && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: 'rgba(245, 158, 11, 0.9)',
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Feather
                    name="alert-circle"
                    size={14}
                    color="white"
                    style={{ marginRight: SPACING.xs }}
                  />
                  <Text style={styles.statusText}>{t('home.emergency')}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Contact Section */}
          <View
            style={[
              styles.section,
              { backgroundColor: isDarkMode ? colors.surface : '#FFFFFF' },
              styles.sectionShadow,
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#3B82F6' }]}>
                <Feather name="phone" size={22} color="white" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('home.contact', 'Contact')}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.contactItem,
                { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.25)' : '#EFF6FF' },
              ]}
              onPress={() => callPhone(pharmacy.phone)}
              activeOpacity={0.6}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#3B82F6' }]}>
                <Feather name="phone" size={18} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>
                  {t('home.phoneNumber', 'Phone Number')}
                </Text>
                <Text style={[styles.contactText, { color: colors.text, fontWeight: '600' }]}>
                  {pharmacy.phone}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* Location Section */}
          <View
            style={[
              styles.section,
              { backgroundColor: isDarkMode ? colors.surface : '#FFFFFF' },
              styles.sectionShadow,
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#EF4444' }]}>
                <Entypo name="location-pin" size={22} color="white" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('home.location', 'Location')}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.contactItem,
                { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.25)' : '#FEF2F2' },
              ]}
              onPress={() => openMap(pharmacy.address)}
              activeOpacity={0.6}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#EF4444' }]}>
                <Entypo name="location-pin" size={18} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>
                  {t('home.address', 'Address')}
                </Text>
                <Text style={[styles.contactText, { color: colors.text, fontWeight: '600' }]}>
                  {pharmacy.address}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Hours Section */}
          {pharmacy.openHours && (
            <View
              style={[
                styles.section,
                { backgroundColor: isDarkMode ? colors.surface : '#FFFFFF' },
                styles.sectionShadow,
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#10B981' }]}>
                  <Feather name="clock" size={22} color="white" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('home.hours', 'Hours')}
                </Text>
              </View>
              <View
                style={[
                  styles.hoursBox,
                  { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.25)' : '#F0FDF4' },
                ]}
              >
                <Feather
                  name="clock"
                  size={20}
                  color="#10B981"
                  style={{ marginRight: SPACING.md }}
                />
                <Text
                  style={[styles.hoursText, { color: colors.text, flex: 1, fontWeight: '600' }]}
                >
                  {pharmacy.openHours}
                </Text>
              </View>
            </View>
          )}

          {/* Rating Section */}
          <View
            style={[
              styles.section,
              { backgroundColor: isDarkMode ? colors.surface : '#FFFFFF' },
              styles.sectionShadow,
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#F59E0B' }]}>
                <MaterialIcons name="star" size={22} color="white" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('home.rating', 'Rating')}
              </Text>
            </View>
            <View
              style={[
                styles.ratingBox,
                { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.25)' : '#FFFBEB' },
              ]}
            >
              <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
                {t('home.rateThisPharmacy', 'Rate this pharmacy')}
              </Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <MaterialIcons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && (
                <Text style={[styles.ratingText, { color: '#F59E0B' }]}>
                  ✓ {t('home.youRated', 'You rated')} {rating} {t('home.stars', 'stars')}
                </Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Button
              title={t('home.call')}
              onPress={() => callPhone(pharmacy.phone)}
              variant="contained"
              color="primary"
              isDarkMode={isDarkMode}
              fullWidth={true}
              icon={<Feather name="phone" size={16} color="white" />}
              style={{ marginBottom: SPACING.md }}
            />
            <Button
              title={t('home.directions')}
              onPress={() => openMap(pharmacy.address)}
              variant="contained"
              color="secondary"
              isDarkMode={isDarkMode}
              fullWidth={true}
              icon={<Entypo name="map" size={16} color="white" />}
              style={{ marginBottom: SPACING.md }}
            />
            <Button
              title={t('home.share', 'Share')}
              onPress={sharePharmacy}
              variant="outlined"
              isDarkMode={isDarkMode}
              fullWidth={true}
              icon={<Feather name="share-2" size={16} color={colors.primary} />}
              style={{ marginBottom: SPACING.md }}
            />
            <Button
              title={t('common.close', 'Close')}
              onPress={onClose}
              variant="text"
              isDarkMode={isDarkMode}
              fullWidth={true}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    ...TEXT_STYLES.headerMedium,
  },
  closeButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  heroSection: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 0,
  },
  pharmacyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  section: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  sectionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pharmacyName: {
    ...TEXT_STYLES.headerLarge,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 24,
  },
  statusRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    ...TEXT_STYLES.bodyLarge,
    fontWeight: '700',
    marginBottom: 0,
    color: '#111827',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 0,
    gap: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 11,
    marginBottom: SPACING.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactText: {
    ...TEXT_STYLES.bodyMedium,
  },
  hoursText: {
    ...TEXT_STYLES.bodyMedium,
  },
  hoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  ratingBox: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  ratingLabel: {
    fontSize: 12,
    marginBottom: SPACING.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  starButton: {
    padding: SPACING.sm,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  actionSection: {
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
});

export default PharmacyDetailsModal;

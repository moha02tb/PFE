import React, { useMemo } from 'react';
import { Linking, Platform, Share, StyleSheet, View } from 'react-native';
import { Entypo, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppButton, AppCard, AppModal, AppText, StatusBadge } from './design-system';
import { getColors } from '../utils/colors';
import { getTheme } from '../utils/theme';

export default function PharmacyDetailsModal({
  visible,
  onClose,
  pharmacy,
  isDarkMode = false,
  isRTL = false,
  onCopy,
}) {
  const { t } = useTranslation();
  const theme = useMemo(() => ({ ...getTheme(isDarkMode), isRTL }), [isDarkMode, isRTL]);
  const { colors, radius } = theme;
  const styles = useMemo(() => createStyles(colors, radius, isRTL), [colors, radius, isRTL]);

  if (!pharmacy) return null;

  const callPhone = () => {
    if (!pharmacy.phone) return;
    Linking.openURL(`tel:${pharmacy.phone.replace(/\s+/g, '')}`);
  };

  const openMap = () => {
    const query = encodeURIComponent(pharmacy.address);
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`,
    });
    Linking.openURL(url);
  };

  const sharePharmacy = async () => {
    try {
      await Share.share({
        message: `${pharmacy.name}\n${pharmacy.address}\n${pharmacy.phone || ''}`.trim(),
      });
    } catch (error) {
      return error;
    }
  };

  return (
    <AppModal visible={visible} onClose={onClose} title={t('home.details', 'Details')} fullHeight={false}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="medical-bag" size={28} color="#FFFFFF" />
        </View>
        <AppText variant="headerMedium" color="#FFFFFF" style={{ marginTop: 14 }}>
          {pharmacy.name}
        </AppText>
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.82)" style={{ marginTop: 6 }}>
          {pharmacy.address}
        </AppText>
        <View style={styles.badges}>
          <StatusBadge status={pharmacy.isOpen ? 'open' : 'closed'} />
          {pharmacy.emergency ? <StatusBadge status="onDuty">{t('home.onDuty', 'On duty')}</StatusBadge> : null}
        </View>
      </View>

      <View style={styles.stack}>
        <AppCard>
          <AppText variant="headerSmall" style={{ marginBottom: 14 }}>
            {t('home.contact', 'Contact')}
          </AppText>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Feather name="phone" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="labelMedium" color={colors.textSecondary}>
                {t('home.phoneNumber', 'Phone Number')}
              </AppText>
              <AppText variant="bodyLarge" style={{ marginTop: 4 }}>
                {pharmacy.phone || t('home.notAvailable', 'Not available')}
              </AppText>
            </View>
          </View>
          {pharmacy.openHours ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Feather name="clock" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="labelMedium" color={colors.textSecondary}>
                  {t('home.hours', 'Hours')}
                </AppText>
                <AppText variant="bodyLarge" style={{ marginTop: 4 }}>
                  {pharmacy.openHours}
                </AppText>
              </View>
            </View>
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="headerSmall" style={{ marginBottom: 14 }}>
            {t('home.location', 'Location')}
          </AppText>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Entypo name="location-pin" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="labelMedium" color={colors.textSecondary}>
                {t('home.address', 'Address')}
              </AppText>
              <AppText variant="bodyLarge" style={{ marginTop: 4 }}>
                {pharmacy.address}
              </AppText>
            </View>
          </View>
          {onCopy ? (
            <AppButton
              title={t('home.copyAddress', 'Copy address')}
              onPress={() => onCopy(pharmacy.address)}
              variant="tonal"
              fullWidth
              icon={<Feather name="copy" size={16} color={colors.primary} />}
              style={{ marginTop: 8 }}
            />
          ) : null}
        </AppCard>

        <View style={styles.actions}>
          <AppButton
            title={t('home.call', 'Call')}
            onPress={callPhone}
            color="secondary"
            fullWidth
            icon={<Feather name="phone" size={16} color="#FFFFFF" />}
          />
          <AppButton
            title={t('home.directions', 'Directions')}
            onPress={openMap}
            fullWidth
            icon={<Entypo name="map" size={16} color="#FFFFFF" />}
          />
          <AppButton
            title={t('home.share', 'Share')}
            onPress={sharePharmacy}
            variant="outlined"
            fullWidth
            icon={<Feather name="share-2" size={16} color={colors.primary} />}
          />
        </View>
      </View>
    </AppModal>
  );
}

const createStyles = (colors, radius, isRTL) =>
  StyleSheet.create({
    hero: {
      backgroundColor: colors.primary,
      borderRadius: radius.xxl,
      padding: 22,
      marginBottom: 16,
    },
    iconWrap: {
      width: 58,
      height: 58,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    badges: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14,
    },
    stack: {
      gap: 12,
      paddingBottom: 8,
    },
    infoRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 14,
    },
    infoIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
    },
    actions: {
      gap: 10,
      marginTop: 4,
    },
  });

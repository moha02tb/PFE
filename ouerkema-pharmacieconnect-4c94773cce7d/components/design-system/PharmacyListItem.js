import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Entypo, Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../utils/theme';
import AppButton from './Button';
import AppCard from './Card';
import AppText from './Text';
import FavoriteButton from './FavoriteButton';
import StatusBadge from './Badge';

export default function PharmacyListItem({
  item,
  distanceLabel,
  rating,
  favorite,
  onToggleFavorite,
  onOpenDetails,
  onCall,
  onDirections,
  secondaryActionLabel,
}) {
  const { t } = useTranslation();
  const { colors, radius, textStyles, isRTL } = useAppTheme();

  const styles = StyleSheet.create({
    card: {
      marginBottom: 14,
    },
    topRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    identity: {
      flex: 1,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrap: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
    },
    metaRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
      marginBottom: 12,
    },
    detailsBox: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.xl,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    actionRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
      marginTop: 14,
    },
    detailPill: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: radius.full,
      backgroundColor: colors.chip,
      paddingHorizontal: 10,
      paddingVertical: 8,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
  });

  return (
    <AppCard style={styles.card}>
      <View style={styles.topRow}>
        <Pressable style={styles.identity} onPress={onOpenDetails}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="medical-bag" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="headerSmall">{item.name}</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 4 }}>
              {distanceLabel}
            </AppText>
          </View>
        </Pressable>
        <FavoriteButton
          active={favorite}
          onPress={onToggleFavorite}
          accessibilityLabel={favorite ? t('home.removeFavorite') : t('home.addFavorite')}
        />
      </View>

      <View style={styles.metaRow}>
        <StatusBadge status={item.isOpen ? 'open' : 'closed'} />
        {item.emergency ? <StatusBadge status="onDuty">{t('home.onDuty', 'On duty')}</StatusBadge> : null}
        {rating > 0 ? (
          <View style={styles.detailPill}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <AppText variant="labelMedium" color="#A16000">{rating.toFixed(1)}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.detailsBox}>
        <View style={styles.detailRow}>
          <Entypo name="location-pin" size={16} color={colors.primary} />
          <AppText variant="bodyMedium" style={{ flex: 1 }}>{item.address}</AppText>
        </View>
        {item.phone ? (
          <View style={styles.detailRow}>
            <Feather name="phone" size={15} color={colors.iconMuted} />
            <AppText variant="bodySmall" color={colors.textSecondary}>{item.phone}</AppText>
          </View>
        ) : null}
        {item.openHours ? (
          <View style={[styles.detailRow, { marginBottom: 0 }]}>
            <Feather name="clock" size={15} color={colors.iconMuted} />
            <AppText variant="bodySmall" color={colors.textSecondary}>{item.openHours}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <AppButton
          title={t('home.call', 'Call')}
          onPress={onCall}
          color="secondary"
          size="small"
          style={{ flex: 1 }}
          icon={<Feather name="phone" size={14} color="#FFFFFF" />}
        />
        <AppButton
          title={t('home.directions', 'Directions')}
          onPress={onDirections}
          size="small"
          style={{ flex: 1 }}
          icon={<Entypo name="map" size={14} color="#FFFFFF" />}
        />
        <AppButton
          title={secondaryActionLabel || t('home.details', 'Details')}
          onPress={onOpenDetails}
          variant="outlined"
          size="small"
          style={{ flex: 1 }}
          icon={<Feather name="info" size={14} color={colors.primary} />}
        />
      </View>
    </AppCard>
  );
}

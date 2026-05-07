import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppButton, AppCard, AppText } from './design-system';
import { useAppTheme } from '../utils/theme';

export default function PharmacyCard({ pharmacie }) {
  const { t } = useTranslation();
  const { colors, radius } = useAppTheme();
  const styles = createStyles(colors, radius);

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="medical-bag" size={20} color={colors.primary} />
        </View>
        <View style={styles.titleWrap}>
          <AppText variant="headerSmall" numberOfLines={2}>
            {pharmacie.nom}
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.address}>
            {pharmacie.adresse}
          </AppText>
        </View>
      </View>

      <View style={styles.phoneRow}>
        <Feather name="phone" size={15} color={colors.iconMuted} />
        <AppText variant="bodySmall" color={colors.textSecondary}>
          {pharmacie.telephone}
        </AppText>
      </View>

      <AppButton
        title={t('home.call')}
        onPress={() => Linking.openURL(`tel:${pharmacie.telephone}`)}
        color="secondary"
        fullWidth
        icon={<Feather name="phone" size={15} color={colors.textInverse} />}
      />
    </AppCard>
  );
}

const createStyles = (colors, radius) =>
  StyleSheet.create({
    card: {
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    titleWrap: {
      flex: 1,
    },
    address: {
      marginTop: 4,
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSecondary,
      marginBottom: 12,
    },
  });

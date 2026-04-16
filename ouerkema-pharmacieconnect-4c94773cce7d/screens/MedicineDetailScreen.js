import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppCard, AppText, EmptyState } from '../components/design-system';
import { useAppTheme } from '../utils/theme';
import { fetchMedicineByCodePct } from '../utils/medicineDataLoader';

export default function MedicineDetailScreen({ route }) {
  const { t } = useTranslation();
  const { colors, radius, shadows } = useAppTheme();
  const codePct = route?.params?.codePct;
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const styles = useMemo(() => createStyles(colors, radius, shadows), [colors, radius, shadows]);

  useEffect(() => {
    let active = true;

    const loadDetail = async () => {
      setLoading(true);
      setError('');

      const payload = await fetchMedicineByCodePct(codePct);
      if (!active) return;

      if (!payload) {
        setMedicine(null);
        setError(t('medicines.detailLoadError', 'Unable to load medicine details.'));
      } else {
        setMedicine(payload);
      }
      setLoading(false);
    };

    loadDetail();
    return () => {
      active = false;
    };
  }, [codePct, t]);

  if (loading) {
    return (
      <View style={styles.loadingShell}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="bodyMedium" style={{ marginTop: 12 }}>
          {t('medicines.loadingDetail', 'Loading medicine detail')}
        </AppText>
      </View>
    );
  }

  if (!medicine) {
    return (
      <View style={styles.loadingShell}>
        <EmptyState
          icon="medkit-outline"
          title={t('medicines.detailEmptyTitle', 'Medicine unavailable')}
          message={error || t('medicines.detailEmptyMessage', 'The selected medicine could not be found.')}
        />
      </View>
    );
  }

  const fields = [
    { label: t('medicines.codePct', 'Code PCT'), value: medicine.code_pct },
    { label: t('medicines.commercialName', 'Commercial name'), value: medicine.nom_commercial },
    { label: t('medicines.dci', 'DCI'), value: medicine.dci },
    { label: t('medicines.publicPrice', 'Public price'), value: `${medicine.prix_public_dt} DT` },
    { label: t('medicines.referenceTariff', 'Reference tariff'), value: `${medicine.tarif_reference_dt} DT` },
    { label: t('medicines.reimbursement', 'Reimbursement category'), value: medicine.categorie_remboursement },
    { label: t('medicines.ap', 'AP'), value: medicine.ap },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppCard style={styles.heroCard} borderAccent>
        <AppText variant="labelSmall" color={colors.textSecondary}>
          {medicine.code_pct}
        </AppText>
        <AppText variant="headerLarge" style={{ marginTop: 6 }}>
          {medicine.nom_commercial}
        </AppText>
        <AppText variant="bodyMedium" color={colors.textSecondary} style={{ marginTop: 10 }}>
          {medicine.dci}
        </AppText>
      </AppCard>

      <AppCard>
        <View style={styles.fieldList}>
          {fields.map((item) => (
            <View key={item.label} style={styles.fieldRow}>
              <AppText variant="labelMedium" color={colors.textSecondary}>
                {item.label}
              </AppText>
              <AppText variant="bodyMedium" style={styles.fieldValue}>
                {item.value || '-'}
              </AppText>
            </View>
          ))}
        </View>
      </AppCard>
    </ScrollView>
  );
}

const createStyles = (colors, radius, shadows) =>
  StyleSheet.create({
    content: {
      padding: 16,
      paddingBottom: 36,
      backgroundColor: colors.backgroundAccent,
      flexGrow: 1,
    },
    loadingShell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundAccent,
      paddingHorizontal: 24,
    },
    heroCard: {
      marginBottom: 16,
      ...shadows.raised,
    },
    fieldList: {
      gap: 16,
    },
    fieldRow: {
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    fieldValue: {
      marginTop: 6,
      color: colors.text,
    },
  });

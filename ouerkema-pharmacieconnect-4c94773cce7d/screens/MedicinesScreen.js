import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounce } from '../hooks/useDebounce';
import { AppCard, AppText, EmptyState, SearchBar } from '../components/design-system';
import { useAppTheme } from '../utils/theme';
import { fetchMedicineCountFromAPI, fetchMedicinesFromAPI } from '../utils/medicineDataLoader';

const PAGE_SIZE = 500;

export default function MedicinesScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, radius, shadows } = useAppTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const [resultCount, setResultCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const styles = useMemo(
    () => createStyles(colors, radius, shadows, insets.top),
    [colors, radius, shadows, insets.top]
  );

  const loadMedicines = async ({ forceRefresh = false, query = '' } = {}) => {
    const requestId = ++requestIdRef.current;
    if (!forceRefresh) setLoading(true);
    setError('');

    try {
      const normalizedQuery = query.trim();
      const [total, filteredTotal] = await Promise.all([
        fetchMedicineCountFromAPI(''),
        fetchMedicineCountFromAPI(normalizedQuery),
      ]);

      if (requestId !== requestIdRef.current) return;

      setCatalogCount(total || 0);
      setResultCount(filteredTotal || 0);

      if (!filteredTotal) {
        setMedicines([]);
        return;
      }

      const pageCount = Math.ceil(filteredTotal / PAGE_SIZE);
      const pages = await Promise.all(
        Array.from({ length: pageCount }, (_, index) =>
          fetchMedicinesFromAPI(normalizedQuery, index * PAGE_SIZE, PAGE_SIZE)
        )
      );
      if (pages.some((page) => page === null)) {
        throw new Error(t('medicines.loadError', 'Failed to load medicines from the server.'));
      }

      if (requestId !== requestIdRef.current) return;

      const items = pages.flat();
      setMedicines(items);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setMedicines([]);
      setCatalogCount(0);
      setResultCount(0);
      setError(err.message || t('medicines.loadError', 'Failed to load medicines from the server.'));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadMedicines({ query: debouncedSearch });
  }, [debouncedSearch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedicines({ forceRefresh: true, query: debouncedSearch });
  };

  const headerComponent = useMemo(
    () => (
      <View>
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="pill" size={16} color="#D9F5FF" />
            <AppText variant="labelMedium" color="#FFFFFF">
              {t('medicines.badge', 'Medicine catalog')}
            </AppText>
          </View>
          <AppText variant="headerLarge" color="#FFFFFF">
            {t('medicines.title', 'Medicines')}
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.84)" style={{ marginTop: 8 }}>
            {t(
              'medicines.subtitle',
              'Search imported medicines by commercial name, DCI, or code and open full reimbursement details.'
            )}
          </AppText>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <AppText variant="headerMedium" color="#FFFFFF" align="center">
                {catalogCount}
              </AppText>
              <AppText variant="labelSmall" color="rgba(255,255,255,0.72)" align="center">
                {t('medicines.total', 'Total')}
              </AppText>
            </View>
            <View style={styles.metricCard}>
              <AppText variant="headerMedium" color="#FFFFFF" align="center">
                {resultCount}
              </AppText>
              <AppText variant="labelSmall" color="rgba(255,255,255,0.72)" align="center">
                {t('medicines.visible', 'Visible')}
              </AppText>
            </View>
          </View>
        </View>

        <AppCard style={{ marginBottom: 18 }}>
          <SearchBar
            placeholder={t('medicines.searchPlaceholder', 'Search by medicine, DCI, or code')}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </AppCard>

        {error ? (
          <AppCard style={{ marginBottom: 18 }}>
            <AppText variant="bodyMedium" color={colors.error}>
              {error}
            </AppText>
          </AppCard>
        ) : null}
      </View>
    ),
    [catalogCount, colors.error, error, resultCount, searchTerm, styles, t]
  );

  const renderItem = ({ item }) => (
    <AppCard
      pressable
      onPress={() => navigation.navigate('MedicineDetail', { codePct: item.code_pct })}
      marginBottom={14}
      borderAccent
    >
      <View style={styles.rowTop}>
        <View style={styles.rowMain}>
          <AppText variant="labelSmall" color={colors.textSecondary}>
            {item.code_pct}
          </AppText>
          <AppText variant="headerSmall" style={{ marginTop: 4 }}>
            {item.nom_commercial}
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 8 }}>
            {item.dci}
          </AppText>
        </View>
        <View style={styles.priceBadge}>
          <AppText variant="labelMedium" color={colors.primary}>
            {`${item.prix_public_dt} DT`}
          </AppText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <AppText variant="labelSmall" color={colors.textSecondary}>
            {`${t('medicines.reimbursement', 'Reimbursement')}: ${item.categorie_remboursement}`}
          </AppText>
        </View>
        <View style={styles.metaPill}>
          <AppText variant="labelSmall" color={colors.textSecondary}>
            {`${t('medicines.ap', 'AP')}: ${item.ap}`}
          </AppText>
        </View>
      </View>
    </AppCard>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingShell}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="bodyMedium" style={{ marginTop: 12 }}>
          {t('medicines.loading', 'Loading medicines')}
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={medicines}
      keyExtractor={(item) => item.code_pct}
      renderItem={renderItem}
      ListHeaderComponent={headerComponent}
      ListEmptyComponent={
        <EmptyState
          icon="medkit-outline"
          title={t('medicines.emptyTitle', 'No medicines found')}
          message={t(
            'medicines.emptyMessage',
            'No medicines match the current search. Try another name, DCI, or code.'
          )}
        />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const createStyles = (colors, radius, shadows, topInset) =>
  StyleSheet.create({
    listContent: {
      paddingHorizontal: 16,
      paddingTop: topInset + 16,
      paddingBottom: 140,
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
      backgroundColor: colors.primary,
      borderRadius: radius.xxxl,
      padding: 22,
      marginBottom: 18,
      ...shadows.floating,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.xl,
      backgroundColor: 'rgba(255,255,255,0.12)',
      marginBottom: 16,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 18,
    },
    metricCard: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: radius.xxl,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 14,
    },
    rowMain: {
      flex: 1,
    },
    priceBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.xl,
      backgroundColor: colors.primaryMuted,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 14,
    },
    metaPill: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: radius.xl,
      backgroundColor: colors.surfaceSecondary,
    },
  });

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounce } from '../hooks/useDebounce';
import { AppCard, AppText, EmptyState, EntranceView, SearchBar } from '../components/design-system';
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
      setError(
        err.message || t('medicines.loadError', 'Failed to load medicines from the server.')
      );
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
        <EntranceView delay={0} distance={18}>
          <View style={styles.heroCard}>
            <View style={styles.heroPanel} />
            <View style={styles.heroGridLine} />
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="pill" size={16} color="#D9F5FF" />
              <AppText variant="labelMedium" color={colors.textInverse}>
                {t('medicines.badge', 'Medicine catalog')}
              </AppText>
            </View>
            <AppText variant="headerLarge" color={colors.textInverse}>
              {t('medicines.title', 'Medicines')}
            </AppText>
            <AppText variant="bodyMedium" color="rgba(247,251,255,0.84)" style={{ marginTop: 8 }}>
              {t(
                'medicines.subtitle',
                'Search imported medicines by commercial name, DCI, or code and open full reimbursement details.'
              )}
            </AppText>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <AppText variant="headerMedium" color={colors.textInverse} align="center">
                  {catalogCount}
                </AppText>
                <AppText variant="labelSmall" color="rgba(247,251,255,0.72)" align="center">
                  {t('medicines.total', 'Total')}
                </AppText>
              </View>
              <View style={styles.metricCard}>
                <AppText variant="headerMedium" color={colors.textInverse} align="center">
                  {resultCount}
                </AppText>
                <AppText variant="labelSmall" color="rgba(247,251,255,0.72)" align="center">
                  {t('medicines.visible', 'Visible')}
                </AppText>
              </View>
            </View>
          </View>
        </EntranceView>

        <EntranceView delay={90} distance={12}>
          <AppCard style={{ marginBottom: 18 }} contentStyle={{ padding: 18 }}>
            <SearchBar
              placeholder={t('medicines.searchPlaceholder', 'Search by medicine, DCI, or code')}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </AppCard>
        </EntranceView>

        {error ? (
          <EntranceView delay={120} distance={10}>
            <AppCard style={{ marginBottom: 18 }} contentStyle={styles.errorContent}>
              <Feather name="alert-circle" size={18} color={colors.error} />
              <AppText variant="bodyMedium" color={colors.error} style={{ flex: 1 }}>
                {error}
              </AppText>
            </AppCard>
          </EntranceView>
        ) : null}
      </View>
    ),
    [catalogCount, colors, error, resultCount, searchTerm, styles, t]
  );

  const renderItem = ({ item, index }) => (
    <EntranceView index={index} distance={12}>
      <AppCard
        pressable
        onPress={() => navigation.navigate('MedicineDetail', { codePct: item.code_pct })}
        marginBottom={12}
        contentStyle={{ padding: 16 }}
      >
        <View style={styles.rowTop}>
          <View style={styles.itemIcon}>
            <MaterialCommunityIcons name="pill" size={19} color={colors.primary} />
          </View>
          <View style={styles.rowMain}>
            <AppText variant="labelSmall" color={colors.textSecondary}>
              {item.code_pct}
            </AppText>
            <AppText variant="headerSmall" style={{ marginTop: 4 }} numberOfLines={2}>
              {item.nom_commercial}
            </AppText>
            <AppText
              variant="bodySmall"
              color={colors.textSecondary}
              style={{ marginTop: 8 }}
              numberOfLines={2}
            >
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
            <AppText variant="labelSmall" color={colors.textSecondary} numberOfLines={1}>
              {`${t('medicines.reimbursement', 'Reimbursement')}: ${item.categorie_remboursement}`}
            </AppText>
          </View>
          <View style={styles.metaPill}>
            <AppText variant="labelSmall" color={colors.textSecondary} numberOfLines={1}>
              {`${t('medicines.ap', 'AP')}: ${item.ap}`}
            </AppText>
          </View>
        </View>
        <View style={styles.rowFooter}>
          <AppText variant="labelSmall" color={colors.primary}>
            {t('medicines.openDetails', 'Open details')}
          </AppText>
          <Feather name="arrow-right" size={14} color={colors.primary} />
        </View>
      </AppCard>
    </EntranceView>
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
      backgroundColor: colors.background,
      flexGrow: 1,
    },
    loadingShell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 24,
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
      width: 150,
      height: 214,
      borderRadius: radius.xxl,
      backgroundColor: 'rgba(247,251,255,0.1)',
      top: -44,
      right: -54,
      transform: [{ rotate: '14deg' }],
    },
    heroGridLine: {
      position: 'absolute',
      height: 1,
      left: 24,
      right: 24,
      bottom: 94,
      backgroundColor: 'rgba(247,251,255,0.12)',
    },
    heroBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
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
    metricsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 18,
    },
    metricCard: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(5, 21, 46, 0.22)',
      borderWidth: 1,
      borderColor: 'rgba(247,251,255,0.1)',
    },
    errorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.errorMuted,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    itemIcon: {
      width: 46,
      height: 46,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowMain: {
      flex: 1,
    },
    priceBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 14,
    },
    metaPill: {
      maxWidth: '100%',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 14,
    },
  });

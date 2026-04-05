import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal } from './design-system';
import { Button } from './design-system';
import { getColors } from '../utils/colors';
import { SPACING, BORDER_RADIUS } from '../utils/spacing';
import { TEXT_STYLES } from '../utils/typography';

const FilterModal = ({ visible, onClose, filters, onFilterChange, isDarkMode, isRTL }) => {
  const { t } = useTranslation();
  const colors = getColors(isDarkMode);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterToggle = (filterName) => {
    setLocalFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      maxDistance: 50,
      isOpen: false,
      includeEmergency: false,
      openHoursOnly: false,
    });
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('home.filters', 'Filters')}
      isDarkMode={isDarkMode}
    >
      <ScrollView style={styles.content}>
        {/* Open Pharmacies Only */}
        <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
          <View style={styles.filterLeft}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
              {t('home.openNow', 'Open now')}
            </Text>
            <Text style={[styles.filterDescription, { color: colors.textSecondary }]}>
              {t('home.showOnlyOpen', 'Show only currently open pharmacies')}
            </Text>
          </View>
          <Switch
            value={localFilters.openHoursOnly}
            onValueChange={() => handleFilterToggle('openHoursOnly')}
            thumbColor={localFilters.openHoursOnly ? '#10B981' : '#FFFFFF'}
            trackColor={{ false: '#E0E0E0', true: '#00C853' }}
          />
        </View>

        {/* Emergency Only */}
        <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
          <View style={styles.filterLeft}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
              {t('home.emergencyOnly', 'Emergency pharmacies')}
            </Text>
            <Text style={[styles.filterDescription, { color: colors.textSecondary }]}>
              {t('home.showOnlyEmergency', 'Show only emergency pharmacies')}
            </Text>
          </View>
          <Switch
            value={localFilters.includeEmergency}
            onValueChange={() => handleFilterToggle('includeEmergency')}
            thumbColor={localFilters.includeEmergency ? '#F59E0B' : '#FFFFFF'}
            trackColor={{ false: '#E0E0E0', true: '#FCD34D' }}
          />
        </View>

        {/* Distance Slider Info */}
        <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
          <View style={styles.filterLeft}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
              {t('home.maxDistance', 'Maximum distance')}
            </Text>
            <Text style={[styles.filterDescription, { color: colors.textSecondary }]}>
              {localFilters.maxDistance} km
            </Text>
          </View>
          <Feather name="info" size={18} color={colors.textSecondary} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title={t('home.reset', 'Reset')}
            onPress={handleReset}
            variant="outlined"
            isDarkMode={isDarkMode}
            fullWidth={true}
            style={{ marginBottom: SPACING.md }}
          />
          <Button
            title={t('home.apply', 'Apply')}
            onPress={handleApply}
            variant="contained"
            color="primary"
            isDarkMode={isDarkMode}
            fullWidth={true}
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  filterLeft: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  filterLabel: {
    ...TEXT_STYLES.bodyBold,
    marginBottom: SPACING.xs,
  },
  filterDescription: {
    ...TEXT_STYLES.caption,
  },
  actionsContainer: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});

export default FilterModal;

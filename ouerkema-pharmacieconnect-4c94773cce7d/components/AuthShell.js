import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../utils/theme';
import { AppCard, AppText } from './design-system';

export default function AuthShell({
  badge,
  title,
  subtitle,
  highlights,
  footerNote,
  children,
}) {
  const { colors, radius, shadows, isRTL } = useAppTheme();

  const styles = StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.backgroundAccent,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 28,
    },
    stack: {
      gap: 16,
    },
    hero: {
      backgroundColor: colors.primary,
      borderRadius: radius.xxl,
      padding: 24,
      overflow: 'hidden',
      ...shadows.floating,
    },
    topLine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 5,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    orbOne: {
      position: 'absolute',
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: 'rgba(255,255,255,0.08)',
      top: -50,
      right: isRTL ? undefined : -54,
      left: isRTL ? -54 : undefined,
    },
    orbTwo: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(106, 202, 255, 0.2)',
      bottom: -26,
      right: isRTL ? undefined : 28,
      left: isRTL ? 28 : undefined,
    },
    gridLine: {
      position: 'absolute',
      bottom: 22,
      left: isRTL ? 24 : undefined,
      right: isRTL ? undefined : 24,
      width: 96,
      height: 96,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    badge: {
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.14)',
      marginBottom: 18,
    },
    highlights: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 18,
    },
    highlight: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    trustRow: {
      marginTop: 20,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.12)',
    },
    trustItem: {
      flex: 1,
    },
    formCard: {
      borderRadius: radius.xxl,
      backgroundColor: colors.surface,
    },
    formContent: {
      padding: 20,
    },
    footerNote: {
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingTop: 4,
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stack}>
            <View style={styles.hero}>
              <View style={styles.topLine} />
              <View style={styles.orbOne} />
              <View style={styles.orbTwo} />
              <View style={styles.gridLine} />
              {badge ? <View style={styles.badge}>{badge}</View> : null}
              <AppText variant="displaySmall" color="#FFFFFF">{title}</AppText>
              <AppText variant="bodyMedium" color="rgba(255,255,255,0.84)" style={{ marginTop: 8 }}>
                {subtitle}
              </AppText>
              {highlights?.length ? (
                <View style={styles.highlights}>
                  {highlights.map((item) => (
                    <View key={item} style={styles.highlight}>
                      <AppText variant="labelMedium" color="#FFFFFF">{item}</AppText>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <AppText variant="labelSmall" color="rgba(255,255,255,0.7)">Experience</AppText>
                  <AppText variant="labelLarge" color="#FFFFFF" style={{ marginTop: 4 }}>
                    Patient-first
                  </AppText>
                </View>
                <View style={styles.trustItem}>
                  <AppText variant="labelSmall" color="rgba(255,255,255,0.7)">Security</AppText>
                  <AppText variant="labelLarge" color="#FFFFFF" style={{ marginTop: 4 }}>
                    Verified access
                  </AppText>
                </View>
              </View>
            </View>
            <AppCard style={styles.formCard} contentStyle={styles.formContent} elevation={3}>
              {children}
            </AppCard>
            {footerNote ? (
              <View style={styles.footerNote}>
                <AppText variant="bodySmall" color={colors.textSecondary} align="center">
                  {footerNote}
                </AppText>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

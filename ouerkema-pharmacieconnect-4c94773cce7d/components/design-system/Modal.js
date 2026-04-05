import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../../utils/colors';
import { SPACING, BORDER_RADIUS, LAYOUT } from '../../utils/spacing';
import { getContextualShadow } from '../../utils/shadows';

/**
 * Modal Component - Animated modal with slide-up and fade-in effect
 */
const CustomModal = ({
  visible,
  onClose,
  title,
  children,
  isDarkMode = false,
  showCloseButton = true,
  fullHeight = false,
  animationType = 'slide-up',
}) => {
  const colors = getColors(isDarkMode);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shadow = getContextualShadow(5, isDarkMode);
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background || '#FFFFFF',
      borderTopLeftRadius: BORDER_RADIUS.xl,
      borderTopRightRadius: BORDER_RADIUS.xl,
      paddingHorizontal: LAYOUT.modalPadding,
      paddingTop: LAYOUT.modalPadding,
      paddingBottom: SPACING.xl,
      maxHeight: fullHeight ? screenHeight - 40 : Math.min(screenHeight * 0.85, 600),
      minHeight: 200,
      ...shadow,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: LAYOUT.modalPadding,
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: 'relative',
      width: '100%',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      flex: 1,
    },
    closeButton: {
      padding: SPACING.sm,
      position: 'absolute',
      right: 0,
      top: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -12,
    },
    bodyContainer: {
      width: '100%',
      paddingBottom: SPACING.md,
      flexGrow: 0,
    },
  });

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          pointerEvents="auto"
        />

        <Animated.View
          style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}
          pointerEvents="auto"
        >
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView
            style={styles.bodyContainer}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default CustomModal;

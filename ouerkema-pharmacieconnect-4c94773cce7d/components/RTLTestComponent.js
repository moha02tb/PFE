import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../screens/LanguageContext';
import { useTheme } from '../screens/ThemeContext';

// This is a test component to verify RTL functionality
// You can add this to any screen temporarily for testing
export default function RTLTestComponent() {
  const { isRTL, language } = useLanguage();
  const { isDarkMode } = useTheme();

  const styles = getStyles(isDarkMode, isRTL);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RTL Test Component</Text>
      <Text style={styles.status}>
        Current Language: {language}
      </Text>
      <Text style={styles.status}>
        RTL Mode: {isRTL ? 'Active' : 'Inactive'}
      </Text>

      <View style={styles.testRow}>
        <Feather name="star" size={20} color="#FFD700" />
        <Text style={styles.testText}>Icon + Text Test</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Button</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardTest}>
        <Text style={styles.cardTitle}>Test Card</Text>
        <Text style={styles.cardText}>
          This text should align to the right in RTL mode and to the left in LTR mode.
          النص العربي يجب أن يظهر من اليمين إلى اليسار.
        </Text>
      </View>
    </View>
  );
}

const getStyles = (isDarkMode, isRTL = false) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: isDarkMode ? '#2E2E2E' : '#F0F0F0',
    margin: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: isRTL ? '#4CAF50' : '#2196F3',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#000',
    textAlign: isRTL ? 'right' : 'left',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: isDarkMode ? '#ccc' : '#666',
    textAlign: isRTL ? 'right' : 'left',
    marginBottom: 4,
  },
  testRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginVertical: 12,
    padding: 8,
    backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
    borderRadius: 6,
    gap: 8,
  },
  testText: {
    flex: 1,
    fontSize: 16,
    color: isDarkMode ? '#fff' : '#000',
    textAlign: isRTL ? 'right' : 'left',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTest: {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    ...(isRTL ? { borderRightWidth: 4, borderRightColor: '#4CAF50' } : { borderLeftWidth: 4, borderLeftColor: '#2196F3' }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#000',
    textAlign: isRTL ? 'right' : 'left',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: isDarkMode ? '#ccc' : '#666',
    textAlign: isRTL ? 'right' : 'left',
    lineHeight: 20,
  },
});

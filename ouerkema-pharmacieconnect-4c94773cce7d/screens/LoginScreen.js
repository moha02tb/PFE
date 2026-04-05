import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useTranslation } from 'react-i18next';

const LoginScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { login, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation
  const validateForm = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError(t('Email is required'));
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError(t('Invalid email address'));
      valid = false;
    }

    if (!password) {
      setPasswordError(t('Password is required'));
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(t('Password must be at least 6 characters'));
      valid = false;
    }

    return valid;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      Alert.alert(t('Login Failed'), result.error);
    }
  };

  // Navigate to register
  const handleNavigateToRegister = () => {
    navigation.replace('Register');
  };

  const styles = createStyles(isDarkMode, isRTL);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1E1E1E' : '#fff' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#333' }]}>
            {t('Pharmacies de Garde')}
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#aaa' : '#666' }]}>
            {t('Sign in to your account')}
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View
            style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#4a2a2a' : '#ffe6e6' }]}
          >
            <Text style={[styles.errorText, { color: isDarkMode ? '#ff6b6b' : '#d32f2f' }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: isDarkMode ? '#ccc' : '#333' }]}>
            {t('Email')} *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                color: isDarkMode ? '#fff' : '#333',
                borderColor: emailError ? '#d32f2f' : isDarkMode ? '#444' : '#ddd',
              },
            ]}
            placeholder={t('Enter your email')}
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: isDarkMode ? '#ccc' : '#333' }]}>
            {t('Password')} *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                color: isDarkMode ? '#fff' : '#333',
                borderColor: passwordError ? '#d32f2f' : isDarkMode ? '#444' : '#ddd',
              },
            ]}
            placeholder={t('Enter your password')}
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            secureTextEntry={true}
            editable={!loading}
          />
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            { backgroundColor: loading ? '#1976d2' : '#2196f3', opacity: loading ? 0.7 : 1 },
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>{t('Sign In')}</Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: isDarkMode ? '#aaa' : '#666' }]}>
            {t("Don't have an account?")}{' '}
          </Text>
          <TouchableOpacity onPress={handleNavigateToRegister} disabled={loading}>
            <Text style={[styles.registerLink, { color: '#2196f3', opacity: loading ? 0.7 : 1 }]}>
              {t('Sign Up')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (isDarkMode, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingVertical: 40,
    },
    header: {
      marginBottom: 30,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      marginBottom: 20,
    },
    errorContainer: {
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: '#d32f2f',
    },
    errorText: {
      fontSize: 14,
      fontWeight: '500',
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      textAlign: isRTL ? 'right' : 'left',
    },
    fieldError: {
      color: '#d32f2f',
      fontSize: 12,
      marginTop: 4,
      fontStyle: 'italic',
    },
    loginButton: {
      borderRadius: 8,
      paddingVertical: 14,
      marginTop: 10,
      marginBottom: 20,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 48,
    },
    loginButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    registerContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    registerText: {
      fontSize: 14,
    },
    registerLink: {
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default LoginScreen;

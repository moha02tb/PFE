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

const RegisterScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { register, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation
  const validateForm = () => {
    let valid = true;
    setEmailError('');
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!email.trim()) {
      setEmailError(t('Email is required'));
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError(t('Invalid email address'));
      valid = false;
    }

    if (!username.trim()) {
      setUsernameError(t('Username is required'));
      valid = false;
    } else if (username.length < 3) {
      setUsernameError(t('Username must be at least 3 characters'));
      valid = false;
    }

    if (!password) {
      setPasswordError(t('Password is required'));
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(t('Password must be at least 6 characters'));
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('Please confirm your password'));
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('Passwords do not match'));
      valid = false;
    }

    return valid;
  };

  // Handle registration
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await register(email, password, username);
    if (!result.success) {
      Alert.alert(t('Registration Failed'), result.error);
    }
  };

  // Navigate back to login
  const handleNavigateToLogin = () => {
    navigation.replace('Login');
  };

  const styles = createStyles(isDarkMode, isRTL);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1E1E1E' : '#fff' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#333' }]}>
            {t('Create Account')}
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#aaa' : '#666' }]}>
            {t('Join Pharmacies de Garde')}
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

        {/* Username Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: isDarkMode ? '#ccc' : '#333' }]}>
            {t('Username')} *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                color: isDarkMode ? '#fff' : '#333',
                borderColor: usernameError ? '#d32f2f' : isDarkMode ? '#444' : '#ddd',
              },
            ]}
            placeholder={t('Choose a username')}
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setUsernameError('');
            }}
            autoCapitalize="none"
            editable={!loading}
          />
          {usernameError ? <Text style={styles.fieldError}>{usernameError}</Text> : null}
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
            placeholder={t('Create a password')}
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

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: isDarkMode ? '#ccc' : '#333' }]}>
            {t('Confirm Password')} *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                color: isDarkMode ? '#fff' : '#333',
                borderColor: confirmPasswordError ? '#d32f2f' : isDarkMode ? '#444' : '#ddd',
              },
            ]}
            placeholder={t('Confirm your password')}
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError('');
            }}
            secureTextEntry={true}
            editable={!loading}
          />
          {confirmPasswordError ? (
            <Text style={styles.fieldError}>{confirmPasswordError}</Text>
          ) : null}
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            { backgroundColor: loading ? '#1976d2' : '#2196f3', opacity: loading ? 0.7 : 1 },
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.registerButtonText}>{t('Create Account')}</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: isDarkMode ? '#aaa' : '#666' }]}>
            {t('Already have an account?')}{' '}
          </Text>
          <TouchableOpacity onPress={handleNavigateToLogin} disabled={loading}>
            <Text style={[styles.loginLink, { color: '#2196f3', opacity: loading ? 0.7 : 1 }]}>
              {t('Sign In')}
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
    registerButton: {
      borderRadius: 8,
      paddingVertical: 14,
      marginTop: 10,
      marginBottom: 20,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 48,
    },
    registerButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    loginContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    loginText: {
      fontSize: 14,
    },
    loginLink: {
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default RegisterScreen;

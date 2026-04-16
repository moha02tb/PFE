import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import logger from '../utils/logger';

const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = '@PharmaciesDeGarde_Language';

// Language mapping for display names
const LANGUAGE_DISPLAY_NAMES = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

const LANGUAGE_KEYS = {
  Français: 'fr',
  English: 'en',
  العربية: 'ar',
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('Français');
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);
  const { i18n: i18nInstance } = useTranslation();

  // Load saved language on app start
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        const displayName = LANGUAGE_DISPLAY_NAMES[savedLanguage] || 'Français';
        setLanguageState(displayName);
        await i18nInstance.changeLanguage(savedLanguage);

        // Set RTL state based on saved language - No restart needed
        const rtlRequired = savedLanguage === 'ar';
        setIsRTL(rtlRequired);

        // Allow RTL for native components
        I18nManager.allowRTL(rtlRequired);
      }
    } catch (error) {
      logger.error('LanguageContext', 'Error loading saved language', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (displayName) => {
    try {
      setIsChangingLanguage(true);
      const languageKey = LANGUAGE_KEYS[displayName];
      if (languageKey) {
        setLanguageState(displayName);
        await i18nInstance.changeLanguage(languageKey);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageKey);

        // Handle RTL for Arabic - Instant switching without restart
        const rtlRequired = languageKey === 'ar';
        setIsRTL(rtlRequired);

        // Update I18nManager for native components but don't force restart
        if (I18nManager.isRTL !== rtlRequired) {
          I18nManager.allowRTL(rtlRequired);
        }
      }
    } catch (error) {
      logger.error('LanguageContext', 'Error setting language', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const getCurrentLanguageKey = () => {
    return LANGUAGE_KEYS[language] || 'fr';
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isLoading,
        isChangingLanguage,
        getCurrentLanguageKey,
        availableLanguages: Object.keys(LANGUAGE_KEYS),
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to access language context
 * @returns {object} Language context object with language, setLanguage, isRTL, etc.
 * @requires Must be wrapped with LanguageProvider component
 * @fails_safely Returns default context if not wrapped with provider (development warning)
 *
 * Usage:
 * ```
 * const { language, setLanguage, isRTL } = useLanguage();
 * ```
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);

  // Fail-safe: return sensible defaults if context not available
  if (!context) {
    logger.warn(
      'LanguageContext',
      'useLanguage called outside of LanguageProvider. Returning default values.'
    );

    return {
      language: 'Français',
      setLanguage: () => {
        logger.warn('LanguageContext', 'setLanguage called but provider not available');
      },
      isLoading: false,
      isChangingLanguage: false,
      getCurrentLanguageKey: () => 'fr',
      availableLanguages: ['fr', 'en', 'ar'],
      isRTL: false,
    };
  }

  return context;
};

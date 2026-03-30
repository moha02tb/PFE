import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

const LANGUAGE_STORAGE_KEY = '@PharmaciesDeGarde_Language';

// Language detection plugin
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async function(callback) {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        callback('fr'); // Default language
      }
    } catch (error) {
      console.log('Error reading language from storage:', error);
      callback('fr'); // Default language
    }
  },
  init: () => {},
  cacheUserLanguage: async function(language) {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.log('Error saving language to storage:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'fr',
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
    },
    interpolation: {
      escapeValue: false,
    },
    debug: false,
  });

export default i18n;

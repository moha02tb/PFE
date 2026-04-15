import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../lib/translations';

const LANGUAGE_KEY = 'admin-language';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Francais' },
  { code: 'ar', label: 'العربية' },
];

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'en');

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languages,
      currentLanguage: languages.find((item) => item.code === language) || languages[0],
      t: (key, vars = {}) => {
        const read = (obj, path) =>
          path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
        const template = read(translations[language], key) ?? read(translations.en, key) ?? key;
        return Object.entries(vars).reduce(
          (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
          template
        );
      },
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

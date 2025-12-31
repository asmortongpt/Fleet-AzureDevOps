import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translations
import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';
import frFR from './locales/fr-FR.json';
import deDE from './locales/de-DE.json';
import arSA from './locales/ar-SA.json';
import heIL from './locales/he-IL.json';

export const languages = {
  'en-US': { name: 'English (US)', nativeName: 'English', dir: 'ltr', flag: '🇺🇸' },
  'es-ES': { name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
  'fr-FR': { name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  'de-DE': { name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  'ar-SA': { name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  'he-IL': { name: 'Hebrew', nativeName: 'עברית', dir: 'rtl', flag: '🇮🇱' },
} as const;

export type LanguageCode = keyof typeof languages;

/**
 * Initialize i18next with all supported languages
 * Supports automatic language detection and RTL languages
 */
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': { translation: enUS },
      'es-ES': { translation: esES },
      'fr-FR': { translation: frFR },
      'de-DE': { translation: deDE },
      'ar-SA': { translation: arSA },
      'he-IL': { translation: heIL },
    },
    fallbackLng: 'en-US',
    supportedLngs: Object.keys(languages),

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferred-language',
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },

    // Debug mode in development
    debug: import.meta.env.DEV,

    // Performance optimization
    load: 'languageOnly',
    preload: ['en-US'],

    // Missing key handler
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`Missing translation key: ${key} for languages: ${lngs.join(', ')}`);
      }
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const langCode = lng as LanguageCode;
  const language = languages[langCode];

  if (language) {
    document.dir = language.dir;
    document.documentElement.lang = lng;
    document.documentElement.setAttribute('data-lang', lng);
  }
});

// Set initial direction
const currentLang = i18n.language as LanguageCode;
if (languages[currentLang]) {
  document.dir = languages[currentLang].dir;
  document.documentElement.lang = currentLang;
}

export default i18n;

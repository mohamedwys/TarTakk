import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import fr from '../../locales/fr.json';

export type SupportedLanguage = 'fr' | 'ar' | 'en';

const STORAGE_KEY = '@app/language';
const DEFAULT_LANG: SupportedLanguage = 'fr';

const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: DEFAULT_LANG,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

async function loadStoredLanguage() {
  // ⚡ Skip on SSR (no window/localStorage)
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'ar' || stored === 'en') {
      if (stored !== i18n.language) {
        await i18n.changeLanguage(stored);
      }
    }
  } catch (err) {
    console.warn('[i18n] Failed to load stored language:', err);
  }
}

i18n.on('languageChanged', (lng) => {
  // ⚡ Skip on SSR
  if (typeof window === 'undefined') {
    return;
  }
  
  AsyncStorage.setItem(STORAGE_KEY, lng).catch((err) => {
    console.warn('[i18n] Failed to save language:', err);
  });
});

loadStoredLanguage();

export default i18n;

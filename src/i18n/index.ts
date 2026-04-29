import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import fr from '../../locales/fr.json';

const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
  en: { translation: en },
};

function getDeviceLanguage(): 'fr' | 'ar' | 'en' {
  const locales = Localization.getLocales();
  const tag = locales[0]?.languageCode?.toLowerCase();
  if (tag === 'ar') return 'ar';
  if (tag === 'en') return 'en';
  return 'fr';
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;

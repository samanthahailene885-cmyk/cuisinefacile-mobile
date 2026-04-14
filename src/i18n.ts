import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr/common.json';
import en from './locales/en/common.json';
import es from './locales/es/common.json';

const LANGUAGE_STORAGE_KEY = 'cuisinefacile.mobile.language';

const resources = {
  fr: { common: fr },
  en: { common: en },
  es: { common: es },
} as const;

type SupportedLanguage = keyof typeof resources;

let initPromise: Promise<void> | null = null;

export const initI18n = (): Promise<void> => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    let initialLanguage: SupportedLanguage = 'fr';
    try {
      const raw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (raw === 'fr' || raw === 'en' || raw === 'es') initialLanguage = raw;
    } catch {
      // ignore
    }

    if (!i18n.isInitialized) {
      await i18n
        .use(initReactI18next)
        .init({
          resources: resources as any,
          lng: initialLanguage,
          fallbackLng: 'fr',
          ns: ['common'],
          defaultNS: 'common',
          interpolation: { escapeValue: false },
          compatibilityJSON: 'v4',
        });
    } else {
      await i18n.changeLanguage(initialLanguage);
    }
  })();
  return initPromise;
};

export { LANGUAGE_STORAGE_KEY };
export type { SupportedLanguage };
export default i18n;

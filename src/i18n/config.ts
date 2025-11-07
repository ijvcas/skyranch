import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import deviceLanguageDetector from './deviceLanguageDetector';

// Import translation files
import commonES from './locales/es/common.json';
import animalsES from './locales/es/animals.json';
import financialES from './locales/es/financial.json';
import breedingES from './locales/es/breeding.json';
import healthES from './locales/es/health.json';
import reportsES from './locales/es/reports.json';
import settingsES from './locales/es/settings.json';
import authES from './locales/es/auth.json';
import dashboardES from './locales/es/dashboard.json';

import commonEN from './locales/en/common.json';
import animalsEN from './locales/en/animals.json';
import financialEN from './locales/en/financial.json';
import breedingEN from './locales/en/breeding.json';
import healthEN from './locales/en/health.json';
import reportsEN from './locales/en/reports.json';
import settingsEN from './locales/en/settings.json';
import authEN from './locales/en/auth.json';
import dashboardEN from './locales/en/dashboard.json';

import commonPT from './locales/pt/common.json';
import animalsPT from './locales/pt/animals.json';
import financialPT from './locales/pt/financial.json';
import breedingPT from './locales/pt/breeding.json';
import healthPT from './locales/pt/health.json';
import reportsPT from './locales/pt/reports.json';
import settingsPT from './locales/pt/settings.json';
import authPT from './locales/pt/auth.json';
import dashboardPT from './locales/pt/dashboard.json';

import commonFR from './locales/fr/common.json';
import animalsFR from './locales/fr/animals.json';
import financialFR from './locales/fr/financial.json';
import breedingFR from './locales/fr/breeding.json';
import healthFR from './locales/fr/health.json';
import reportsFR from './locales/fr/reports.json';
import settingsFR from './locales/fr/settings.json';
import authFR from './locales/fr/auth.json';
import dashboardFR from './locales/fr/dashboard.json';

const resources = {
  es: {
    common: commonES,
    animals: animalsES,
    financial: financialES,
    breeding: breedingES,
    health: healthES,
    reports: reportsES,
    settings: settingsES,
    auth: authES,
    dashboard: dashboardES
  },
  en: {
    common: commonEN,
    animals: animalsEN,
    financial: financialEN,
    breeding: breedingEN,
    health: healthEN,
    reports: reportsEN,
    settings: settingsEN,
    auth: authEN,
    dashboard: dashboardEN
  },
  pt: {
    common: commonPT,
    animals: animalsPT,
    financial: financialPT,
    breeding: breedingPT,
    health: healthPT,
    reports: reportsPT,
    settings: settingsPT,
    auth: authPT,
    dashboard: dashboardPT
  },
  fr: {
    common: commonFR,
    animals: animalsFR,
    financial: financialFR,
    breeding: breedingFR,
    health: healthFR,
    reports: reportsFR,
    settings: settingsFR,
    auth: authFR,
    dashboard: dashboardFR
  }
};

i18n
  .use(deviceLanguageDetector)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'pt', 'fr'],
    defaultNS: 'common',
    ns: ['common', 'animals', 'financial', 'breeding', 'health', 'reports', 'settings', 'auth', 'dashboard'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['querystring', 'localStorage', 'deviceLanguage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lng'
    }
  });

// Debug logging
i18n.on('languageChanged', (lng) => {
  console.log('🌍 Language changed to:', lng);
});

export default i18n;

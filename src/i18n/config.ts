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
import usersES from './locales/es/users.json';
import calendarES from './locales/es/calendar.json';
import lotsES from './locales/es/lots.json';
import notificationsES from './locales/es/notifications.json';
import weatherES from './locales/es/weather.json';
import weatherConditionsES from './locales/es/weatherConditions.json';
import pricingES from './locales/es/pricing.json';
import aiAssistantES from './locales/es/aiAssistant.json';
import emailES from './locales/es/email.json';
import tasksES from './locales/es/tasks.json';

import commonEN from './locales/en/common.json';
import animalsEN from './locales/en/animals.json';
import financialEN from './locales/en/financial.json';
import breedingEN from './locales/en/breeding.json';
import healthEN from './locales/en/health.json';
import reportsEN from './locales/en/reports.json';
import settingsEN from './locales/en/settings.json';
import authEN from './locales/en/auth.json';
import dashboardEN from './locales/en/dashboard.json';
import usersEN from './locales/en/users.json';
import calendarEN from './locales/en/calendar.json';
import lotsEN from './locales/en/lots.json';
import notificationsEN from './locales/en/notifications.json';
import weatherEN from './locales/en/weather.json';
import weatherConditionsEN from './locales/en/weatherConditions.json';
import pricingEN from './locales/en/pricing.json';
import aiAssistantEN from './locales/en/aiAssistant.json';
import emailEN from './locales/en/email.json';
import tasksEN from './locales/en/tasks.json';

import commonPT from './locales/pt/common.json';
import animalsPT from './locales/pt/animals.json';
import financialPT from './locales/pt/financial.json';
import breedingPT from './locales/pt/breeding.json';
import healthPT from './locales/pt/health.json';
import reportsPT from './locales/pt/reports.json';
import settingsPT from './locales/pt/settings.json';
import authPT from './locales/pt/auth.json';
import dashboardPT from './locales/pt/dashboard.json';
import usersPT from './locales/pt/users.json';
import calendarPT from './locales/pt/calendar.json';
import lotsPT from './locales/pt/lots.json';
import notificationsPT from './locales/pt/notifications.json';
import weatherPT from './locales/pt/weather.json';
import weatherConditionsPT from './locales/pt/weatherConditions.json';
import pricingPT from './locales/pt/pricing.json';
import aiAssistantPT from './locales/pt/aiAssistant.json';
import emailPT from './locales/pt/email.json';
import tasksPT from './locales/pt/tasks.json';

import commonFR from './locales/fr/common.json';
import animalsFR from './locales/fr/animals.json';
import financialFR from './locales/fr/financial.json';
import breedingFR from './locales/fr/breeding.json';
import healthFR from './locales/fr/health.json';
import reportsFR from './locales/fr/reports.json';
import settingsFR from './locales/fr/settings.json';
import authFR from './locales/fr/auth.json';
import dashboardFR from './locales/fr/dashboard.json';
import usersFR from './locales/fr/users.json';
import calendarFR from './locales/fr/calendar.json';
import lotsFR from './locales/fr/lots.json';
import notificationsFR from './locales/fr/notifications.json';
import weatherFR from './locales/fr/weather.json';
import weatherConditionsFR from './locales/fr/weatherConditions.json';
import pricingFR from './locales/fr/pricing.json';
import aiAssistantFR from './locales/fr/aiAssistant.json';
import emailFR from './locales/fr/email.json';
import tasksFR from './locales/fr/tasks.json';

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
    dashboard: dashboardES,
    users: usersES,
    calendar: calendarES,
    lots: lotsES,
    notifications: notificationsES,
    weather: weatherES,
    weatherConditions: weatherConditionsES,
    pricing: pricingES,
    aiAssistant: aiAssistantES,
    email: emailES,
    tasks: tasksES
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
    dashboard: dashboardEN,
    users: usersEN,
    calendar: calendarEN,
    lots: lotsEN,
    notifications: notificationsEN,
    weather: weatherEN,
    weatherConditions: weatherConditionsEN,
    pricing: pricingEN,
    aiAssistant: aiAssistantEN,
    email: emailEN,
    tasks: tasksEN
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
    dashboard: dashboardPT,
    users: usersPT,
    calendar: calendarPT,
    lots: lotsPT,
    notifications: notificationsPT,
    weather: weatherPT,
    weatherConditions: weatherConditionsPT,
    pricing: pricingPT,
    aiAssistant: aiAssistantPT,
    email: emailPT,
    tasks: tasksPT
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
    dashboard: dashboardFR,
    users: usersFR,
    calendar: calendarFR,
    lots: lotsFR,
    notifications: notificationsFR,
    weather: weatherFR,
    weatherConditions: weatherConditionsFR,
    pricing: pricingFR,
    aiAssistant: aiAssistantFR,
    email: emailFR,
    tasks: tasksFR
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
    ns: ['common', 'animals', 'financial', 'breeding', 'health', 'reports', 'settings', 'auth', 'dashboard', 'users', 'calendar', 'lots', 'notifications', 'weather', 'weatherConditions', 'pricing', 'aiAssistant', 'email', 'tasks'],
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

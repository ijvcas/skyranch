import { Device } from '@capacitor/device';
import { LanguageDetectorAsyncModule } from 'i18next';

const deviceLanguageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  detect: (callback) => {
    Device.getLanguageCode()
      .then(info => {
        const deviceLang = info.value.split('-')[0]; // 'en-US' -> 'en'
        
        // Map to supported languages
        const supportedLangs = ['es', 'en', 'pt', 'fr'];
        const lang = supportedLangs.includes(deviceLang) ? deviceLang : 'es';
        
        console.log('🌍 Device language detected:', deviceLang, '→', lang);
        callback(lang);
      })
      .catch(error => {
        console.error('❌ Device language detection failed:', error);
        callback('es'); // fallback to Spanish
      });
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

export default deviceLanguageDetector;

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export type Language = 'es' | 'en' | 'pt' | 'fr';

export const LANGUAGES = {
  es: { name: 'Español', flag: '🇪🇸' },
  en: { name: 'English', flag: '🇬🇧' },
  pt: { name: 'Português', flag: '🇵🇹' },
  fr: { name: 'Français', flag: '🇫🇷' }
} as const;

export const useLanguage = () => {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync with iOS Settings on app launch and when returning from Settings
  useEffect(() => {
    const syncWithiOSSettings = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('🌐 [LANGUAGE SYNC] Not native platform, skipping iOS sync');
        return;
      }
      
      try {
        console.log('🔍 [LANGUAGE SYNC] Reading from iOS Settings...');
        // Read from iOS Settings via Capacitor Preferences
        const { value } = await Preferences.get({ key: 'app_language' });
        console.log('📱 [LANGUAGE SYNC] iOS Settings value:', value, 'Current language:', i18n.language);
        
        if (value && value !== i18n.language) {
          console.log('🔄 [LANGUAGE SYNC] Language changed in iOS Settings! Updating app from', i18n.language, 'to', value);
          await changeLanguage(value as Language);
        } else {
          console.log('✓ [LANGUAGE SYNC] Language already in sync');
        }
      } catch (error) {
        console.error('❌ [LANGUAGE SYNC] Error syncing with iOS Settings:', error);
      }
    };

    syncWithiOSSettings();

    // Listen for app state changes (returning from iOS Settings)
    if (Capacitor.isNativePlatform()) {
      let listenerHandle: any;
      let pollingInterval: any;
      
      const setupListener = async () => {
        console.log('👂 [LANGUAGE SYNC] Setting up app state listener...');
        listenerHandle = await App.addListener('appStateChange', async ({ isActive }) => {
          console.log('📲 [LANGUAGE SYNC] App state changed:', { isActive, isSyncing });
          if (isActive && !isSyncing) {
            console.log('🔄 [LANGUAGE SYNC] App became active, syncing language...');
            setIsSyncing(true);
            await syncWithiOSSettings();
            setIsSyncing(false);
            console.log('✅ [LANGUAGE SYNC] Sync completed');
          }
        });
        console.log('✅ [LANGUAGE SYNC] App state listener registered');
      };
      
      setupListener();
      
      // Add polling as backup mechanism (check every 5 seconds)
      pollingInterval = setInterval(async () => {
        if (!isSyncing) {
          const { value } = await Preferences.get({ key: 'app_language' });
          if (value && value !== i18n.language) {
            console.log('🔄 [POLLING] Language change detected from', i18n.language, 'to', value);
            await changeLanguage(value as Language);
          }
        }
      }, 5000);

      return () => {
        console.log('🧹 [LANGUAGE SYNC] Cleaning up app state listener and polling');
        if (listenerHandle) {
          listenerHandle.remove();
        }
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      };
    }
  }, [i18n, isSyncing]);

  const changeLanguage = async (lang: Language) => {
    try {
      console.log('🔄 [LANGUAGE CHANGE] Starting language change to:', lang);
      
      // Change language in i18next
      await i18n.changeLanguage(lang);
      console.log('✅ [LANGUAGE CHANGE] i18next language changed');
      
      // Persist to localStorage (for web) and Capacitor Preferences (syncs with iOS Settings)
      localStorage.setItem('i18nextLng', lang);
      console.log('💾 [LANGUAGE CHANGE] Saved to localStorage');
      
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: 'app_language', value: lang });
        console.log('📱 [LANGUAGE CHANGE] Saved to iOS Settings via Preferences');
      }
      
      // Update user preference in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('app_users')
          .update({ preferred_language: lang })
          .eq('id', user.id);
        
        if (error) {
          console.error('❌ [LANGUAGE CHANGE] Error updating database:', error);
        } else {
          console.log('✅ [LANGUAGE CHANGE] Database updated with preferred language');
        }
      }
      
      toast({
        title: t('settings:messages.languageChanged'),
        description: LANGUAGES[lang].name
      });
      
      console.log('✅ [LANGUAGE CHANGE] Language change complete');
    } catch (error) {
      console.error('❌ [LANGUAGE CHANGE] Error changing language:', error);
      toast({
        title: t('common:error'),
        description: t('settings:messages.error'),
        variant: 'destructive'
      });
    }
  };

  return {
    language: i18n.language as Language,
    changeLanguage,
    languages: LANGUAGES,
    t,
    isSyncing
  };
};

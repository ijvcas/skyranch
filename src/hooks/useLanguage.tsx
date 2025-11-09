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
      if (!Capacitor.isNativePlatform()) return;
      
      try {
        // Read from iOS Settings via Capacitor Preferences
        const { value } = await Preferences.get({ key: 'app_language' });
        if (value && value !== i18n.language) {
          console.log('🔄 Syncing language from iOS Settings:', value);
          await i18n.changeLanguage(value);
        }
      } catch (error) {
        console.error('Error syncing with iOS Settings:', error);
      }
    };

    syncWithiOSSettings();

    // Listen for app state changes (returning from iOS Settings)
    if (Capacitor.isNativePlatform()) {
      let listenerHandle: any;
      
      const setupListener = async () => {
        listenerHandle = await App.addListener('appStateChange', async ({ isActive }) => {
          if (isActive && !isSyncing) {
            setIsSyncing(true);
            await syncWithiOSSettings();
            setIsSyncing(false);
          }
        });
      };
      
      setupListener();

      return () => {
        if (listenerHandle) {
          listenerHandle.remove();
        }
      };
    }
  }, [i18n, isSyncing]);

  const changeLanguage = async (lang: Language) => {
    try {
      console.log('🔄 Changing language to:', lang);
      
      // Change language in i18next
      await i18n.changeLanguage(lang);
      
      // Persist to localStorage (for web) and Capacitor Preferences (syncs with iOS Settings)
      localStorage.setItem('i18nextLng', lang);
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: 'app_language', value: lang });
      }
      
      // Update user preference in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('app_users')
          .update({ preferred_language: lang })
          .eq('id', user.id);
      }
      
      toast({
        title: t('settings:messages.languageChanged'),
        description: LANGUAGES[lang].name
      });
    } catch (error) {
      console.error('❌ Error changing language:', error);
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

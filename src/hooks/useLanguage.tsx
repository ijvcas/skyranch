import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const changeLanguage = async (lang: Language) => {
    try {
      console.log('🔄 Changing language to:', lang);
      
      // Change language in i18next
      await i18n.changeLanguage(lang);
      
      // Persist to localStorage (for web)
      localStorage.setItem('i18nextLng', lang);
      
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
    t
  };
};

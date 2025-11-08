import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Preferences } from '@capacitor/preferences';

export interface FarmBranding {
  farm_name: string;
  farm_logo_url?: string;
  theme_primary_color: string;
  theme_secondary_color: string;
}

const DEFAULT_BRANDING: FarmBranding = {
  farm_name: 'SKYRANCH',
  theme_primary_color: '#16a34a',
  theme_secondary_color: '#22c55e',
};

export const useFarmBranding = () => {
  const [branding, setBranding] = useState<FarmBranding>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      // Try to load from database first
      const { data, error } = await supabase
        .from('farm_profiles')
        .select('farm_name, farm_logo_url, theme_primary_color, theme_secondary_color')
        .single();

      if (data && !error) {
        const farmBranding: FarmBranding = {
          farm_name: data.farm_name || DEFAULT_BRANDING.farm_name,
          farm_logo_url: data.farm_logo_url || undefined,
          theme_primary_color: data.theme_primary_color || DEFAULT_BRANDING.theme_primary_color,
          theme_secondary_color: data.theme_secondary_color || DEFAULT_BRANDING.theme_secondary_color,
        };
        
        setBranding(farmBranding);
        
        // Cache for offline use
        await Preferences.set({
          key: 'farm_branding',
          value: JSON.stringify(farmBranding),
        });
        
        // Apply theme colors
        applyThemeColors(farmBranding.theme_primary_color, farmBranding.theme_secondary_color);
      } else {
        // Try to load from cache
        const cached = await Preferences.get({ key: 'farm_branding' });
        if (cached.value) {
          const cachedBranding = JSON.parse(cached.value) as FarmBranding;
          setBranding(cachedBranding);
          applyThemeColors(cachedBranding.theme_primary_color, cachedBranding.theme_secondary_color);
        }
      }
    } catch (err) {
      console.error('Error loading farm branding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeColors = (primary: string, secondary: string) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--secondary-color', secondary);
    
    // Persist to localStorage for immediate reload
    localStorage.setItem('theme_colors', JSON.stringify({ primary, secondary }));
  };

  const updateBranding = async (newBranding: Partial<FarmBranding>) => {
    try {
      const { error } = await supabase
        .from('farm_profiles')
        .update(newBranding)
        .eq('id', (await supabase.from('farm_profiles').select('id').single()).data?.id);

      if (!error) {
        const updated = { ...branding, ...newBranding };
        setBranding(updated);
        
        // Cache updated branding
        await Preferences.set({
          key: 'farm_branding',
          value: JSON.stringify(updated),
        });
        
        // Apply new theme colors if changed
        if (newBranding.theme_primary_color || newBranding.theme_secondary_color) {
          applyThemeColors(
            newBranding.theme_primary_color || branding.theme_primary_color,
            newBranding.theme_secondary_color || branding.theme_secondary_color
          );
        }
        
        return { success: true };
      } else {
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.error('Error updating farm branding:', err);
      return { success: false, error: 'Failed to update branding' };
    }
  };

  return { branding, isLoading, updateBranding, reloadBranding: loadBranding };
};

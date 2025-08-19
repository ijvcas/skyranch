import { supabase } from '@/integrations/supabase/client';

// EMERGENCY FIXED: Use new database functions with explicit user ID
export const getAnimalsEmergency = async (userIdOverride?: string) => {
  try {
    console.log('🚨 EMERGENCY FIXED: Using explicit user ID functions...');
    
    // Use passed user ID or get from session
    let userId = userIdOverride;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
    }
    
    if (!userId) {
      console.error('❌ EMERGENCY: No user ID available');
      return { animals: [], stats: { total_count: 0, species_counts: {} } };
    }
    
    console.log('✅ EMERGENCY: Using user ID:', userId);
    
    // Get stats directly
    console.log('📊 EMERGENCY: Fetching stats for user:', userId);
    const { data: statsData, error: statsError } = await supabase.rpc('get_animal_stats_bypass', {
      target_user_id: userId
    });
    console.log('📊 EMERGENCY: Stats result:', { statsData, statsError });
    
    if (statsError) {
      console.error('❌ EMERGENCY: Stats bypass error:', statsError);
      return { animals: [], stats: { total_count: 0, species_counts: {} } };
    }
    
    console.log('✅ EMERGENCY: Got bypass stats:', statsData);
    
    // Get animals directly
    console.log('🐄 EMERGENCY: Fetching animals for user:', userId);
    const { data: animalsData, error: animalsError } = await supabase.rpc('get_animals_list_bypass', {
      target_user_id: userId,
      max_limit: 100
    });
    console.log('🐄 EMERGENCY: Animals result:', { animalsData, animalsError, count: animalsData?.length });
    
    if (animalsError) {
      console.error('❌ EMERGENCY: Animals bypass error:', animalsError);
      return { 
        animals: [], 
        stats: statsData?.[0] || { total_count: 0, species_counts: {} } 
      };
    }
    
    console.log('✅ EMERGENCY: Got bypass animals:', animalsData?.length);
    console.log('🎯 EMERGENCY: COMPLETE SUCCESS - returning data');
    
    return {
      animals: animalsData || [],
      stats: statsData?.[0] || { total_count: 0, species_counts: {} }
    };
    
  } catch (error) {
    console.error('❌ EMERGENCY: Exception:', error);
    return { animals: [], stats: { total_count: 0, species_counts: {} } };
  }
};
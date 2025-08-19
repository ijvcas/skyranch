import { supabase } from '@/integrations/supabase/client';

// EMERGENCY FIXED: Use new database functions with explicit user ID
export const getAnimalsEmergency = async () => {
  try {
    console.log('🚨 EMERGENCY FIXED: Using explicit user ID functions...');
    
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ EMERGENCY: No authenticated user');
      return { animals: [], stats: { total_count: 0, species_counts: {} } };
    }
    
    console.log('✅ EMERGENCY: User authenticated:', user.id);
    
    // Use the new database function with explicit user ID
    const { data: statsData, error: statsError } = await supabase.rpc('get_user_animal_stats_emergency', {
      target_user_id: user.id
    });
    
    if (statsError) {
      console.error('❌ EMERGENCY: Stats function error:', statsError);
      return { animals: [], stats: { total_count: 0, species_counts: {} } };
    }
    
    console.log('✅ EMERGENCY: Got stats data:', statsData);
    
    // Get basic animal list with explicit user ID
    const { data: animalsData, error: animalsError } = await supabase.rpc('get_user_animals_basic', {
      target_user_id: user.id,
      max_limit: 100
    });
    
    if (animalsError) {
      console.error('❌ EMERGENCY: Animals function error:', animalsError);
      return { 
        animals: [], 
        stats: statsData?.[0] || { total_count: 0, species_counts: {} } 
      };
    }
    
    console.log('✅ EMERGENCY: Got animals data:', animalsData?.length);
    
    return {
      animals: animalsData || [],
      stats: statsData?.[0] || { total_count: 0, species_counts: {} }
    };
    
  } catch (error) {
    console.error('❌ EMERGENCY: Exception:', error);
    return { animals: [], stats: { total_count: 0, species_counts: {} } };
  }
};
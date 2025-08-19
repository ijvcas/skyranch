import { supabase } from '@/integrations/supabase/client';

// EMERGENCY FIXED: Use new database functions with explicit user ID
export const getAnimalsEmergency = async () => {
  try {
    console.log('🚨 EMERGENCY FIXED: Using explicit user ID functions...');
    
    // Get the current user ID with timeout
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    );
    
    const { data: { user } } = await Promise.race([userPromise, timeoutPromise]) as any;
    if (!user) {
      console.error('❌ EMERGENCY: No authenticated user');
      return { animals: [], stats: { total_count: 0, species_counts: {} } };
    }
    
    console.log('✅ EMERGENCY: User authenticated:', user.id);
    
    // Get stats with timeout
    const statsPromise = supabase.rpc('get_animal_stats_bypass', {
      target_user_id: user.id
    });
    const statsTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Stats timeout')), 10000)
    );
    
    const { data: statsData, error: statsError } = await Promise.race([
      statsPromise, 
      statsTimeoutPromise
    ]) as any;
    
    if (statsError) {
      console.error('❌ EMERGENCY: Stats bypass error:', statsError);
      return { animals: [], stats: { total_count: 0, species_counts: {} } };
    }
    
    console.log('✅ EMERGENCY: Got bypass stats:', statsData);
    
    // Get animals with timeout
    const animalsPromise = supabase.rpc('get_animals_list_bypass', {
      target_user_id: user.id,
      max_limit: 100
    });
    const animalsTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Animals timeout')), 10000)
    );
    
    const { data: animalsData, error: animalsError } = await Promise.race([
      animalsPromise, 
      animalsTimeoutPromise
    ]) as any;
    
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
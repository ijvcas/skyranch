import { supabase } from '@/integrations/supabase/client';

// EMERGENCY: Simplified animal fetch to bypass hanging query
export const getAnimalsEmergency = async () => {
  try {
    console.log('🚨 EMERGENCY: Simplified animal fetch...');
    
    // Use the database function instead of direct query to bypass RLS issues
    const { data, error } = await supabase.rpc('get_dashboard_animal_stats');
    
    if (error) {
      console.error('❌ EMERGENCY: Database function error:', error);
      return { animals: [], stats: { total: 0, species: {} } };
    }
    
    console.log('✅ EMERGENCY: Got stats:', data);
    
    // Simple query for basic animal list
    const { data: basicAnimals, error: listError } = await supabase
      .from('animals')
      .select('id, name, tag, species')
      .limit(10);
    
    if (listError) {
      console.error('❌ EMERGENCY: List error:', listError);
      return { animals: [], stats: data[0] || { total_count: 0, species_counts: {} } };
    }
    
    console.log('✅ EMERGENCY: Got basic animals:', basicAnimals?.length);
    
    return {
      animals: basicAnimals || [],
      stats: data[0] || { total_count: 0, species_counts: {} }
    };
    
  } catch (error) {
    console.error('❌ EMERGENCY: Exception:', error);
    return { animals: [], stats: { total_count: 0, species_counts: {} } };
  }
};
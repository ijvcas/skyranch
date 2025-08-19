// Simple, reliable core data service
import { supabase } from '@/integrations/supabase/client';

export const getAuthenticatedUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};

export const getUserRoleSecure = async (): Promise<'admin' | 'manager' | 'worker' | null> => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    return (data?.role as 'admin' | 'manager' | 'worker') || 'worker';
  } catch (error) {
    console.error('Role error:', error);
    return 'worker';
  }
};

export const getAnimalsData = async () => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      console.error('No authenticated user for animals');
      return [];
    }

    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('user_id', user.id)
      .neq('lifecycle_status', 'deceased');

    if (error) {
      console.error('Animals query error:', error);
      return [];
    }

    console.log('✅ Animals loaded:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Animals fetch error:', error);
    return [];
  }
};

export const getLotsData = async () => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Lots query error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Lots fetch error:', error);
    return [];
  }
};

export const getDashboardStats = async () => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        totalAnimals: 0,
        activeAnimals: 0,
        totalLots: 0,
        activeLots: 0,
        recentEvents: 0,
        speciesBreakdown: {}
      };
    }

    const [animalsRes, lotsRes] = await Promise.all([
      supabase
        .from('animals')
        .select('species, lifecycle_status')
        .eq('user_id', user.id),
      supabase
        .from('lots')
        .select('status')
        .eq('user_id', user.id)
    ]);

    const animals = animalsRes.data || [];
    const lots = lotsRes.data || [];

    const activeAnimals = animals.filter(a => a.lifecycle_status !== 'deceased');
    const speciesBreakdown = activeAnimals.reduce((acc: any, animal) => {
      acc[animal.species] = (acc[animal.species] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAnimals: animals.length,
      activeAnimals: activeAnimals.length,
      totalLots: lots.length,
      activeLots: lots.filter(l => l.status === 'active').length,
      recentEvents: 0,
      speciesBreakdown
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return {
      totalAnimals: 0,
      activeAnimals: 0,
      totalLots: 0,
      activeLots: 0,
      recentEvents: 0,
      speciesBreakdown: {}
    };
  }
};

export const getUsersData = async () => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*');
    
    if (error) {
      console.error('Users query error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Users fetch error:', error);
    return [];
  }
};
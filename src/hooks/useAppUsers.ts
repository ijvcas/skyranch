import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export const useAppUsers = () => {
  return useQuery({
    queryKey: ['app-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, role, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as AppUser[];
    },
  });
};

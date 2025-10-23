import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useIsOwner = () => {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function checkOwnership() {
      if (!user) {
        setIsOwner(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('farm_profiles')
          .select('owner_user_id')
          .single();
        
        if (error) {
          console.error('Error checking farm ownership:', error);
          setIsOwner(false);
        } else {
          setIsOwner(data?.owner_user_id === user?.id);
        }
      } catch (err) {
        console.error('Error in ownership check:', err);
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkOwnership();
  }, [user]);
  
  return { isOwner, isLoading };
};

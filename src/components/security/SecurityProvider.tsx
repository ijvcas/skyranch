import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecurity } from '@/hooks/useSecurity';
import { updateLastActivity } from '@/utils/security';
import SessionTimeoutWarning from './SessionTimeoutWarning';

interface SecurityContextType {
  isSecurityEnabled: boolean;
}

const SecurityContext = createContext<SecurityContextType>({
  isSecurityEnabled: true
});

export const useSecurityContext = () => useContext(SecurityContext);

interface SecurityProviderProps {
  children: React.ReactNode;
}

const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { logSecurityEvent } = useSecurity();

  useEffect(() => {
    // Log user connection with error handling
    const logConnection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await logSecurityEvent('user_session_start', user.id, {
            connectionTime: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
          });
          updateLastActivity();
        }
      } catch (error) {
        console.warn('Failed to log user connection:', error);
      }
    };

    // Monitor auth state changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          await logSecurityEvent('user_signed_in', session.user.id, {
            event,
            timestamp: new Date().toISOString()
          });
          updateLastActivity();
        } else if (event === 'SIGNED_OUT') {
          await logSecurityEvent('user_signed_out', undefined, {
            event,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn('Failed to log auth state change:', error);
      }
    });

    logConnection();

    return () => {
      subscription.unsubscribe();
    };
  }, [logSecurityEvent]);

  return (
    <SecurityContext.Provider value={{ isSecurityEnabled: true }}>
      {children}
      <SessionTimeoutWarning />
    </SecurityContext.Provider>
  );
};

export default SecurityProvider;
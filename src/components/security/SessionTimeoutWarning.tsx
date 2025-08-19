import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { isSessionExpired, updateLastActivity, getLastActivity, SESSION_TIMEOUT_MINUTES } from '@/utils/security';
import { useSecurity } from '@/hooks/useSecurity';

const SessionTimeoutWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { logSecurityEvent } = useSecurity();

  useEffect(() => {
    const checkSession = () => {
      const lastActivity = getLastActivity();
      const isExpired = isSessionExpired(lastActivity);
      
      if (isExpired) {
        handleSessionExpired();
        return;
      }

      // Show warning 5 minutes before expiration
      const now = new Date();
      const timeDiff = now.getTime() - lastActivity.getTime();
      const minutesPassed = timeDiff / (1000 * 60);
      const minutesLeft = SESSION_TIMEOUT_MINUTES - minutesPassed;

      if (minutesLeft <= 5 && minutesLeft > 0) {
        setTimeLeft(Math.ceil(minutesLeft));
        setShowWarning(true);
      }
    };

    const handleSessionExpired = async () => {
      await logSecurityEvent('session_expired', undefined, {
        reason: 'Session timeout',
        lastActivity: getLastActivity().toISOString()
      });
      
      await supabase.auth.signOut();
      window.location.href = '/login';
    };

    // Track user activity
    const trackActivity = () => {
      updateLastActivity();
      setShowWarning(false);
    };

    // Check session every minute
    const interval = setInterval(checkSession, 60000);
    
    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    // Initial check
    checkSession();

    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, [logSecurityEvent]);

  const handleExtendSession = () => {
    updateLastActivity();
    setShowWarning(false);
    logSecurityEvent('session_extended', undefined, {
      reason: 'User extended session',
      extendedAt: new Date().toISOString()
    });
  };

  const handleSignOut = async () => {
    await logSecurityEvent('manual_logout', undefined, {
      reason: 'User chose to sign out from session warning'
    });
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in {timeLeft} minute{timeLeft !== 1 ? 's' : ''} due to inactivity. 
            Would you like to extend your session or sign out?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleSignOut}>
            Sign Out
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtendSession}>
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionTimeoutWarning;
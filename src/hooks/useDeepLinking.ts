import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';

export const useDeepLinking = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAppUrlOpen = (event: { url: string }) => {
      const url = new URL(event.url);
      
      // Handle password reset deep links
      if (url.pathname === '/reset-password') {
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');
        const type = url.searchParams.get('type');
        
        if (accessToken && refreshToken) {
          // Navigate to reset password page with tokens
          navigate(`/reset-password?access_token=${accessToken}&refresh_token=${refreshToken}&type=${type || 'recovery'}`);
        }
      }
    };

    // Listen for app URL open events
    App.addListener('appUrlOpen', handleAppUrlOpen);

    return () => {
      App.removeAllListeners();
    };
  }, [navigate]);
};
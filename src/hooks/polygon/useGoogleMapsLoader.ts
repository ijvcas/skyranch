
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleMapsLoaderState {
  isAPILoaded: boolean;
  isAPILoading: boolean;
  loadingCallbacks: (() => void)[];
}

const loaderState: GoogleMapsLoaderState = {
  isAPILoaded: false,
  isAPILoading: false,
  loadingCallbacks: []
};

// Fetch Google Maps API key from a Supabase Edge Function
const fetchGoogleMapsApiKey = async (): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('maps-key');
  if (error) {
    console.error('Failed to retrieve Google Maps API key:', error);
    throw new Error(error.message || 'Failed to retrieve Google Maps API key');
  }
  const apiKey = (data as any)?.apiKey;
  if (!apiKey) {
    throw new Error('Google Maps API key not returned by edge function');
  }
  return apiKey;
};

export const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (loaderState.isAPILoaded && window.google?.maps?.drawing && window.google?.maps?.geometry) {
      resolve();
      return;
    }

    if (loaderState.isAPILoading) {
      loaderState.loadingCallbacks.push(resolve);
      return;
    }

    loaderState.isAPILoading = true;

    // Retrieve API key first, then inject the script
    fetchGoogleMapsApiKey()
      .then((API_KEY) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=drawing,geometry&callback=initSimpleDrawing`;
        script.async = true;

        (window as any).initSimpleDrawing = () => {
          console.log('Google Maps Drawing and Geometry API loaded successfully');
          loaderState.isAPILoaded = true;
          loaderState.isAPILoading = false;
          resolve();
          loaderState.loadingCallbacks.forEach(cb => cb());
          loaderState.loadingCallbacks.length = 0;
        };

        script.onerror = () => {
          console.error('Failed to load Google Maps API');
          loaderState.isAPILoading = false;
          reject(new Error('Failed to load Google Maps API'));
        };

        document.head.appendChild(script);
      })
      .catch((err) => {
        loaderState.isAPILoading = false;
        reject(err);
      });
  });
};

export const useGoogleMapsLoader = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (loaderState.isAPILoaded) {
      setIsLoaded(true);
      return;
    }

    loadGoogleMapsAPI()
      .then(() => {
        setIsLoaded(true);
        setLoadError(null);
      })
      .catch((error) => {
        setLoadError(error);
        setIsLoaded(false);
      });
  }, []);

  return { isLoaded, loadError };
};


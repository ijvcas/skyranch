// Network diagnostics utility for troubleshooting CORS and connection issues
import { supabase } from "@/integrations/supabase/client";
export const networkDiagnostics = {
  // Test basic network connectivity
  async testNetworkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      console.error('🔴 Basic network connectivity failed:', error);
      return false;
    }
  },

  // Test Supabase connectivity
  async testSupabaseConnectivity(): Promise<boolean> {
    try {
      // Use a lightweight, authenticated Edge Function call via the Supabase client
      const { data, error } = await supabase.functions.invoke("maps-key", { body: {} });
      if (error) {
        console.warn('🟠 Supabase reachable but function error:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('🔴 Supabase connectivity failed:', error);
      return false;
    }
  },

  // Run full diagnostic
  async runDiagnostics(): Promise<{ network: boolean; supabase: boolean }> {
    console.log('🔍 Running network diagnostics...');
    
    const network = await this.testNetworkConnectivity();
    const supabase = await this.testSupabaseConnectivity();

    console.log('🔍 Diagnostic Results:', { network, supabase });
    
    return { network, supabase };
  },

  // Clear browser cache programmatically where possible
  clearCache(): void {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('🧹 Browser cache cleared');
  }
};
import { useState, useEffect, useRef } from 'react';
import { BiometricService } from '@/services/biometricService';
import { biometricStateManager } from '@/services/biometricStateManager';

export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Subscribe to state manager
    const unsubscribe = biometricStateManager.subscribe(() => {
      const status = biometricStateManager.getStatus();
      setIsAvailable(status.isAvailable);
      setBiometricType(status.biometricType);
      setIsEnabled(status.isEnabled);
      setLoading(status.loading);
    });

    // Initial check
    checkBiometricStatus();
    
    // ONLY re-check on visibility change with debouncing
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Clear any pending check
        if (checkTimeoutRef.current) {
          clearTimeout(checkTimeoutRef.current);
        }
        
        // Debounce visibility checks
        checkTimeoutRef.current = setTimeout(() => {
          checkBiometricStatus();
        }, 500);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      unsubscribe();
    };
  }, []);

  const checkBiometricStatus = async () => {
    try {
      console.log('🔄 [useBiometric] Requesting status check...');
      setLoading(true);
      
      // Use centralized state manager instead of direct checks
      await biometricStateManager.checkStatus();
      
      // Get updated status
      const status = biometricStateManager.getStatus();
      setIsAvailable(status.isAvailable);
      setBiometricType(status.biometricType);
      setIsEnabled(status.isEnabled);
      setLoading(status.loading);
    } catch (error) {
      console.error('Failed to check biometric status:', error);
      setLoading(false);
    }
  };

  const authenticate = async (): Promise<{ email: string; password: string } | null> => {
    try {
      // First verify identity
      const authenticated = await BiometricService.authenticate();
      if (!authenticated) {
        return null;
      }

      // Then get credentials
      const credentials = await BiometricService.getCredentials();
      return credentials;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return null;
    }
  };

  const enableBiometric = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 [useBiometric] Enabling biometric...');
      await BiometricService.saveCredentials(email, password);
      
      // Clear cache and force refresh
      biometricStateManager.clearCache();
      await biometricStateManager.forceRefresh();
      
      // Update local state
      const status = biometricStateManager.getStatus();
      setIsEnabled(status.isEnabled);
      
      console.log('✅ [useBiometric] Biometric enabled successfully');
      return true;
    } catch (error) {
      console.error('❌ [useBiometric] Error enabling biometric:', error);
      throw error;
    }
  };

  const disableBiometric = async (): Promise<void> => {
    try {
      await BiometricService.deleteCredentials();
      
      // Clear cache and force refresh
      biometricStateManager.clearCache();
      await biometricStateManager.forceRefresh();
      
      // Update local state
      const status = biometricStateManager.getStatus();
      setIsEnabled(status.isEnabled);
    } catch (error) {
      console.error('Failed to disable biometric:', error);
      throw error;
    }
  };

  const testBiometric = async (): Promise<boolean> => {
    return await BiometricService.authenticate('Prueba de autenticación biométrica');
  };

  return {
    isAvailable,
    biometricType,
    biometricTypeName: BiometricService.getBiometricTypeName(biometricType),
    isEnabled,
    loading,
    authenticate,
    enableBiometric,
    disableBiometric,
    testBiometric,
    refresh: checkBiometricStatus,
  };
};

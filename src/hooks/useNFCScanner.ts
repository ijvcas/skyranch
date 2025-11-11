import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { NFCService } from '@/services/nfcService';

/**
 * NFC Scanner Hook
 * 
 * Provides NFC scanning functionality using the @exxili/capacitor-nfc plugin through NFCService.
 * 
 * IMPORTANT iOS Setup (Required for native builds):
 * 
 * 1. Export project to GitHub and git pull
 * 2. Run: npm install
 * 3. Run: npx cap sync ios
 * 4. Open Xcode project
 * 5. Enable "Near Field Communication Tag Reading" capability
 * 6. Build and run on physical device (NFC requires real hardware)
 * 
 * For more details, see NFC_BARCODE_SETUP.md
 */

export const useNFCScanner = () => {
  const { toast } = useToast();
  const { t } = useTranslation(['common', 'animals', 'inventory']);
  const [isScanning, setIsScanning] = useState(false);

  const checkAvailability = async (): Promise<boolean> => {
    try {
      const isAvailable = await NFCService.checkAvailability();
      
      if (!isAvailable) {
        toast({
          title: t('common:error'),
          description: t('animals:nfc.notSupported'),
          variant: 'destructive',
        });
      }
      
      return isAvailable;
    } catch (error) {
      console.error('❌ [NFC] Availability check failed:', error);
      toast({
        title: t('common:error'),
        description: t('animals:nfc.notSupported'),
        variant: 'destructive',
      });
      return false;
    }
  };

  const scanNFC = async (): Promise<string | null> => {
    setIsScanning(true);
    
    try {
      console.log('🔍 [NFC] Starting scan...');
      const result = await NFCService.readTransponder();
      
      if (result.success && result.tagId) {
        console.log('✅ [NFC] Scan successful:', result.tagId);
        
        toast({
          title: t('animals:nfc.scanSuccess'),
          description: result.tagId,
        });
        
        return result.tagId;
      } else {
        console.error('❌ [NFC] Scan failed:', result.error);
        
        // Don't show error for user cancellation or timeout
        if (!result.error?.includes('cancel') && 
            !result.error?.includes('timeout') &&
            !result.error?.includes('Scan timeout')) {
          toast({
            title: t('common:error'),
            description: result.error || t('animals:nfc.scanError'),
            variant: 'destructive',
          });
        }
        
        return null;
      }
    } catch (error) {
      console.error('❌ [NFC] Unexpected error:', error);
      
      toast({
        title: t('common:error'),
        description: t('animals:nfc.scanError'),
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  const writeNFC = async (data: string): Promise<boolean> => {
    setIsScanning(true);
    
    try {
      console.log('📝 [NFC] Writing to tag:', data);
      
      const result = await NFCService.writeTransponder({ animalId: data });
      
      if (result.success) {
        console.log('✅ [NFC] Write successful');
        
        toast({
          title: t('inventory:nfc.writeSuccess'),
          description: t('inventory:nfc.writeSuccessDescription', 'Successfully wrote data to NFC tag'),
        });
        
        return true;
      } else {
        console.error('❌ [NFC] Write failed:', result.error);
        
        // Don't show error for user cancellation or timeout
        if (!result.error?.includes('cancel') && 
            !result.error?.includes('timeout') &&
            !result.error?.includes('Write timeout')) {
          toast({
            title: t('common:error'),
            description: result.error || t('inventory:nfc.writeError'),
            variant: 'destructive',
          });
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ [NFC] Unexpected error:', error);
      
      toast({
        title: t('common:error'),
        description: t('inventory:nfc.writeError'),
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsScanning(false);
    }
  };

  return {
    scanNFC,
    writeNFC,
    isScanning,
    checkAvailability,
  };
};

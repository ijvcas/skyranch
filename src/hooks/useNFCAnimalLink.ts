/**
 * Hook for linking NFC tags to animals
 */

import { useState } from 'react';
import { NFCService } from '@/services/nfcService';
import { useToast } from '@/hooks/use-toast';

export function useNFCAnimalLink() {
  const [isScanning, setIsScanning] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const { toast } = useToast();

  const scanAndLink = async (animalId: string) => {
    setIsScanning(true);
    try {
      const result = await NFCService.readTransponder();
      
      if (result.success && result.tagId) {
        await NFCService.linkToAnimal(result.tagId, animalId);
        toast({
          title: 'NFC Tag Linked',
          description: `Tag ${result.tagId} linked to animal successfully`,
        });
        return result.tagId;
      } else {
        toast({
          title: 'Scan Failed',
          description: result.error || 'Could not read NFC tag',
          variant: 'destructive',
        });
        return null;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to link NFC tag',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  const writeTag = async (animalId: string) => {
    setIsWriting(true);
    try {
      const result = await NFCService.writeTransponder({ animalId });
      
      if (result.success) {
        toast({
          title: 'NFC Tag Written',
          description: 'Animal ID written to transponder successfully',
        });
        return true;
      } else {
        toast({
          title: 'Write Failed',
          description: result.error || 'Could not write to NFC tag',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to write NFC tag',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsWriting(false);
    }
  };

  return {
    scanAndLink,
    writeTag,
    isScanning,
    isWriting,
  };
}

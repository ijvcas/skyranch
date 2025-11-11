/**
 * Quick NFC Scan Button Component
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Radio } from 'lucide-react';
import { NFCService } from '@/services/nfcService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export function NFCScanButton() {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const result = await NFCService.readTransponder();
      
      if (result.success && result.tagId) {
        // Try to find animal with this NFC tag
        const animal = await NFCService.lookupByNFC(result.tagId);
        
        if (animal) {
          toast({
            title: 'Animal Found',
            description: `Found: ${animal.name}`,
          });
          navigate(`/animals/${animal.id}`);
        } else {
          toast({
            title: 'No Animal Found',
            description: 'This NFC tag is not linked to any animal',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Scan Failed',
          description: result.error || 'Could not read NFC tag',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to scan NFC',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleScan}
      disabled={isScanning}
    >
      <Radio className={`w-4 h-4 mr-2 ${isScanning ? 'animate-pulse' : ''}`} />
      {isScanning ? 'Scanning...' : 'Scan NFC'}
    </Button>
  );
}

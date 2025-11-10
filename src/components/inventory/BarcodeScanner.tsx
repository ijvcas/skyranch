import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scan } from 'lucide-react';
import { BarcodeScanner as CapacitorBarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScanComplete: (barcode: string) => void;
}

export function BarcodeScanner({ open, onClose, onScanComplete }: BarcodeScannerProps) {
  const { t } = useTranslation('inventory');
  const { toast } = useToast();
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleNativeScan = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: 'Native scanner not available',
        description: 'Please use manual entry or enable camera on mobile',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsScanning(true);
      const status = await CapacitorBarcodeScanner.checkPermission({ force: true });

      if (!status.granted) {
        toast({
          title: 'Camera permission required',
          variant: 'destructive',
        });
        return;
      }

      await CapacitorBarcodeScanner.hideBackground();
      const result = await CapacitorBarcodeScanner.startScan();

      if (result.hasContent) {
        onScanComplete(result.content);
        toast({
          title: t('messages.scanSuccess', { name: result.content }),
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: t('messages.scanError'),
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
      await CapacitorBarcodeScanner.showBackground();
      await CapacitorBarcodeScanner.stopScan();
    }
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScanComplete(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('scan')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button 
            onClick={handleNativeScan} 
            className="w-full"
            disabled={isScanning}
          >
            <Scan className="w-4 h-4 mr-2" />
            {isScanning ? 'Scanning...' : 'Scan with Camera'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter barcode"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
            <Button onClick={handleManualSubmit}>Submit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
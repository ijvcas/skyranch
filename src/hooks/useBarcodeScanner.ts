import { useState } from 'react';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { BarcodeService, BarcodeEntity } from '@/services/barcodeService';

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const checkPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: "Not Available",
        description: "Barcode scanning is only available on mobile devices",
        variant: "destructive"
      });
      return false;
    }

    const { camera } = await BarcodeScanner.checkPermissions();
    
    if (camera === 'granted') {
      return true;
    }

    if (camera === 'denied') {
      toast({
        title: "Permission Denied",
        description: "Camera permission is required for barcode scanning",
        variant: "destructive"
      });
      return false;
    }

    const { camera: newPermission } = await BarcodeScanner.requestPermissions();
    return newPermission === 'granted';
  };

  const scanBarcode = async (): Promise<BarcodeEntity | null> => {
    const hasPermission = await checkPermissions();
    if (!hasPermission) return null;

    setIsScanning(true);

    try {
      const result = await BarcodeScanner.scan({
        formats: [
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
          BarcodeFormat.Code128,
          BarcodeFormat.Code39,
          BarcodeFormat.QrCode
        ]
      });

      if (result.barcodes.length > 0) {
        const barcode = result.barcodes[0].rawValue;
        console.log('📱 [Barcode] Scanned:', barcode);

        // Look up barcode in universal registry
        const entity = await BarcodeService.lookupBarcode(barcode);

        if (entity) {
          // Record scan in history
          await BarcodeService.recordScan(barcode, entity.type, entity.id, 'manual_scan');

          toast({
            title: "Scan Success",
            description: `Found ${entity.type}: ${entity.name}`,
          });

          return entity;
        } else {
          toast({
            title: "Not Found",
            description: "No registered item found for this barcode",
            variant: "destructive"
          });
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Barcode scanning error:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to scan barcode. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  return {
    scanBarcode,
    isScanning
  };
};

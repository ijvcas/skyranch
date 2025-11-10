import { useState } from 'react';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

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

  const scanBarcode = async (): Promise<string | null> => {
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
        return result.barcodes[0].rawValue;
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

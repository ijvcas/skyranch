import { useState } from 'react';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { BarcodeService, type BarcodeEntity, type BarcodeLookupResult } from '@/services/barcodeService';
import { BrowserMultiFormatReader } from '@zxing/browser';

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

  const scanBarcodeWeb = async (): Promise<BarcodeEntity | null> => {
    setIsScanning(true);

    try {
      const codeReader = new BrowserMultiFormatReader();
      
      // Create video element for scanning
      const videoElement = document.createElement('video');
      videoElement.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;background:black;object-fit:cover;';
      document.body.appendChild(videoElement);

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '✕ Close';
      closeButton.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;padding:10px 20px;background:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;';
      document.body.appendChild(closeButton);

      return await new Promise((resolve) => {
        const cleanup = () => {
          // Stop all video tracks
          if (videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
          }
          if (document.body.contains(videoElement)) document.body.removeChild(videoElement);
          if (document.body.contains(closeButton)) document.body.removeChild(closeButton);
        };

        closeButton.onclick = () => {
          cleanup();
          resolve(null);
        };

        codeReader.decodeFromVideoDevice(undefined, videoElement, async (result, error) => {
          if (result) {
            cleanup();
            
            const barcode = result.getText();
            console.log('📱 [Barcode Web] Scanned:', barcode);

            const lookupResult = await BarcodeService.lookupBarcode(barcode);

            if (lookupResult && 'type' in lookupResult) {
              await BarcodeService.recordScan(barcode, lookupResult.type, lookupResult.id, 'manual_scan');
              toast({
                title: "Scan Success",
                description: `Found ${lookupResult.type}: ${lookupResult.name}`,
              });
              resolve(lookupResult);
            } else if (lookupResult && 'source' in lookupResult) {
              toast({
                title: "Product Found",
                description: `${lookupResult.product_name} - Add to inventory?`,
              });
              resolve(null);
            } else {
              toast({
                title: "Not Found",
                description: "No registered item found for this barcode",
                variant: "destructive"
              });
              resolve(null);
            }
          }
        });
      });
    } catch (error) {
      console.error('Web barcode scanning error:', error);
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

  const scanBarcode = async (): Promise<BarcodeEntity | null> => {
    // Use web scanner for browsers
    if (!Capacitor.isNativePlatform()) {
      return scanBarcodeWeb();
    }

    // Use native scanner for mobile apps
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

        const lookupResult = await BarcodeService.lookupBarcode(barcode);

        if (lookupResult && 'type' in lookupResult) {
          await BarcodeService.recordScan(barcode, lookupResult.type, lookupResult.id, 'manual_scan');
          toast({
            title: "Scan Success",
            description: `Found ${lookupResult.type}: ${lookupResult.name}`,
          });
          return lookupResult;
        } else if (lookupResult && 'source' in lookupResult) {
          toast({
            title: "Product Found",
            description: `${lookupResult.product_name} - Add to inventory?`,
          });
          return null;
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

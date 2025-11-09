import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';

export class BarcodeScannerService {
  static async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Barcode scanner only works on native platforms');
      return false;
    }

    const { granted } = await BarcodeScanner.checkPermission({ force: true });
    return granted;
  }

  static async scan(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      // For web testing, return a mock barcode
      return prompt('Enter barcode (web testing):');
    }

    const permission = await this.requestPermission();
    if (!permission) return null;

    await BarcodeScanner.hideBackground();
    document.body.classList.add('scanner-active');
    
    try {
      const result = await BarcodeScanner.startScan();
      
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
      
      if (result.hasContent) {
        return result.content;
      }
      return null;
    } catch (error) {
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
      console.error('Scan error:', error);
      return null;
    }
  }

  static stopScan() {
    BarcodeScanner.stopScan();
    document.body.classList.remove('scanner-active');
    BarcodeScanner.showBackground();
  }
}

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';

/**
 * NFC Scanner Hook for Capacitor
 * 
 * SETUP INSTRUCTIONS FOR iOS NFC:
 * 
 * 1. Install NFC plugin:
 *    npm install @capawesome-team/capacitor-nfc@latest
 * 
 * 2. Update ios/App/App/Info.plist:
 *    <key>NFCReaderUsageDescription</key>
 *    <string>FARMIKA necesita acceso a NFC para escanear etiquetas de animales</string>
 *    <key>com.apple.developer.nfc.readersession.formats</key>
 *    <array>
 *        <string>NDEF</string>
 *        <string>TAG</string>
 *    </array>
 * 
 * 3. Update ios/App/Podfile:
 *    pod 'CapawesomeCapacitorNfc', :path => '../../node_modules/@capawesome-team/capacitor-nfc'
 * 
 * 4. Open Xcode, select App target → Signing & Capabilities
 *    Add: "Near Field Communication Tag Reading"
 * 
 * 5. Run: npx cap sync ios
 * 
 * Until the plugin is installed, this will show setup instructions to users.
 */

// Type definitions for NFC plugin (for when it's installed)
interface NfcPlugin {
  isSupported(): Promise<{ isSupported: boolean }>;
  startScanSession(options: { alertMessage: string }): Promise<void>;
  stopScanSession(): Promise<void>;
  addListener(event: string, callback: (data: any) => void): Promise<{ remove: () => Promise<void> }>;
  write(options: { message: { records: Array<{ type: string; payload: string }> } }): Promise<void>;
}

interface NfcUtilsPlugin {
  convertBytesToString(bytes: any): string;
  convertBytesToHexString(bytes: any): string;
}

export const useNFCScanner = () => {
  const { toast } = useToast();
  const { t } = useTranslation(['common', 'animals', 'inventory']);
  const [isScanning, setIsScanning] = useState(false);

  const getNfcPlugin = async (): Promise<{ Nfc: NfcPlugin; NfcUtils: NfcUtilsPlugin } | null> => {
    try {
      // Check if plugin is available in Capacitor plugins
      const plugins = (window as any).Capacitor?.Plugins;
      if (plugins?.Nfc) {
        return {
          Nfc: plugins.Nfc,
          NfcUtils: plugins.NfcUtils,
        };
      }
      return null;
    } catch (error) {
      console.error('❌ [NFC] Plugin not available:', error);
      return null;
    }
  };

  const checkAvailability = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      console.log('🚫 [NFC] Not on native platform');
      return false;
    }

    const nfcPlugin = await getNfcPlugin();
    if (!nfcPlugin) {
      toast({
        title: 'NFC Plugin Required',
        description: 'Please install @capawesome-team/capacitor-nfc to enable NFC scanning',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { isSupported } = await nfcPlugin.Nfc.isSupported();
      console.log(`✅ [NFC] Support status: ${isSupported}`);
      return isSupported;
    } catch (error) {
      console.error('❌ [NFC] Availability check failed:', error);
      return false;
    }
  };

  const scanNFC = async (): Promise<string | null> => {
    if (!await checkAvailability()) {
      return null;
    }

    const nfcPlugin = await getNfcPlugin();
    if (!nfcPlugin) return null;

    setIsScanning(true);
    let tagData = '';
    let listener: any = null;

    try {
      const { Nfc, NfcUtils } = nfcPlugin;
      console.log('🔍 [NFC] Starting NFC scan session...');

      await Nfc.startScanSession({
        alertMessage: t('animals:nfc.scanPrompt', 'Hold your device near the NFC tag'),
      });

      listener = await Nfc.addListener('nfcTagScanned', async (event: any) => {
        const { nfcTag } = event;
        console.log('✅ [NFC] Tag detected:', nfcTag);

        // Extract NDEF message if present
        if (nfcTag.message?.records && nfcTag.message.records.length > 0) {
          const record = nfcTag.message.records[0];
          
          if (record.payload) {
            try {
              tagData = NfcUtils.convertBytesToString(record.payload);
            } catch (e) {
              tagData = record.payload.toString();
            }
          }
        }

        // Fallback to tag ID if no NDEF payload
        if (!tagData && nfcTag.id) {
          tagData = NfcUtils.convertBytesToHexString(nfcTag.id);
        }

        await Nfc.stopScanSession();
        await listener?.remove();
      });

      // Wait for scan with 30 second timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(async () => {
          await Nfc.stopScanSession();
          await listener?.remove();
          reject(new Error('Scan timeout'));
        }, 30000);

        const checkInterval = setInterval(() => {
          if (tagData) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      console.log('✅ [NFC] Scan completed:', tagData);

      toast({
        title: t('animals:nfc.scanSuccess', 'NFC Tag Scanned'),
        description: tagData,
      });

      return tagData;
    } catch (error: any) {
      console.error('❌ [NFC] Scan failed:', error);

      // Try to stop session on error
      try {
        const nfcPlugin = await getNfcPlugin();
        if (nfcPlugin) {
          await nfcPlugin.Nfc.stopScanSession();
          await listener?.remove();
        }
      } catch (e) {
        // Ignore cleanup errors
      }

      // Don't show error toast for cancellation or timeout
      if (!error?.message?.includes('cancel') && 
          !error?.message?.includes('Cancel') &&
          !error?.message?.includes('timeout')) {
        toast({
          title: t('common:error'),
          description: t('animals:nfc.scanError', 'Failed to scan NFC tag'),
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  const writeNFC = async (data: string): Promise<boolean> => {
    if (!await checkAvailability()) {
      return false;
    }

    const nfcPlugin = await getNfcPlugin();
    if (!nfcPlugin) return false;

    try {
      setIsScanning(true);
      const { Nfc } = nfcPlugin;
      
      console.log('✍️ [NFC] Writing to NFC tag:', data);

      await Nfc.write({
        message: {
          records: [
            {
              type: 'TEXT',
              payload: data,
            },
          ],
        },
      });

      console.log('✅ [NFC] Write successful');

      toast({
        title: t('animals:nfc.writeSuccess', 'NFC Tag Written'),
        description: data,
      });

      return true;
    } catch (error: any) {
      console.error('❌ [NFC] Write failed:', error);

      if (!error?.message?.includes('cancel') && !error?.message?.includes('Cancel')) {
        toast({
          title: t('common:error'),
          description: t('animals:nfc.writeError', 'Failed to write NFC tag'),
          variant: 'destructive',
        });
      }
      
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

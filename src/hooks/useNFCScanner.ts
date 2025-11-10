import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';

// NFC plugin types
interface NFCPlugin {
  isSupported(): Promise<{ isSupported: boolean }>;
  read(options?: { keepSessionAlive?: boolean }): Promise<{ message: NFCMessage }>;
  write(options: { message: NFCMessage }): Promise<void>;
}

interface NFCMessage {
  records: NFCRecord[];
}

interface NFCRecord {
  id?: string;
  payload?: string;
  type?: string;
  tnf?: number;
}

// Dynamic import for NFC plugin
let NFC: NFCPlugin | null = null;

export const useNFCScanner = () => {
  const { toast } = useToast();
  const { t } = useTranslation(['common', 'animals', 'inventory']);
  const [isScanning, setIsScanning] = useState(false);

  const checkAvailability = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      console.log('🚫 [NFC] Not on native platform');
      return false;
    }

    try {
      // Note: NFC plugin needs to be installed manually
      // Install with: npm install @capacitor-community/nfc (when available)
      // For now, this is a placeholder that returns false
      console.log('⚠️ [NFC] Plugin not installed. Please install @capacitor-community/nfc');
      return false;
    } catch (error) {
      console.error('❌ [NFC] Availability check failed:', error);
      return false;
    }
  };

  const scanNFC = async (): Promise<string | null> => {
    if (!await checkAvailability()) {
      toast({
        title: t('common:error'),
        description: t('animals:nfc.notSupported', 'NFC not supported on this device'),
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsScanning(true);
      console.log('🔍 [NFC] Starting NFC scan...');

      if (!NFC) {
        throw new Error('NFC plugin not loaded');
      }

      const { message } = await NFC.read({ keepSessionAlive: false });
      console.log('✅ [NFC] Scan successful:', message);

      // Extract data from first record
      if (message.records && message.records.length > 0) {
        const record = message.records[0];
        let tagData = '';

        // Try to decode payload
        if (record.payload) {
          try {
            // Payload is typically base64 encoded
            const decoded = atob(record.payload);
            // Remove language code prefix if present (first 3 bytes for NDEF text records)
            tagData = decoded.substring(3);
          } catch (e) {
            // If decoding fails, use raw payload
            tagData = record.payload;
          }
        }

        if (record.id) {
          tagData = tagData || record.id;
        }

        toast({
          title: t('animals:nfc.scanSuccess', 'NFC Tag Scanned'),
          description: tagData,
        });

        return tagData;
      }

      toast({
        title: t('common:warning'),
        description: t('animals:nfc.noData', 'No data found on NFC tag'),
        variant: 'destructive',
      });
      return null;
    } catch (error: any) {
      console.error('❌ [NFC] Scan failed:', error);
      
      // Don't show error if user cancelled
      if (error?.message?.includes('cancel') || error?.message?.includes('Cancel')) {
        console.log('ℹ️ [NFC] Scan cancelled by user');
        return null;
      }

      toast({
        title: t('common:error'),
        description: t('animals:nfc.scanError', 'Failed to scan NFC tag'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  const writeNFC = async (data: string): Promise<boolean> => {
    if (!await checkAvailability()) {
      toast({
        title: t('common:error'),
        description: t('animals:nfc.notSupported', 'NFC not supported on this device'),
        variant: 'destructive',
      });
      return false;
    }

    try {
      setIsScanning(true);
      console.log('✍️ [NFC] Writing to NFC tag:', data);

      if (!NFC) {
        throw new Error('NFC plugin not loaded');
      }

      // Create NDEF text record
      const message: NFCMessage = {
        records: [
          {
            tnf: 1, // TNF_WELL_KNOWN
            type: 'T', // Text record
            payload: btoa('\x02en' + data), // Language code + data
          },
        ],
      };

      await NFC.write({ message });
      console.log('✅ [NFC] Write successful');

      toast({
        title: t('animals:nfc.writeSuccess', 'NFC Tag Written'),
        description: data,
      });

      return true;
    } catch (error: any) {
      console.error('❌ [NFC] Write failed:', error);
      
      if (error?.message?.includes('cancel') || error?.message?.includes('Cancel')) {
        console.log('ℹ️ [NFC] Write cancelled by user');
        return false;
      }

      toast({
        title: t('common:error'),
        description: t('animals:nfc.writeError', 'Failed to write NFC tag'),
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

/**
 * NFC Service for Animal Transponder Management
 * Handles reading, writing, and linking NFC tags to animals
 * 
 * NOTE: NFC plugin (@capawesome/capacitor-nfc) must be installed separately
 * for native mobile builds. This service gracefully handles missing plugin.
 */

import { supabase } from '@/integrations/supabase/client';
import type { NFCTagData, NFCScanResult, NFCWriteOptions } from '@/types/nfc';

export class NFCService {
  /**
   * Read NFC transponder and return tag ID
   */
  static async readTransponder(): Promise<NFCScanResult> {
    try {
      // Dynamic import with error handling - plugin might not be installed
      const nfcModule = await import('@capawesome/capacitor-nfc' as any).catch(() => null);
      if (!nfcModule) {
        return {
          success: false,
          error: 'NFC plugin not installed. Install @capawesome/capacitor-nfc for native builds.',
        };
      }
      
      const { Nfc } = nfcModule;
      await Nfc.startScanSession();

      return new Promise((resolve) => {
        const listener = Nfc.addListener('nfcTagScanned', (event: any) => {
          listener.remove();
          Nfc.stopScanSession();

          const tagId = event.nfcTag?.id || '';
          resolve({
            success: true,
            tagId,
            data: event.nfcTag as NFCTagData,
          });
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          listener.remove();
          Nfc.stopScanSession();
          resolve({
            success: false,
            error: 'Scan timeout',
          });
        }, 30000);
      });
    } catch (error) {
      console.error('[NFC] Read failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read NFC tag',
      };
    }
  }

  /**
   * Write animal ID to NFC transponder (NDEF format)
   */
  static async writeTransponder(options: NFCWriteOptions): Promise<NFCScanResult> {
    try {
      const nfcModule = await import('@capawesome/capacitor-nfc' as any).catch(() => null);
      if (!nfcModule) {
        return {
          success: false,
          error: 'NFC plugin not installed',
        };
      }
      
      const { Nfc } = nfcModule;

      // Prepare NDEF message with animal ID
      const message = {
        records: [
          {
            type: 'TEXT',
            payload: `ANIMAL:${options.animalId}`,
          },
        ],
      };

      await Nfc.write({ message });

      return {
        success: true,
        animalId: options.animalId,
      };
    } catch (error) {
      console.error('[NFC] Write failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write NFC tag',
      };
    }
  }

  /**
   * Link NFC tag to animal in database
   */
  static async linkToAnimal(nfcTagId: string, animalId: string): Promise<void> {
    const { error } = await supabase
      .from('animals')
      .update({
        nfc_tag_id: nfcTagId,
        nfc_scan_count: 0,
        nfc_last_scanned_at: new Date().toISOString(),
      })
      .eq('id', animalId);

    if (error) {
      throw new Error(`Failed to link NFC tag: ${error.message}`);
    }
  }

  /**
   * Update NFC scan statistics
   */
  static async recordNFCScan(animalId: string): Promise<void> {
    const { data: animal } = await supabase
      .from('animals')
      .select('nfc_scan_count')
      .eq('id', animalId)
      .single();

    const scanCount = (animal?.nfc_scan_count || 0) + 1;

    await supabase
      .from('animals')
      .update({
        nfc_scan_count: scanCount,
        nfc_last_scanned_at: new Date().toISOString(),
      })
      .eq('id', animalId);
  }

  /**
   * Lookup animal by NFC tag ID
   */
  static async lookupByNFC(nfcTagId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('nfc_tag_id', nfcTagId)
      .single();

    if (error || !data) {
      return null;
    }

    // Record the scan
    await this.recordNFCScan(data.id);

    return data;
  }

  /**
   * Check if NFC is available on device
   */
  static async checkAvailability(): Promise<boolean> {
    try {
      const nfcModule = await import('@capawesome/capacitor-nfc' as any).catch(() => null);
      if (!nfcModule) return false;
      
      const { Nfc } = nfcModule;
      const result = await Nfc.isSupported();
      return result.isSupported;
    } catch {
      return false;
    }
  }
}

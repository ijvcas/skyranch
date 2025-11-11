/**
 * NFC Service for Animal Transponder Management
 * Handles reading, writing, and linking NFC tags to animals
 * 
 * NOTE: This is a stub implementation for web/preview builds.
 * For native iOS app builds, install @capawesome/capacitor-nfc plugin:
 * 1. Export to GitHub
 * 2. Run: npm install @capawesome/capacitor-nfc
 * 3. Follow iOS/Android setup in NFC_BARCODE_SETUP.md
 */

import { supabase } from '@/integrations/supabase/client';
import type { NFCTagData, NFCScanResult, NFCWriteOptions } from '@/types/nfc';

export class NFCService {
  /**
   * Read NFC transponder and return tag ID
   * NOTE: Stub implementation - install plugin for native builds
   */
  static async readTransponder(): Promise<NFCScanResult> {
    return {
      success: false,
      error: 'NFC plugin not available in web build. Install @capawesome/capacitor-nfc for native iOS/Android builds.',
    };
  }

  /**
   * Write animal ID to NFC transponder (NDEF format)
   * NOTE: Stub implementation - install plugin for native builds
   */
  static async writeTransponder(options: NFCWriteOptions): Promise<NFCScanResult> {
    return {
      success: false,
      error: 'NFC plugin not available. Install @capawesome/capacitor-nfc in native build.',
    };
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
    return false; // Plugin not installed in web build
  }
}

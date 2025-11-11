/**
 * NFC Service for Animal Transponder Management
 * Handles reading, writing, and linking NFC tags to animals
 * 
 * Uses @exxili/capacitor-nfc for Capacitor 7
 */

import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import type { NFCTagData, NFCScanResult, NFCWriteOptions } from '@/types/nfc';

// Import NFC plugin for native builds
let NFC: any = null;
if (Capacitor.isNativePlatform()) {
  console.log('[NFC] 🔍 Loading NFC plugin on', Capacitor.getPlatform());
  
  try {
    // Use destructured require to get the named NFC export
    const { NFC: NFCPlugin } = require('@exxili/capacitor-nfc');
    NFC = NFCPlugin;
    
    console.log('[NFC] ✅ Plugin loaded successfully');
    console.log('[NFC] ✅ Available methods:', Object.keys(NFC || {}));
  } catch (error) {
    console.error('[NFC] ❌ Failed to load @exxili/capacitor-nfc');
    console.error('[NFC] ❌ Error:', error);
    console.error('[NFC] 🔧 Troubleshooting:');
    console.error('[NFC] 🔧   1. Run: cd ios/App && pod install');
    console.error('[NFC] 🔧   2. Clean Xcode build (Product → Clean Build Folder twice)');
    console.error('[NFC] 🔧   3. Rebuild and deploy again');
  }
}

export class NFCService {
  private static getNfcPlugin() {
    if (!Capacitor.isNativePlatform()) {
      console.log('[NFC] ⚠️ Not a native platform');
      return null;
    }
    
    if (!NFC) {
      console.error('[NFC] ❌ Plugin not loaded - Check Xcode console for details');
      console.error('[NFC] ❌ This means the require() call failed during app initialization');
      return null;
    }
    
    console.log('[NFC] ✅ Plugin is ready');
    return NFC;
  }

  /**
   * Read NFC transponder and return tag ID
   */
  static async readTransponder(): Promise<NFCScanResult> {
    const NFC = this.getNfcPlugin();
    
    if (!NFC) {
      return {
        success: false,
        error: 'NFC plugin not loaded. Check Xcode console for detailed error logs.',
      };
    }

    try {
      // Start NFC scan on iOS (Android auto-starts)
      await NFC.startScan().catch((e: any) => {
        console.warn('[NFC] Start scan warning:', e);
      });

      return new Promise((resolve) => {
        let isResolved = false;
        
        const cleanup = NFC.onRead((data: any) => {
          if (isResolved) return;
          isResolved = true;

          // Stop scan on iOS
          NFC.cancelScan().catch(console.error);

          // Get tag ID from tagInfo
          const tagId = data.tagInfo?.uid || '';
          
          // Extract NDEF data if available
          let animalId: string | undefined;
          const asString = data.string();
          
          if (asString?.messages?.[0]?.records) {
            for (const record of asString.messages[0].records) {
              if (record.type === 'T' && record.payload) {
                const text = record.payload;
                if (text.startsWith('ANIMAL:')) {
                  animalId = text.substring(7);
                }
              }
            }
          }

          resolve({
            success: true,
            tagId,
            animalId,
            data: {
              id: tagId,
              techTypes: data.tagInfo?.techTypes,
              ndef: asString?.messages?.[0] ? {
                records: asString.messages[0].records.map((r: any) => ({
                  type: r.type,
                  data: r.payload
                }))
              } : undefined,
              raw: data,
            } as NFCTagData,
          });
        });

        NFC.onError((error: any) => {
          if (isResolved) return;
          isResolved = true;
          
          resolve({
            success: false,
            error: error.message || 'NFC error occurred',
          });
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          
          NFC.cancelScan().catch(console.error);
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
    const NFC = this.getNfcPlugin();
    
    if (!NFC) {
      return {
        success: false,
        error: 'NFC not available',
      };
    }

    try {
      return new Promise((resolve) => {
        let isResolved = false;

        // Write NDEF message with animal ID
        NFC.writeNDEF({
          records: [
            {
              type: 'T', // Text record
              payload: `ANIMAL:${options.animalId}`,
            },
          ],
        }).catch((error: any) => {
          if (!isResolved) {
            isResolved = true;
            resolve({
              success: false,
              error: error.message || 'Failed to write NFC tag',
            });
          }
        });

        // Listen for write success
        NFC.onWrite(() => {
          if (isResolved) return;
          isResolved = true;
          
          resolve({
            success: true,
            animalId: options.animalId,
          });
        });

        // Handle errors
        NFC.onError((error: any) => {
          if (isResolved) return;
          isResolved = true;
          
          resolve({
            success: false,
            error: error.message || 'NFC write failed',
          });
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          
          resolve({
            success: false,
            error: 'Write timeout',
          });
        }, 30000);
      });
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
    const NFC = this.getNfcPlugin();
    if (!NFC) return false;
    
    try {
      const result = await NFC.isSupported();
      return result.supported;
    } catch {
      return false;
    }
  }
}

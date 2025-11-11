/**
 * NFC Service for Animal Transponder Management
 * Handles reading, writing, and linking NFC tags to animals
 * 
 * Uses @exxili/capacitor-nfc for Capacitor 7
 */

import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import type { NFCTagData, NFCScanResult, NFCWriteOptions } from '@/types/nfc';

// Static import for native Capacitor plugin (required for proper native bridge)
import { NFC } from '@exxili/capacitor-nfc';

console.log('[NFC] 🚀 Module loaded, platform:', Capacitor.getPlatform());
console.log('[NFC] 🚀 Plugin available:', !!NFC);
console.log('[NFC] 🚀 Plugin methods:', Object.keys(NFC || {}));

export class NFCService {
  private static getNfcPlugin() {
    if (!Capacitor.isNativePlatform()) {
      console.log('[NFC] ⚠️ Not a native platform');
      return null;
    }
    
    if (!NFC) {
      console.error('[NFC] ❌ Plugin not available');
      return null;
    }
    
    console.log('[NFC] ✅ Plugin ready to use');
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
        error: 'NFC plugin not available',
      };
    }

    try {
      console.log('[NFC] 📱 Setting up NFC read listeners...');

      return new Promise((resolve) => {
        let isResolved = false;
        let offRead: (() => void) | null = null;
        let offError: (() => void) | null = null;
        
        const cleanup = () => {
          if (offRead) offRead();
          if (offError) offError();
          NFC.cancelScan().catch(console.error);
        };
        
        // Set up read listener FIRST
        offRead = NFC.onRead((data: any) => {
          if (isResolved) return;
          isResolved = true;
          
          console.log('[NFC] ✅ Tag detected!', data);
          cleanup();

          try {
            // Get tag ID from tagInfo
            const asString = data.string();
            const tagId = asString.tagInfo?.uid || '';
            
            console.log('[NFC] 🏷️  Tag ID:', tagId);
            
            // Extract NDEF data if available
            let animalId: string | undefined;
            
            if (asString?.messages?.[0]?.records) {
              for (const record of asString.messages[0].records) {
                if (record.type === 'T' && record.payload) {
                  const text = record.payload;
                  console.log('[NFC] 📝 NDEF Text record:', text);
                  
                  if (text.startsWith('ANIMAL:')) {
                    animalId = text.substring(7);
                    console.log('[NFC] 🐄 Found animal ID:', animalId);
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
                techTypes: asString.tagInfo?.techTypes,
                ndef: asString?.messages?.[0] ? {
                  records: asString.messages[0].records.map((r: any) => ({
                    type: r.type,
                    data: r.payload
                  }))
                } : undefined,
                raw: data,
              } as NFCTagData,
            });
          } catch (error) {
            console.error('[NFC] ❌ Error processing tag data:', error);
            resolve({
              success: false,
              error: 'Failed to process NFC tag data',
            });
          }
        });

        // Set up error listener
        offError = NFC.onError((error: any) => {
          if (isResolved) return;
          isResolved = true;
          
          console.error('[NFC] ❌ Error:', error);
          cleanup();
          
          resolve({
            success: false,
            error: error.message || 'NFC error occurred',
          });
        });

        // NOW start the scan (iOS only, no-op on Android)
        NFC.startScan()
          .then(() => {
            console.log('[NFC] 🔍 Scan started, waiting for tag...');
          })
          .catch((error: any) => {
            if (isResolved) return;
            isResolved = true;
            
            console.error('[NFC] ❌ Failed to start scan:', error);
            cleanup();
            
            resolve({
              success: false,
              error: error.message || 'Failed to start NFC scan',
            });
          });

        // Timeout after 30 seconds
        setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          
          console.log('[NFC] ⏱️  Scan timeout');
          cleanup();
          
          resolve({
            success: false,
            error: 'Scan timeout',
          });
        }, 30000);
      });
    } catch (error) {
      console.error('[NFC] ❌ Read failed:', error);
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
      console.log('[NFC] 📝 Setting up NFC write listeners...');

      return new Promise((resolve) => {
        let isResolved = false;
        let offWrite: (() => void) | null = null;
        let offError: (() => void) | null = null;

        const cleanup = () => {
          if (offWrite) offWrite();
          if (offError) offError();
        };

        // Set up write success listener FIRST
        offWrite = NFC.onWrite(() => {
          if (isResolved) return;
          isResolved = true;
          
          console.log('[NFC] ✅ Write successful!');
          cleanup();
          
          resolve({
            success: true,
            animalId: options.animalId,
          });
        });

        // Set up error listener
        offError = NFC.onError((error: any) => {
          if (isResolved) return;
          isResolved = true;
          
          console.error('[NFC] ❌ Write error:', error);
          cleanup();
          
          resolve({
            success: false,
            error: error.message || 'NFC write failed',
          });
        });

        // NOW initiate the write
        NFC.writeNDEF({
          records: [
            {
              type: 'T', // Text record
              payload: `ANIMAL:${options.animalId}`,
            },
          ],
        })
          .then(() => {
            console.log('[NFC] 🔍 Write initiated, waiting for tag...');
          })
          .catch((error: any) => {
            if (isResolved) return;
            isResolved = true;
            
            console.error('[NFC] ❌ Failed to initiate write:', error);
            cleanup();
            
            resolve({
              success: false,
              error: error.message || 'Failed to write NFC tag',
            });
          });

        // Timeout after 30 seconds
        setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          
          console.log('[NFC] ⏱️  Write timeout');
          cleanup();
          
          resolve({
            success: false,
            error: 'Write timeout',
          });
        }, 30000);
      });
    } catch (error) {
      console.error('[NFC] ❌ Write failed:', error);
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

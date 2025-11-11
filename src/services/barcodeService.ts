import { supabase } from '@/integrations/supabase/client';
import { ProductLookupService, type UniversalProduct } from './productLookupService';
import { ProductCacheService } from './productCacheService';
import { ServiceLookupService } from './serviceLookupService';
import { NFCService } from './nfcService';

export interface BarcodeEntity {
  id: string;
  type: 'animal' | 'inventory' | 'equipment' | 'lot' | 'user' | 'universal_product';
  name: string;
  details?: any;
}

export type BarcodeLookupResult = BarcodeEntity | UniversalProduct | null;

export interface BarcodeRegistryEntry {
  id: string;
  barcode: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  notes?: string;
}

export class BarcodeService {
  /**
   * Universal barcode lookup - checks local farm database, then internet APIs
   */
  static async lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
    console.log('🔍 [Barcode] Looking up:', barcode);

    // 1. Check barcode registry first
    const { data: registryEntry } = await supabase
      .from('barcode_registry')
      .select('*')
      .eq('barcode', barcode)
      .eq('is_active', true)
      .single();

    if (registryEntry) {
      console.log('✅ [Barcode] Found in registry:', registryEntry.entity_type);
      return await this.fetchEntity(registryEntry.entity_type, registryEntry.entity_id);
    }

    // 2. Check legacy inventory_items table
    const { data: inventoryItem } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (inventoryItem) {
      console.log('✅ [Barcode] Found inventory item:', inventoryItem.name);
      return {
        id: inventoryItem.id,
        type: 'inventory',
        name: inventoryItem.name,
        details: inventoryItem,
      };
    }

    // 3. Check animals table with barcode/tag column
    const { data: animal } = await supabase
      .from('animals')
      .select('*')
      .or(`barcode.eq.${barcode},tag.eq.${barcode}`)
      .single();

    if (animal) {
      console.log('✅ [Barcode] Found animal by tag/barcode:', animal.name);
      return {
        id: animal.id,
        type: 'animal',
        name: animal.name,
        details: animal,
      };
    }

    // 4. Check animals table by NFC tag
    const { data: animalByNFC } = await supabase
      .from('animals')
      .select('*')
      .eq('nfc_tag_id', barcode)
      .single();

    if (animalByNFC) {
      console.log('✅ [Barcode] Found animal by NFC tag:', animalByNFC.name);
      // Record NFC scan
      await NFCService.recordNFCScan(animalByNFC.id).catch(() => {});
      return {
        id: animalByNFC.id,
        type: 'animal',
        name: animalByNFC.name,
        details: animalByNFC,
      };
    }

    // 5. Check cached universal products
    const cachedProduct = await ProductCacheService.get(barcode);
    if (cachedProduct) {
      console.log('✅ [Barcode] Found in product cache');
      return cachedProduct;
    }

    // 6. Query internet APIs for unknown products
    const internetProduct = await ProductLookupService.lookup(barcode);
    if (internetProduct) {
      console.log('✅ [Barcode] Found on internet:', internetProduct.source);
      // Cache for future offline use
      await ProductCacheService.set(internetProduct);
      return internetProduct;
    }

    // 7. Try service/QR code lookup (URLs, vCards, etc.)
    try {
      const serviceData = await ServiceLookupService.parse(barcode);
      if (serviceData.type !== 'unknown') {
        console.log('✅ [Barcode] Identified as service QR:', serviceData.type);
        return {
          barcode,
          product_name: serviceData.parsed?.text || serviceData.parsed?.url || 'Service QR Code',
          source: 'manual' as const,
          raw_data: serviceData,
        };
      }
    } catch (error) {
      console.warn('⚠️ [Barcode] Service lookup failed:', error);
    }

    console.log('❌ [Barcode] Not found anywhere:', barcode);
    return null;
  }

  /**
   * Fetch entity details by type and ID
   */
  static async fetchEntity(entityType: string, entityId: string): Promise<BarcodeEntity | null> {
    switch (entityType) {
      case 'animal': {
        const { data } = await supabase
          .from('animals')
          .select('*')
          .eq('id', entityId)
          .single();
        
        return data ? {
          id: data.id,
          type: 'animal',
          name: data.name,
          details: data,
        } : null;
      }

      case 'inventory': {
        const { data } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('id', entityId)
          .single();
        
        return data ? {
          id: data.id,
          type: 'inventory',
          name: data.name,
          details: data,
        } : null;
      }

      case 'lot': {
        const { data } = await supabase
          .from('lots')
          .select('*')
          .eq('id', entityId)
          .single();
        
        return data ? {
          id: data.id,
          type: 'lot',
          name: data.name,
          details: data,
        } : null;
      }

      default:
        return null;
    }
  }

  /**
   * Register a new barcode in the universal registry
   */
  static async registerBarcode(
    barcode: string,
    entityType: 'animal' | 'inventory' | 'equipment' | 'lot' | 'user',
    entityId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if barcode already exists
    const { data: existing } = await supabase
      .from('barcode_registry')
      .select('id')
      .eq('barcode', barcode)
      .single();

    if (existing) {
      return { success: false, error: 'Barcode already registered' };
    }

    const { error } = await supabase
      .from('barcode_registry')
      .insert({
        barcode,
        entity_type: entityType,
        entity_id: entityId,
        created_by: user.user.id,
        notes,
      });

    if (error) {
      console.error('❌ [Barcode] Registration failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [Barcode] Registered:', barcode, 'for', entityType, entityId);
    return { success: true };
  }

  /**
   * Record barcode scan for analytics
   */
  static async recordScan(
    barcode: string,
    entityType?: string,
    entityId?: string,
    context?: string,
    location?: { latitude: number; longitude: number }
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    await supabase.from('barcode_scan_history').insert({
      barcode,
      entity_type: entityType,
      entity_id: entityId,
      scanned_by: user.user.id,
      scan_context: context,
      scan_location: location ? { coordinates: location } : null,
    });

    console.log('📊 [Barcode] Scan recorded:', barcode);
  }

  /**
   * Generate EAN-13 compatible barcode number
   */
  static generateBarcode(prefix: string = '200'): string {
    // EAN-13 format: prefix (3 digits) + random (9 digits) + checksum (1 digit)
    const randomPart = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const baseNumber = prefix + randomPart;
    
    // Calculate EAN-13 checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(baseNumber[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    
    return baseNumber + checksum;
  }
}

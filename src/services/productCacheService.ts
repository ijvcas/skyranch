import { supabase } from '@/integrations/supabase/client';
import type { UniversalProduct } from './productLookupService';

/**
 * Product Cache Service
 * Caches internet-found products locally in Supabase
 */
export class ProductCacheService {
  /**
   * Get cached product by barcode
   */
  static async get(barcode: string): Promise<UniversalProduct | null> {
    const { data, error } = await supabase
      .from('universal_products')
      .select('*')
      .eq('barcode', barcode)
      .gt('cache_expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    // Increment scan count
    await this.incrementScanCount(barcode);

    return {
      id: data.id,
      barcode: data.barcode,
      product_name: data.product_name,
      brand: data.brand || undefined,
      category: data.category || undefined,
      image_url: data.image_url || undefined,
      ingredients: data.ingredients || undefined,
      nutrition_data: data.nutrition_data,
      source: data.source as 'openfoodfacts' | 'upcitemdb' | 'manual',
      source_url: data.source_url || undefined,
      raw_data: data.raw_data,
    };
  }

  /**
   * Cache a product
   */
  static async set(product: UniversalProduct): Promise<void> {
    const { error } = await supabase
      .from('universal_products')
      .upsert({
        barcode: product.barcode,
        product_name: product.product_name,
        brand: product.brand,
        category: product.category,
        image_url: product.image_url,
        ingredients: product.ingredients,
        nutrition_data: product.nutrition_data,
        source: product.source,
        source_url: product.source_url,
        raw_data: product.raw_data,
        cached_at: new Date().toISOString(),
        cache_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        scan_count: 1,
        last_scanned_at: new Date().toISOString(),
      }, {
        onConflict: 'barcode'
      });

    if (error) {
      console.error('❌ [Product Cache] Failed to cache product:', error);
    }
  }

  /**
   * Increment scan count for analytics
   */
  private static async incrementScanCount(barcode: string): Promise<void> {
    try {
      await supabase.rpc('increment_product_scan_count', {
        product_barcode: barcode
      });
    } catch (error) {
      console.warn('⚠️ [Product Cache] Failed to increment scan count:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupExpired(): Promise<void> {
    const { error } = await supabase
      .from('universal_products')
      .delete()
      .lt('cache_expires_at', new Date().toISOString());

    if (error) {
      console.error('❌ [Product Cache] Failed to cleanup expired products:', error);
    }
  }
}

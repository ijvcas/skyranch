/**
 * Universal Product Lookup Service
 * Queries internet APIs to identify products by barcode
 */

export interface UniversalProduct {
  id?: string;
  barcode: string;
  product_name: string;
  brand?: string;
  category?: string;
  image_url?: string;
  ingredients?: string;
  nutrition_data?: any;
  source: 'openfoodfacts' | 'upcitemdb' | 'manual';
  source_url?: string;
  raw_data?: any;
}

export class ProductLookupService {
  /**
   * Lookup product from multiple APIs
   */
  static async lookup(barcode: string): Promise<UniversalProduct | null> {
    console.log('🔍 [Product Lookup] Searching internet for:', barcode);

    // Try Open Food Facts first (free, no API key)
    try {
      const product = await this.queryOpenFoodFacts(barcode);
      if (product) {
        console.log('✅ [Product Lookup] Found in Open Food Facts');
        return product;
      }
    } catch (error) {
      console.warn('⚠️ [Product Lookup] Open Food Facts failed:', error);
    }

    // Fallback to UPCitemdb (free tier: 100/day)
    try {
      const product = await this.queryUPCItemDB(barcode);
      if (product) {
        console.log('✅ [Product Lookup] Found in UPCitemdb');
        return product;
      }
    } catch (error) {
      console.warn('⚠️ [Product Lookup] UPCitemdb failed:', error);
    }

    console.log('❌ [Product Lookup] Product not found in any database');
    return null;
  }

  /**
   * Query Open Food Facts API
   * Free, no API key required
   */
  private static async queryOpenFoodFacts(barcode: string): Promise<UniversalProduct | null> {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FARMIKA/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;

    return {
      barcode,
      product_name: product.product_name || product.generic_name || 'Unknown Product',
      brand: product.brands || undefined,
      category: product.categories || undefined,
      image_url: product.image_url || product.image_front_url || undefined,
      ingredients: product.ingredients_text || undefined,
      nutrition_data: product.nutriments || undefined,
      source: 'openfoodfacts',
      source_url: `https://world.openfoodfacts.org/product/${barcode}`,
      raw_data: product,
    };
  }

  /**
   * Query UPCitemdb API
   * Free tier: 100 requests/day
   */
  private static async queryUPCItemDB(barcode: string): Promise<UniversalProduct | null> {
    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FARMIKA/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];

    return {
      barcode,
      product_name: item.title || 'Unknown Product',
      brand: item.brand || undefined,
      category: item.category || undefined,
      image_url: item.images?.[0] || undefined,
      source: 'upcitemdb',
      source_url: undefined,
      raw_data: item,
    };
  }
}

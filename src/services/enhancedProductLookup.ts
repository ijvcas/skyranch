/**
 * Enhanced Product Lookup Service
 * Adds additional product database APIs for better coverage
 */

import type { UniversalProduct } from './productLookupService';

export class EnhancedProductLookup {
  /**
   * Query Google Books API for ISBN barcodes
   */
  static async queryGoogleBooks(isbn: string): Promise<UniversalProduct | null> {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return null;
      }

      const book = data.items[0].volumeInfo;
      return {
        barcode: isbn,
        product_name: book.title || 'Unknown Book',
        brand: book.authors?.join(', '),
        category: 'Books',
        image_url: book.imageLinks?.thumbnail,
        source: 'openfoodfacts', // Reusing type, but noting it's Google Books
        source_url: book.infoLink,
        raw_data: book,
      };
    } catch (error) {
      console.warn('[Google Books] Lookup failed:', error);
      return null;
    }
  }

  /**
   * Query Barcode Lookup API (100 requests/day free)
   */
  static async queryBarcodeLookup(barcode: string): Promise<UniversalProduct | null> {
    try {
      const url = `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=trial`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.products || data.products.length === 0) {
        return null;
      }

      const product = data.products[0];
      return {
        barcode,
        product_name: product.title || product.product_name || 'Unknown Product',
        brand: product.brand || product.manufacturer,
        category: product.category,
        image_url: product.images?.[0],
        source: 'upcitemdb', // Reusing type
        raw_data: product,
      };
    } catch (error) {
      console.warn('[Barcode Lookup] Failed:', error);
      return null;
    }
  }

  /**
   * Check if barcode is an ISBN (book)
   */
  static isISBN(barcode: string): boolean {
    return barcode.length === 10 || barcode.length === 13 && barcode.startsWith('978');
  }
}

/**
 * Smart Image Compression Service
 * Compresses images based on network conditions and device storage
 */

import { networkStorageService, type DeviceConditions } from './networkStorageService';

export type CompressionTier = 'high' | 'medium' | 'low' | 'aggressive';

export interface CompressionSettings {
  quality: number;
  maxDimension: number;
  format: 'image/webp' | 'image/jpeg';
  stripMetadata: boolean;
}

export interface CompressionResult {
  dataUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  reductionPercent: number;
  tier: CompressionTier;
  conditions: DeviceConditions;
}

export type CompressionProgressCallback = (progress: number, stage: string) => void;

class ImageCompressionService {
  /**
   * Compress image intelligently based on current device conditions
   */
  async compressImage(dataUrl: string, onProgress?: CompressionProgressCallback): Promise<CompressionResult> {
    console.log('📸 Starting smart image compression...');
    
    onProgress?.(10, 'Analizando condiciones...');
    
    // Get current device conditions
    const conditions = await networkStorageService.getDeviceConditions();
    console.log('📊 Device conditions:', conditions);

    onProgress?.(20, 'Determinando calidad...');
    
    // Determine compression tier
    const tier = this.determineCompressionTier(conditions);
    console.log('🎚️ Compression tier:', tier);

    // Get compression settings for tier
    const settings = this.getCompressionSettings(tier);
    console.log('⚙️ Compression settings:', settings);

    onProgress?.(30, 'Calculando tamaño...');
    
    // Calculate original size
    const originalSizeKB = this.getDataUrlSizeKB(dataUrl);
    console.log('📏 Original size:', originalSizeKB, 'KB');

    onProgress?.(40, 'Comprimiendo imagen...');
    
    // Compress the image
    const compressedDataUrl = await this.applyCompression(dataUrl, settings, (progress) => {
      onProgress?.(40 + (progress * 0.5), 'Comprimiendo imagen...');
    });
    
    onProgress?.(90, 'Finalizando...');
    
    // Calculate compressed size
    const compressedSizeKB = this.getDataUrlSizeKB(compressedDataUrl);
    const reductionPercent = Math.round(((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100);

    console.log('✅ Compression complete:', {
      originalKB: originalSizeKB,
      compressedKB: compressedSizeKB,
      reduction: reductionPercent + '%'
    });

    onProgress?.(100, 'Compresión completa');

    return {
      dataUrl: compressedDataUrl,
      originalSizeKB,
      compressedSizeKB,
      reductionPercent,
      tier,
      conditions
    };
  }

  /**
   * Determine compression tier based on device conditions
   */
  private determineCompressionTier(conditions: DeviceConditions): CompressionTier {
    // Critical storage overrides everything
    if (conditions.storageLevel === 'critical') {
      return 'aggressive';
    }

    // Offline or slow network with low storage
    if (!conditions.isOnline || 
        (conditions.networkSpeed === 'slow' && conditions.storageLevel === 'low')) {
      return 'aggressive';
    }

    // Low storage
    if (conditions.storageLevel === 'low') {
      return 'low';
    }

    // Slow or moderate network
    if (conditions.networkSpeed === 'slow') {
      return 'low';
    }
    
    if (conditions.networkSpeed === 'moderate') {
      return 'medium';
    }

    // Fast network + good storage
    if (conditions.networkSpeed === 'fast' && 
        (conditions.storageLevel === 'high' || conditions.storageLevel === 'moderate')) {
      return 'high';
    }

    // Default to medium
    return 'medium';
  }

  /**
   * Get compression settings for a tier
   */
  private getCompressionSettings(tier: CompressionTier): CompressionSettings {
    const settings: Record<CompressionTier, CompressionSettings> = {
      high: {
        quality: 0.90,
        maxDimension: 2048,
        format: this.supportsWebP() ? 'image/webp' : 'image/jpeg',
        stripMetadata: true
      },
      medium: {
        quality: 0.75,
        maxDimension: 1280,
        format: this.supportsWebP() ? 'image/webp' : 'image/jpeg',
        stripMetadata: true
      },
      low: {
        quality: 0.60,
        maxDimension: 800,
        format: 'image/jpeg',
        stripMetadata: true
      },
      aggressive: {
        quality: 0.45,
        maxDimension: 640,
        format: 'image/jpeg',
        stripMetadata: true
      }
    };

    return settings[tier];
  }

  /**
   * Apply compression to image
   */
  private async applyCompression(dataUrl: string, settings: CompressionSettings, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          onProgress?.(0.2);
          
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          onProgress?.(0.4);
          
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;

          if (width > settings.maxDimension || height > settings.maxDimension) {
            if (width > height) {
              height = Math.round((height * settings.maxDimension) / width);
              width = settings.maxDimension;
            } else {
              width = Math.round((width * settings.maxDimension) / height);
              height = settings.maxDimension;
            }
          }

          // Set canvas size
          canvas.width = width;
          canvas.height = height;

          onProgress?.(0.6);
          
          // Draw image with high quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          onProgress?.(0.8);
          
          // Convert to data URL with compression
          const compressedDataUrl = canvas.toDataURL(settings.format, settings.quality);
          
          onProgress?.(1);
          
          resolve(compressedDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Check if browser supports WebP
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Get size of data URL in KB
   */
  private getDataUrlSizeKB(dataUrl: string): number {
    // Remove data URL prefix to get base64 string
    const base64 = dataUrl.split(',')[1] || dataUrl;
    
    // Calculate size (base64 is ~4/3 of original)
    const bytes = (base64.length * 3) / 4;
    return Math.round(bytes / 1024);
  }

  /**
   * Convert data URL to Blob
   */
  dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64 = parts[1];
    
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: mime });
  }

  /**
   * Get compression tier description
   */
  getTierDescription(tier: CompressionTier): string {
    const descriptions: Record<CompressionTier, string> = {
      high: 'Alta calidad',
      medium: 'Calidad media',
      low: 'Calidad optimizada',
      aggressive: 'Máxima compresión'
    };
    return descriptions[tier];
  }
}

export const imageCompressionService = new ImageCompressionService();

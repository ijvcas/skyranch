import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

class ShareService {
  private isNative = Capacitor.isNativePlatform();

  /**
   * Check if native share is available
   */
  isAvailable(): boolean {
    return this.isNative;
  }

  /**
   * Share text content
   */
  async shareText(text: string, title?: string): Promise<void> {
    if (!this.isAvailable()) {
      // Fallback for web - use Web Share API if available
      if (navigator.share) {
        try {
          await navigator.share({ text, title });
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Web share failed:', error);
            throw error;
          }
        }
      } else {
        // Final fallback - copy to clipboard
        await navigator.clipboard.writeText(text);
        throw new Error('Compartir no disponible. Texto copiado al portapapeles.');
      }
      return;
    }

    try {
      await Share.share({
        text,
        title: title || 'Compartir desde FARMIKA',
        dialogTitle: title || 'Compartir'
      });
    } catch (error) {
      console.error('Native share failed:', error);
      throw error;
    }
  }

  /**
   * Share a URL
   */
  async shareUrl(url: string, title?: string, text?: string): Promise<void> {
    if (!this.isAvailable()) {
      if (navigator.share) {
        try {
          await navigator.share({ url, title, text });
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Web share failed:', error);
            throw error;
          }
        }
      } else {
        await navigator.clipboard.writeText(url);
        throw new Error('Compartir no disponible. URL copiada al portapapeles.');
      }
      return;
    }

    try {
      await Share.share({
        url,
        title: title || 'Compartir desde FARMIKA',
        text,
        dialogTitle: title || 'Compartir'
      });
    } catch (error) {
      console.error('Native share failed:', error);
      throw error;
    }
  }

  /**
   * Share animal information
   */
  async shareAnimal(animal: { name: string; tag: string; breed?: string; gender?: string }): Promise<void> {
    const text = `
🐄 Animal: ${animal.name}
🏷️ Arete: ${animal.tag}
${animal.breed ? `📋 Raza: ${animal.breed}` : ''}
${animal.gender ? `⚧️ Sexo: ${animal.gender}` : ''}

Compartido desde FARMIKA
    `.trim();

    await this.shareText(text, `Información de ${animal.name}`);
  }

  /**
   * Share backup file information
   */
  async shareBackupInfo(fileName: string, recordCount: number, date: string): Promise<void> {
    const text = `
📦 Respaldo FARMIKA
📄 Archivo: ${fileName}
📊 Registros: ${recordCount}
📅 Fecha: ${date}

Respaldo creado con FARMIKA
    `.trim();

    await this.shareText(text, 'Respaldo FARMIKA');
  }
}

export const shareService = new ShareService();

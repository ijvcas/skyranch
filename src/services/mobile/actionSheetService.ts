import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { Capacitor } from '@capacitor/core';

export interface ActionSheetButton {
  text: string;
  role?: 'cancel' | 'destructive';
  handler?: () => void | Promise<void>;
}

class ActionSheetService {
  private isNative = Capacitor.isNativePlatform();

  /**
   * Check if native action sheets are available
   */
  isAvailable(): boolean {
    return this.isNative;
  }

  /**
   * Show an action sheet
   */
  async showActionSheet(
    title: string,
    message: string | undefined,
    buttons: ActionSheetButton[]
  ): Promise<number> {
    if (!this.isAvailable()) {
      // For web, we'll return -1 to indicate not supported
      // Components should fall back to their own UI
      return -1;
    }

    try {
      const options = buttons.map(button => ({
        title: button.text,
        style: button.role === 'destructive' 
          ? ActionSheetButtonStyle.Destructive 
          : button.role === 'cancel'
            ? ActionSheetButtonStyle.Cancel
            : ActionSheetButtonStyle.Default
      }));

      const result = await ActionSheet.showActions({
        title,
        message,
        options
      });

      // Execute the handler for the selected button
      const selectedButton = buttons[result.index];
      if (selectedButton?.handler) {
        await selectedButton.handler();
      }

      return result.index;
    } catch (error) {
      console.error('Action sheet failed:', error);
      throw error;
    }
  }

  /**
   * Show a confirmation dialog
   */
  async showConfirmation(
    title: string,
    message: string,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar',
    destructive: boolean = false
  ): Promise<boolean> {
    const buttons: ActionSheetButton[] = [
      {
        text: confirmText,
        role: destructive ? 'destructive' : undefined
      },
      {
        text: cancelText,
        role: 'cancel'
      }
    ];

    const result = await this.showActionSheet(title, message, buttons);
    return result === 0; // First button is confirm
  }

  /**
   * Show photo source options (camera, gallery, file)
   */
  async showPhotoSourceOptions(
    onCamera: () => void | Promise<void>,
    onGallery: () => void | Promise<void>,
    onFile?: () => void | Promise<void>
  ): Promise<void> {
    const buttons: ActionSheetButton[] = [
      {
        text: 'Tomar Foto',
        handler: onCamera
      },
      {
        text: 'Seleccionar de Galería',
        handler: onGallery
      }
    ];

    if (onFile) {
      buttons.push({
        text: 'Subir Archivo',
        handler: onFile
      });
    }

    buttons.push({
      text: 'Cancelar',
      role: 'cancel'
    });

    await this.showActionSheet(
      'Seleccionar Foto',
      'Elige una opción para agregar una foto',
      buttons
    );
  }

  /**
   * Show delete confirmation
   */
  async showDeleteConfirmation(
    itemName: string,
    itemType: string = 'elemento'
  ): Promise<boolean> {
    return await this.showConfirmation(
      `¿Eliminar ${itemType}?`,
      `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`,
      'Eliminar',
      'Cancelar',
      true
    );
  }
}

export const actionSheetService = new ActionSheetService();

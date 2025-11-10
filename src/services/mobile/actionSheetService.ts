import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { Capacitor } from '@capacitor/core';
import i18n from '@/i18n/config';

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
    confirmText?: string,
    cancelText?: string,
    destructive: boolean = false
  ): Promise<boolean> {
    const currentLang = i18n.language;
    const defaultConfirm = i18n.t('common:confirm', { lng: currentLang });
    const defaultCancel = i18n.t('common:cancel', { lng: currentLang });
    const buttons: ActionSheetButton[] = [
      {
        text: confirmText || defaultConfirm,
        role: destructive ? 'destructive' : undefined
      },
      {
        text: cancelText || defaultCancel,
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
    const currentLang = i18n.language;
    
    const buttons: ActionSheetButton[] = [
      {
        text: i18n.t('common:takePhoto', { lng: currentLang }) || 'Take Photo',
        handler: onCamera
      },
      {
        text: i18n.t('common:chooseFromGallery', { lng: currentLang }) || 'Choose from Gallery',
        handler: onGallery
      }
    ];

    if (onFile) {
      buttons.push({
        text: i18n.t('common:uploadFile', { lng: currentLang }) || 'Upload File',
        handler: onFile
      });
    }

    buttons.push({
      text: i18n.t('common:cancel', { lng: currentLang }) || 'Cancel',
      role: 'cancel'
    });

    await this.showActionSheet(
      i18n.t('common:selectPhoto', { lng: currentLang }) || 'Select Photo',
      i18n.t('common:choosePhotoOption', { lng: currentLang }) || 'Choose an option to add a photo',
      buttons
    );
  }

  /**
   * Show delete confirmation
   */
  async showDeleteConfirmation(
    itemName: string,
    itemType?: string
  ): Promise<boolean> {
    const currentLang = i18n.language;
    const defaultItemType = i18n.t('common:item', { lng: currentLang }) || 'item';
    const finalItemType = itemType || defaultItemType;
    
    return await this.showConfirmation(
      i18n.t('common:deleteConfirmTitle', { lng: currentLang, itemType: finalItemType }) || `Delete ${finalItemType}?`,
      i18n.t('common:deleteConfirmMessage', { lng: currentLang, itemName, itemType: finalItemType }) || `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      i18n.t('common:delete', { lng: currentLang }) || 'Delete',
      i18n.t('common:cancel', { lng: currentLang }) || 'Cancel',
      true
    );
  }
}

export const actionSheetService = new ActionSheetService();

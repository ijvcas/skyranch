import { Contacts, PermissionStatus } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';

export interface ContactInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

class ContactsService {
  async requestPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      return { contacts: 'granted' };
    }

    return await Contacts.requestPermissions();
  }

  async checkPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      return { contacts: 'granted' };
    }

    return await Contacts.checkPermissions();
  }

  async pickContact(): Promise<ContactInfo | null> {
    if (!Capacitor.isNativePlatform()) {
      console.log('📞 Contacts only available on native platforms');
      return null;
    }

    try {
      const permStatus = await this.checkPermissions();
      if (permStatus.contacts !== 'granted') {
        const requested = await this.requestPermissions();
        if (requested.contacts !== 'granted') {
          console.log('📞 Contacts permission denied');
          return null;
        }
      }

      // Get all contacts and let user pick (simplified approach)
      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
          emails: true
        }
      });

      if (result.contacts.length === 0) {
        return null;
      }

      // For simplicity, return first contact
      // In production, you'd show a native picker or custom UI
      const contact = result.contacts[0];
      return this.formatContact(contact);
    } catch (error) {
      console.error('❌ Error picking contact:', error);
      return null;
    }
  }

  private formatContact(contact: any): ContactInfo {
    return {
      id: contact.contactId,
      name: contact.name?.display || 'Unknown',
      phone: contact.phones?.[0]?.number,
      email: contact.emails?.[0]?.address
    };
  }

  dialNumber(phoneNumber: string): void {
    window.open(`tel:${phoneNumber}`, '_self');
  }

  sendMessage(phoneNumber: string): void {
    window.open(`sms:${phoneNumber}`, '_self');
  }

  sendEmail(email: string): void {
    window.open(`mailto:${email}`, '_self');
  }

  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const contactsService = new ContactsService();

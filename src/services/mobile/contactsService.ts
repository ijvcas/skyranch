import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

interface ContactPickerPlugin {
  open(): Promise<{ value: any[] }>;
}

const ContactPicker = registerPlugin<ContactPickerPlugin>('ContactPicker');

export interface ContactInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

class ContactsService {
  async pickContact(): Promise<ContactInfo | null> {
    if (!Capacitor.isNativePlatform()) {
      console.log('📞 Contacts only available on native platforms');
      return null;
    }

    try {
      // Use native contact picker - shows iOS/Android system picker
      const result = await ContactPicker.open();
      
      if (!result || !result.value || result.value.length === 0) {
        console.log('📞 No contact selected');
        return null;
      }

      // Get first selected contact
      const contact = result.value[0];
      
      // Format contact data
      const formattedContact: ContactInfo = {
        id: contact.contactId || Date.now().toString(),
        name: contact.displayName || 'Unknown',
        phone: contact.phoneNumbers && contact.phoneNumbers.length > 0 
          ? contact.phoneNumbers[0].number 
          : undefined,
        email: contact.emails && contact.emails.length > 0 
          ? contact.emails[0].address 
          : undefined
      };

      // Validate that contact has at least a name and phone
      if (!formattedContact.name || formattedContact.name === 'Unknown') {
        console.log('📞 Contact has no name');
        return null;
      }

      if (!formattedContact.phone) {
        console.log('📞 Contact has no phone number');
        return null;
      }

      console.log('📞 Contact selected:', formattedContact);
      return formattedContact;
    } catch (error) {
      console.error('❌ Error picking contact:', error);
      return null;
    }
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

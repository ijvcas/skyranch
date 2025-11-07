import { Contacts } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';

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
      // Check/request permissions first
      const permission = await Contacts.checkPermissions();
      
      if (permission.contacts !== 'granted') {
        const request = await Contacts.requestPermissions();
        if (request.contacts !== 'granted') {
          console.log('📞 Contact permissions denied');
          return null;
        }
      }

      // Pick a single contact using native iOS picker
      const result = await Contacts.pickContact({
        projection: {
          name: true,
          phones: true,
          emails: true
        }
      });

      if (!result || !result.contact) {
        console.log('📞 No contact selected');
        return null;
      }

      const contact = result.contact;
      
      // Format the contact data
      const formattedContact: ContactInfo = {
        id: contact.contactId || Date.now().toString(),
        name: contact.name?.display || 'Unknown',
        phone: contact.phones && contact.phones.length > 0 
          ? contact.phones[0].number 
          : undefined,
        email: contact.emails && contact.emails.length > 0 
          ? contact.emails[0].address 
          : undefined
      };

      // Validate contact has required fields
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

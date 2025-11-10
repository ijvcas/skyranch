
import { emailEngine } from '../core/EmailEngine';
import { EmailResult, EventDetails } from '../interfaces/EmailTypes';
import { CalendarEventTemplate } from '../templates/CalendarEventTemplate';
import { TestEmailTemplate } from '../templates/TestEmailTemplate';
import { emailLogger } from '../core/EmailLogger';
import i18n from '@/i18n/config';

export class NotificationEmailService {
  private calendarTemplate: CalendarEventTemplate;
  private testTemplate: TestEmailTemplate;

  constructor() {
    this.calendarTemplate = new CalendarEventTemplate();
    this.testTemplate = new TestEmailTemplate();
  }

  async sendEventNotification(
    to: string,
    eventType: 'created' | 'updated' | 'deleted' | 'reminder',
    eventDetails: EventDetails,
    userName?: string,
    userLanguage: string = 'es'
  ): Promise<EmailResult> {
    emailLogger.info('📅 [NOTIFICATION EMAIL] sendEventNotification called', {
      to,
      eventType,
      eventTitle: eventDetails.title,
      userName
    });

    console.log('🔥 [DEBUG] sendEventNotification parameters:', {
      to,
      eventType,
      eventDetails,
      userName
    });

    try {
      console.log('📧 [DEBUG] About to send calendar event email:', {
        to,
        eventType,
        eventTitle: eventDetails.title,
        eventDate: eventDetails.eventDate,
        userName
      });

      // Use the provided userName or fallback to email username
      const displayName = userName || to.split('@')[0];

      // Translate email content using i18n
      const eventTypeKey = eventType.charAt(0).toUpperCase() + eventType.slice(1);
      const translatedMessage = i18n.t(`email:notification.event${eventTypeKey}`, { 
        lng: userLanguage,
        eventTitle: eventDetails.title 
      });
      
      const emailContent = await this.calendarTemplate.render({
        eventType,
        event: eventDetails,
        userName: displayName,
        organizationName: "SkyRanch",
        language: userLanguage,
        title: translatedMessage,
        content: i18n.t('email:notification.details', { lng: userLanguage })
      });

      console.log('📧 [DEBUG] Email content generated with userName:', {
        subject: emailContent.subject,
        htmlLength: emailContent.html.length,
        userName: displayName
      });

      const request = {
        to: { email: to },
        content: emailContent,
        metadata: {
          senderName: "SkyRanch - Sistema de Gestión Ganadera",
          organizationName: "SkyRanch",
          tags: [
            { name: "category", value: "calendar_event" },
            { name: "event_type", value: eventType },
            { name: "recipient_domain", value: to.split('@')[1] }
          ]
        }
      };

      console.log('📧 [DEBUG] Calling emailEngine.sendCustomEmail...');
      const result = await emailEngine.sendCustomEmail(request);
      console.log('📧 [DEBUG] Email engine result:', result);

      emailLogger.info('✅ [NOTIFICATION EMAIL] Event notification sent successfully', {
        messageId: result.messageId,
        recipient: to
      });

      return result;
    } catch (error) {
      console.error('❌ [DEBUG] Error in sendEventNotification:', error);
      emailLogger.error('❌ [NOTIFICATION EMAIL] sendEventNotification failed', {
        errorMessage: error.message,
        errorName: error.name,
        recipient: to
      });
      throw error;
    }
  }

  async sendTestNotification(to: string, userName?: string): Promise<EmailResult> {
    emailLogger.info('🧪 [NOTIFICATION EMAIL] sendTestNotification called', { to, userName });

    try {
      console.log('📧 [DEBUG] About to send test email to:', to, 'with userName:', userName);

      // Use the provided userName or fallback to email username
      const displayName = userName || to.split('@')[0];

      const emailContent = await this.testTemplate.render({ 
        userName: displayName,
        organizationName: "SkyRanch",
        title: "Email de Prueba - SkyRanch",
        content: "Este es un email de prueba del sistema SkyRanch. Si recibes este mensaje, el sistema de correo está funcionando correctamente."
      });

      console.log('📧 [DEBUG] Test email content generated with userName:', {
        subject: emailContent.subject,
        htmlLength: emailContent.html.length,
        userName: displayName
      });

      const request = {
        to: { email: to },
        content: emailContent,
        metadata: {
          senderName: "SkyRanch - Sistema de Gestión Ganadera",
          organizationName: "SkyRanch",
          tags: [
            { name: "category", value: "test_email" },
            { name: "recipient_domain", value: to.split('@')[1] }
          ]
        }
      };

      console.log('📧 [DEBUG] Calling emailEngine.sendCustomEmail for test...');
      const result = await emailEngine.sendCustomEmail(request);
      console.log('📧 [DEBUG] Test email result:', result);

      emailLogger.info('✅ [NOTIFICATION EMAIL] Test notification sent successfully', {
        messageId: result.messageId,
        recipient: to
      });

      return result;
    } catch (error) {
      console.error('❌ [DEBUG] Error in sendTestNotification:', error);
      emailLogger.error('❌ [NOTIFICATION EMAIL] sendTestNotification failed', {
        errorMessage: error.message,
        errorName: error.name,
        recipient: to
      });
      throw error;
    }
  }
}

export const notificationEmailService = new NotificationEmailService();

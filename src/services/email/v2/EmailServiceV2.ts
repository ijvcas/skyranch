
import { notificationEmailService } from '../integration/NotificationEmailService';
import { emailEngine } from '../core/EmailEngine';
import { EmailResult, EventDetails } from '../interfaces/EmailTypes';
import { emailLogger } from '../core/EmailLogger';
import { supabase } from '@/integrations/supabase/client';

export class EmailServiceV2 {
  private async getUserFullName(email: string): Promise<string> {
    try {
      emailLogger.debug('🔍 [EMAIL SERVICE V2] Fetching user full name for email:', email);
      
      // First try to get from app_users table
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .select('name')
        .eq('email', email)
        .single();

      if (appUser && appUser.name) {
        emailLogger.debug('✅ [EMAIL SERVICE V2] Found full name in app_users:', appUser.name);
        return appUser.name;
      }

      // If not found in app_users, try profiles table (RLS ensures only own profile is accessible)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('email', email)
        .eq('id', (await supabase.auth.getUser()).data.user?.id) // Additional security: ensure we only get the current user's profile
        .single();

      if (profile && profile.full_name) {
        emailLogger.debug('✅ [EMAIL SERVICE V2] Found full name in profiles:', profile.full_name);
        return profile.full_name;
      }

      // If no full name found, fallback to email username
      const fallbackName = email.split('@')[0];
      emailLogger.debug('⚠️ [EMAIL SERVICE V2] No full name found, using fallback:', fallbackName);
      return fallbackName;
      
    } catch (error) {
      emailLogger.error('❌ [EMAIL SERVICE V2] Error fetching user full name:', error);
      // Fallback to email username on error
      return email.split('@')[0];
    }
  }

  async sendEmail(
    to: string, 
    subject: string, 
    body: string, 
    eventDetails?: EventDetails
  ): Promise<boolean> {
    emailLogger.info('🔄 [EMAIL SERVICE V2] EmailServiceV2.sendEmail called', { to, subject, hasEventDetails: !!eventDetails });

    if (!to || !subject) {
      const error = 'Missing required parameters: to and subject';
      emailLogger.error('❌ [EMAIL SERVICE V2] Validation failed', { to: !!to, subject: !!subject });
      throw new Error(error);
    }

    try {
      let result: EmailResult;

      if (eventDetails) {
        // This is a calendar event email - fetch the user's full name
        emailLogger.debug('📅 [EMAIL SERVICE V2] Sending calendar event email', { eventDetails });
        
        const userName = await this.getUserFullName(to);
        
        // Determine event type from subject
        let eventType: 'created' | 'updated' | 'deleted' | 'reminder' = 'reminder';
        if (subject.includes('actualizado')) {
          eventType = 'updated';
        } else if (subject.includes('creado') || subject.includes('Nuevo')) {
          eventType = 'created';
        } else if (subject.includes('cancelado')) {
          eventType = 'deleted';
        }

        emailLogger.debug('📅 [EMAIL SERVICE V2] Calling notificationEmailService.sendEventNotification', {
          to,
          eventType,
          userName,
          eventDetails
        });

        result = await notificationEmailService.sendEventNotification(
          to,
          eventType,
          eventDetails,
          userName
        );

        emailLogger.debug('📅 [EMAIL SERVICE V2] notificationEmailService.sendEventNotification result', result);
      } else {
        // This is a custom email with HTML body
        emailLogger.debug('🔧 [EMAIL SERVICE V2] Sending custom email', { bodyLength: body?.length });
        
        emailLogger.debug('🔧 [EMAIL SERVICE V2] Calling emailEngine.sendCustomEmail', {
          to,
          subject,
          bodyLength: body?.length
        });

        result = await emailEngine.sendCustomEmail({
          to: { email: to },
          content: {
            subject,
            html: body
          },
          metadata: {
            senderName: "SkyRanch - Sistema de Gestión Ganadera",
            organizationName: "SkyRanch"
          }
        });

        emailLogger.debug('🔧 [EMAIL SERVICE V2] emailEngine.sendCustomEmail result', result);
      }

      if (result.success) {
        emailLogger.info('✅ [EMAIL SERVICE V2] Email sent successfully', { messageId: result.messageId });
        return true;
      } else {
        emailLogger.error('❌ [EMAIL SERVICE V2] Email sending failed', { 
          error: result.error, 
          details: result.details 
        });
        throw new Error(result.error || 'Email sending failed');
      }
      
    } catch (error) {
      emailLogger.error('❌ [EMAIL SERVICE V2] EmailServiceV2.sendEmail failed', {
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack?.substring(0, 500)
      });
      throw error;
    }
  }

  async testEmail(to: string): Promise<boolean> {
    emailLogger.info('🧪 [EMAIL SERVICE V2] EmailServiceV2.testEmail called', { to });
    
    try {
      // Fetch the user's full name for test email too
      const userName = await this.getUserFullName(to);
      
      emailLogger.debug('🧪 [EMAIL SERVICE V2] Calling notificationEmailService.sendTestNotification', { to, userName });
      
      const result = await notificationEmailService.sendTestNotification(to, userName);
      
      emailLogger.debug('🧪 [EMAIL SERVICE V2] notificationEmailService.sendTestNotification result', result);

      if (result.success) {
        emailLogger.info('✅ [EMAIL SERVICE V2] Test email sent successfully', { messageId: result.messageId });
        return true;
      } else {
        emailLogger.error('❌ [EMAIL SERVICE V2] Test email sending failed', { 
          error: result.error, 
          details: result.details 
        });
        throw new Error(result.error || 'Test email sending failed');
      }
    } catch (error) {
      emailLogger.error('❌ [EMAIL SERVICE V2] EmailServiceV2.testEmail failed', {
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack?.substring(0, 500)
      });
      throw error;
    }
  }

  // Health check method
  async healthCheck() {
    emailLogger.info('🏥 [EMAIL SERVICE V2] Health check called');
    return await emailEngine.healthCheck();
  }

  getLogs(level?: 'info' | 'warn' | 'error' | 'debug') {
    return emailEngine.getLogger().getLogs(level);
  }
}

export const emailServiceV2 = new EmailServiceV2();

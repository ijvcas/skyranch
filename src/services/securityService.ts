import { supabase } from '@/integrations/supabase/client';

/**
 * Security service for audit logging and session management
 */
export class SecurityService {
  /**
   * Log security-related events for audit trails
   */
  static async logAuditEvent(event: {
    action: string;
    userId?: string;
    metadata?: Record<string, any>;
    reason?: string;
  }) {
    try {
      // Enhanced security logging with more context
      const logEntry = {
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        ...event
      };
      
      console.log('🔒 Security Audit Log:', logEntry);
      
      // Log all security events to user_role_audit table for comprehensive tracking
      const { error } = await supabase
        .from('user_role_audit')
        .insert({
          user_id: event.userId || '',
          old_role: event.action,
          new_role: event.action,
          changed_by: (await supabase.auth.getUser()).data.user?.id || '',
          reason: event.reason,
          metadata: {
            ...event.metadata,
            security_context: logEntry,
            session_info: {
              timestamp: logEntry.timestamp,
              userAgent: logEntry.userAgent,
              url: logEntry.url
            }
          }
        });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Error in security audit logging:', error);
    }
  }

  /**
   * Log failed login attempts for security monitoring
   */
  static async logFailedLogin(email: string, reason: string, metadata?: Record<string, any>) {
    await this.logAuditEvent({
      action: 'failed_login_attempt',
      metadata: {
        email,
        reason,
        timestamp: new Date().toISOString(),
        ...metadata
      },
      reason: `Failed login: ${reason}`
    });
  }

  /**
   * Log admin operations for audit trail
   */
  static async logAdminOperation(operation: string, targetUserId?: string, changes?: Record<string, any>) {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) return;

      // Call the server-side admin logging function
      const { error } = await supabase.rpc('log_admin_operation', {
        operation_type: operation,
        table_name: 'admin_operation',
        record_id: targetUserId,
        old_data: changes?.old || null,
        new_data: changes?.new || null,
        reason: `Admin operation: ${operation}`
      });

      if (error) {
        console.error('Failed to log admin operation:', error);
      }
    } catch (error) {
      console.error('Error logging admin operation:', error);
    }
  }

  /**
   * Force logout user sessions (admin only)
   * Note: This is a placeholder for session invalidation - actual implementation would require edge function
   */
  static async invalidateUserSessions(userId: string): Promise<boolean> {
    try {
      // Log the security action
      await this.logAuditEvent({
        action: 'session_invalidation',
        userId,
        reason: 'Admin forced logout'
      });

      // For now, we'll just log this action since we don't have the RPC function yet
      console.log('🔒 Session invalidation requested for user:', userId);
      
      // In a real implementation, this would call an edge function to invalidate JWT tokens
      return true;
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
      throw error;
    }
  }

  /**
   * Check if user has required permissions for sensitive operations
   */
  static async checkPermissionForSensitiveOperation(requiredRole: string = 'admin'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !data) return false;

      return data.role === requiredRole;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Validate password using server-side validation
   */
  static async validatePassword(password: string, email?: string, fullName?: string) {
    try {
      const { data, error } = await supabase.rpc('validate_password_server_side', {
        password,
        email: email || null,
        full_name: fullName || null
      });

      if (error) {
        throw new Error(`Password validation failed: ${error.message}`);
      }

      return data as { valid: boolean; score: number; errors: string[] };
    } catch (error) {
      console.error('Error in server-side password validation:', error);
      throw error;
    }
  }
}
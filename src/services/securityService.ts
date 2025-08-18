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
      // This would typically go to a dedicated audit log table
      console.log('🔒 Security Audit Log:', {
        timestamp: new Date().toISOString(),
        ...event
      });
      
      // For now, we'll use the existing user_role_audit table for role-related events
      if (event.action.includes('role') || event.action.includes('session')) {
        const { error } = await supabase
          .from('user_role_audit')
          .insert({
            user_id: event.userId || '',
            old_role: event.action,
            new_role: event.action,
            changed_by: (await supabase.auth.getUser()).data.user?.id || '',
            reason: event.reason,
            metadata: event.metadata
          });

        if (error) {
          console.error('Failed to log audit event:', error);
        }
      }
    } catch (error) {
      console.error('Error in security audit logging:', error);
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
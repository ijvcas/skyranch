import { useState, useEffect } from 'react';
import { validatePasswordServerSide } from '@/utils/passwordPolicy';
import { SecurityService } from '@/services/securityService';
import { loginRateLimiter, passwordChangeRateLimiter, generateCSRFToken } from '@/utils/security';

/**
 * Security hook for managing authentication, validation, and security features
 */
export const useSecurity = () => {
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    // Generate CSRF token on mount
    setCsrfToken(generateCSRFToken());
  }, []);

  const checkRateLimit = (operation: 'login' | 'password_change', identifier: string): boolean => {
    switch (operation) {
      case 'login':
        return loginRateLimiter.isAllowed(identifier);
      case 'password_change':
        return passwordChangeRateLimiter.isAllowed(identifier);
      default:
        return true;
    }
  };

  const resetRateLimit = (operation: 'login' | 'password_change', identifier: string): void => {
    switch (operation) {
      case 'login':
        loginRateLimiter.reset(identifier);
        break;
      case 'password_change':
        passwordChangeRateLimiter.reset(identifier);
        break;
    }
  };

  const validatePasswordSecure = async (password: string, email?: string, fullName?: string) => {
    try {
      return await validatePasswordServerSide(password, email, fullName);
    } catch (error) {
      console.error('Password validation failed:', error);
      return { valid: false, score: 0, errors: ['Error validating password'] };
    }
  };

  const logSecurityEvent = async (action: string, userId?: string, metadata?: Record<string, any>) => {
    await SecurityService.logAuditEvent({
      action,
      userId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      }
    });
  };

  const logFailedLogin = async (email: string, reason: string) => {
    await SecurityService.logFailedLogin(email, reason, {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  };

  const checkAdminPermissions = async (): Promise<boolean> => {
    return await SecurityService.checkPermissionForSensitiveOperation('admin');
  };

  return {
    csrfToken,
    checkRateLimit,
    resetRateLimit,
    validatePasswordSecure,
    logSecurityEvent,
    logFailedLogin,
    checkAdminPermissions,
    invalidateUserSessions: SecurityService.invalidateUserSessions,
    logAdminOperation: SecurityService.logAdminOperation
  };
};

/**
 * Hook for secure form handling with validation and CSRF protection
 */
export const useSecureForm = () => {
  const { csrfToken, logSecurityEvent } = useSecurity();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const secureSubmit = async <T,>(
    formData: T,
    submitFn: (data: T, csrfToken: string) => Promise<any>,
    options?: {
      logAction?: string;
      userId?: string;
    }
  ) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await submitFn(formData, csrfToken);
      
      if (options?.logAction) {
        await logSecurityEvent(options.logAction, options.userId, { 
          action: 'form_submit_success',
          formType: options.logAction 
        });
      }
      
      return result;
    } catch (error) {
      if (options?.logAction) {
        await logSecurityEvent(options.logAction, options.userId, { 
          action: 'form_submit_error',
          formType: options.logAction,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    secureSubmit,
    isSubmitting,
    csrfToken
  };
};
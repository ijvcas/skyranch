// Security utilities for input sanitization and validation

/**
 * Sanitizes HTML input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitizes user input for safe display and database storage
 */
export function sanitizeUserInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['";]/g, '') // Remove quotes and semicolons to prevent injection
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validates email format with security considerations
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string' || email.length > 254) return false;
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && !email.includes('..') && !email.startsWith('.');
}

/**
 * Validates phone number format
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') return false;
  
  // Allow empty phone numbers
  if (phone.trim() === '') return true;
  
  // Basic phone validation (digits, spaces, dashes, parentheses, plus)
  const phoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates user names to prevent malicious input
 */
export function isValidName(name: string): boolean {
  if (typeof name !== 'string' || name.length < 1 || name.length > 100) return false;
  
  // Allow letters, spaces, hyphens, apostrophes, and basic accented characters
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-'\.]+$/;
  return nameRegex.test(name.trim());
}

/**
 * Rate limiting helper - simple in-memory rate limiter
 */
class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) { // 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now - attempt.lastAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    attempt.count++;
    attempt.lastAttempt = now;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Global rate limiters
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const passwordChangeRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour

/**
 * Generates a secure random token for CSRF protection
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates CSRF token
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (typeof token !== 'string' || typeof expectedToken !== 'string') return false;
  if (token.length !== expectedToken.length) return false;
  
  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Enhanced input validation with security logging
 */
export function validateAndSanitizeInput(input: string, fieldName: string): { sanitized: string; isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  let sanitized = sanitizeUserInput(input);
  
  // Additional security checks
  if (input.includes('<script>') || input.includes('javascript:')) {
    errors.push(`Potential XSS attempt in ${fieldName}`);
  }
  
  if (input.includes('UNION') || input.includes('SELECT') || input.includes('DROP')) {
    errors.push(`Potential SQL injection attempt in ${fieldName}`);
  }
  
  return {
    sanitized,
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Session timeout management
 */
export const SESSION_TIMEOUT_MINUTES = 30;

export function isSessionExpired(lastActivity: Date): boolean {
  const now = new Date();
  const timeDiff = now.getTime() - lastActivity.getTime();
  const minutesDiff = timeDiff / (1000 * 60);
  return minutesDiff > SESSION_TIMEOUT_MINUTES;
}

export function updateLastActivity(): void {
  localStorage.setItem('lastActivity', new Date().toISOString());
}

export function getLastActivity(): Date {
  const lastActivity = localStorage.getItem('lastActivity');
  return lastActivity ? new Date(lastActivity) : new Date();
}
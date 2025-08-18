import { supabase } from '@/integrations/supabase/client';

export interface PasswordCheckResult {
  valid: boolean;
  score: number; // 0-5
  errors: string[];
}

const COMMON_PASSWORDS = new Set([
  'password','123456','123456789','qwerty','letmein','welcome','admin','iloveyou','monkey','dragon','abc123','password1','111111','123123','qwerty123','000000','password123'
]);

export function validatePasswordStrength(password: string, email?: string, fullName?: string): PasswordCheckResult {
  const errors: string[] = [];
  let score = 0;

  const minLength = 12;
  if (password.length >= minLength) score += 1; else errors.push(`La contraseña debe tener al menos ${minLength} caracteres.`);

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (hasLower && hasUpper) score += 1; else errors.push('Usa mayúsculas y minúsculas.');
  if (hasDigit) score += 1; else errors.push('Incluye al menos un número.');
  if (hasSymbol) score += 1; else errors.push('Incluye al menos un símbolo.');

  // No 3 identical consecutive chars
  if (/(.)\1\1/.test(password)) errors.push('Evita caracteres repetidos más de 2 veces.'); else score += 1;

  // Disallow common passwords
  const normalized = password.toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) errors.push('La contraseña es demasiado común.');

  // Avoid including email local part or name tokens
  const localPart = email?.split('@')[0]?.toLowerCase() || '';
  if (localPart.length >= 4 && normalized.includes(localPart)) errors.push('No incluyas tu email en la contraseña.');

  if (fullName) {
    const tokens = fullName.toLowerCase().split(/\s+/).filter(t => t.length >= 3);
    if (tokens.some(t => normalized.includes(t))) errors.push('No incluyas tu nombre en la contraseña.');
  }

  const valid = errors.length === 0;
  return { valid, score: Math.min(score, 5), errors };
}

/**
 * Validates password using server-side validation for enhanced security
 */
export async function validatePasswordServerSide(password: string, email?: string, fullName?: string): Promise<PasswordCheckResult> {
  try {
    const { data, error } = await supabase.rpc('validate_password_server_side', {
      password,
      email: email || null,
      full_name: fullName || null
    });

    if (error || !data) {
      console.warn('Server-side password validation failed, falling back to client-side:', error);
      return validatePasswordStrength(password, email, fullName);
    }

    // Type assertion for the expected response structure
    const result = data as { valid: boolean; score: number; errors: string[] };
    
    return {
      valid: result.valid,
      score: result.score,
      errors: result.errors || []
    };
  } catch (error) {
    console.warn('Error in server-side password validation, using client-side:', error);
    return validatePasswordStrength(password, email, fullName);
  }
}

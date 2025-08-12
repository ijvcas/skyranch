
import { supabase } from '@/integrations/supabase/client';

type ConnectionDetails = {
  method?: string;           // 'password', 'oauth', etc.
  path?: string;
  referrer?: string;
  user_agent?: string;
  device?: string | null;
  os?: string | null;
  browser?: string | null;
  metadata?: Record<string, any> | null;
  success?: boolean;
  error_code?: string | null;
  error_message?: string | null;
};

/**
 * Insert a connection log row for the current authenticated user.
 * RLS requires auth and user_id = auth.uid().
 */
export async function logConnection(event: string, details: ConnectionDetails = {}) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.warn('[connectionLogger] getUser error, skipping log:', userError);
      return;
    }
    if (!user) {
      // Not logged in; cannot insert due to RLS
      console.log('[connectionLogger] No authenticated user, skipping', event);
      return;
    }

    const payload = {
      user_id: user.id,
      event,
      method: details.method ?? undefined,
      path: details.path ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      referrer: details.referrer ?? (typeof document !== 'undefined' ? document.referrer : undefined),
      user_agent: details.user_agent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
      device: details.device ?? null,
      os: details.os ?? null,
      browser: details.browser ?? null,
      success: details.success ?? true,
      error_code: details.error_code ?? null,
      error_message: details.error_message ?? null,
      metadata: details.metadata ?? null,
    };

    const { error } = await supabase.from('user_connection_logs').insert(payload);
    if (error) {
      console.error('[connectionLogger] Insert log error:', error);
    } else {
      console.log('[connectionLogger] Logged event:', event, payload);
    }
  } catch (err) {
    console.error('[connectionLogger] Unexpected error:', err);
  }
}

/**
 * Log a token refresh, but throttle to avoid spam (default: once per hour).
 */
export async function logTokenRefreshedThrottled(thresholdMs = 60 * 60 * 1000) {
  try {
    if (typeof window === 'undefined') return;
    const key = 'ucl:last_token_refresh_logged_at';
    const now = Date.now();
    const last = window.localStorage.getItem(key);
    if (last && now - parseInt(last, 10) < thresholdMs) {
      return;
    }
    await logConnection('token_refreshed');
    window.localStorage.setItem(key, String(now));
  } catch (err) {
    console.error('[connectionLogger] Throttled token refresh log error:', err);
  }
}

/**
 * Log an app open once per browser tab session.
 */
export async function logAppOpenOncePerSession() {
  try {
    if (typeof window === 'undefined') return;
    const key = 'ucl:app_open_logged';
    if (window.sessionStorage.getItem(key)) {
      return;
    }
    await logConnection('app_open');
    window.sessionStorage.setItem(key, '1');
  } catch (err) {
    console.error('[connectionLogger] App open log error:', err);
  }
}

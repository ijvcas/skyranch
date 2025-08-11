
interface TokenData {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}

const TOKEN_STORAGE_KEY = 'gmail_oauth_token';
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before expiry

export const tokenStorage = {
  save: (tokenData: { accessToken: string; refreshToken?: string; expiresIn?: number }) => {
    try {
      const expiresAt = Date.now() + ((tokenData.expiresIn || 3600) * 1000);
      const data: TokenData = {
        accessToken: tokenData.accessToken,
        expiresAt
        // Note: We intentionally do NOT persist refreshToken on the client
      };
      sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(data));
      console.log('🔐 [TOKEN STORAGE] Token saved with expiry (session):', new Date(expiresAt).toISOString());
    } catch (error) {
      console.error('🔐 [TOKEN STORAGE] Error saving token:', error);
    }
  },

  get: (): string | null => {
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) {
        console.log('🔐 [TOKEN STORAGE] No stored token found');
        return null;
      }

      const data: TokenData = JSON.parse(stored);
      const now = Date.now();
      
      if (now >= (data.expiresAt - TOKEN_EXPIRY_BUFFER)) {
        console.log('🔐 [TOKEN STORAGE] Token expired or about to expire, removing from storage');
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        return null;
      }

      const timeUntilExpiry = Math.round((data.expiresAt - now) / 1000 / 60);
      console.log(`🔐 [TOKEN STORAGE] Valid token found, expires in ${timeUntilExpiry} minutes`);
      return data.accessToken;
    } catch (error) {
      console.error('🔐 [TOKEN STORAGE] Error retrieving token:', error);
      // Clear corrupted data
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
  },

  clear: () => {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      console.log('🔐 [TOKEN STORAGE] Token cleared from storage');
    } catch (error) {
      console.error('🔐 [TOKEN STORAGE] Error clearing token:', error);
    }
  },

  isValid: (): boolean => {
    return tokenStorage.get() !== null;
  },

  // Get the raw token data for debugging
  getRaw: (): TokenData | null => {
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('🔐 [TOKEN STORAGE] Error getting raw token data:', error);
      return null;
    }
  }
};

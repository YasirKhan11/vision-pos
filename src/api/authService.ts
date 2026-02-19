/**
 * Vision API Authentication Service
 * 
 * Handles:
 * - User login (username/password)
 * - Picker login (card number)
 * - Token refresh
 * - Logout
 * - Session management
 */

import { ENDPOINTS, API_CONFIG } from './config';
import { httpClient, tokenManager, HttpError } from './httpClient';
import type {
  LoginCredentials,
  PickerLoginCredentials,
  AuthResponse,
  UserInfo,
  UserSettings
} from '../types/api.types';

// ============================================
// User Session Storage
// ============================================

const USER_INFO_KEY = 'vision_user_info';

function saveUserInfo(user: UserInfo): void {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
}

function getUserInfo(): UserInfo | null {
  const stored = localStorage.getItem(USER_INFO_KEY);
  return stored ? JSON.parse(stored) : null;
}

function clearUserInfo(): void {
  localStorage.removeItem(USER_INFO_KEY);
}

// ============================================
// User Settings Storage
// ============================================

function saveUserSettings(settings: UserSettings): void {
  localStorage.setItem(API_CONFIG.USER_SETTINGS_KEY, JSON.stringify(settings));
}

function getStoredUserSettings(): UserSettings | null {
  const stored = localStorage.getItem(API_CONFIG.USER_SETTINGS_KEY);
  return stored ? JSON.parse(stored) : null;
}

function clearUserSettings(): void {
  localStorage.removeItem(API_CONFIG.USER_SETTINGS_KEY);
}

// ============================================
// Authentication Service
// ============================================

export const authService = {
  /**
   * Login with username and password
   * Uses HTTP Basic Authentication header as per API docs
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Create Basic Auth header (standard HTTP Basic Authentication)
      const basicAuth = btoa(`${credentials.username}:${credentials.password}`);

      const response = await httpClient.post<any>(
        ENDPOINTS.AUTH.LOGIN,
        null,
        {
          skipAuth: true,
          headers: {
            'Authorization': `Basic ${basicAuth}`,
          },
        }
      );

      const token = response.data?.token || response.data;

      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received from server');
      }

      // Save token
      tokenManager.setToken(token);

      // Save user info
      const userInfo: UserInfo = {
        username: credentials.username,
      };
      saveUserInfo(userInfo);

      // Fetch and save user settings (defaults)
      try {
        await this.fetchUserSettings(credentials.username);
      } catch (settingsError) {
        console.warn('Failed to fetch user settings, defaults will be used:', settingsError);
      }

      return {
        token,
        user: userInfo,
      };
    } catch (error: any) {
      if (error instanceof HttpError) {
        if (error.status === 401) {
          throw new Error('Invalid username or password');
        }
        throw error;
      }
      throw new Error(error.message || 'Login failed');
    }
  },

  /**
   * Login with picker card number (for warehouse/mobile pickers)
   */
  async loginWithPickerCard(credentials: PickerLoginCredentials): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<any>(
        ENDPOINTS.AUTH.LOGIN,
        { PickerCardNo: credentials.PickerCardNo },
        { skipAuth: true }
      );

      const token = response.data?.token || response.data;

      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received from server');
      }

      // Save token
      tokenManager.setToken(token);

      // Save user info
      const userInfo: UserInfo = {
        username: `Picker-${credentials.PickerCardNo}`,
      };
      saveUserInfo(userInfo);

      // Fetch and save user settings for picking if applicable
      try {
        await this.fetchUserSettings(credentials.PickerCardNo);
      } catch (settingsError) {
        console.warn('Failed to fetch picker user settings:', settingsError);
      }

      return {
        token,
        user: userInfo,
      };
    } catch (error: any) {
      if (error instanceof HttpError) {
        if (error.status === 401) {
          throw new Error('Invalid picker card number');
        }
        throw error;
      }
      throw new Error(error.message || 'Picker login failed');
    }
  },

  /**
   * Refresh the current token
   */
  async refreshToken(): Promise<string> {
    const currentToken = tokenManager.getToken();

    if (!currentToken) {
      throw new Error('No token to refresh');
    }

    try {
      const response = await httpClient.post<any>(
        ENDPOINTS.AUTH.REFRESH_TOKEN,
        null
      );

      const newToken = response.data?.token || response.data;

      if (!newToken || typeof newToken !== 'string') {
        throw new Error('Invalid token received from server');
      }

      tokenManager.setToken(newToken);
      return newToken;
    } catch (error: any) {
      // If refresh fails, clear everything
      this.logout();
      throw new Error('Session expired. Please login again.');
    }
  },

  /**
   * Logout - clear all session data
   */
  logout(): void {
    tokenManager.clearToken();
    clearUserInfo();
    clearUserSettings();
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    const token = tokenManager.getToken();
    return !!token && !tokenManager.isTokenExpired();
  },

  /**
   * Get current user info
   */
  getCurrentUser(): UserInfo | null {
    if (!this.isLoggedIn()) {
      return null;
    }
    return getUserInfo();
  },

  /**
   * Get current token
   */
  getToken(): string | null {
    return tokenManager.getToken();
  },

  /**
   * Get token expiry time
   */
  getTokenExpiry(): Date | null {
    return tokenManager.getTokenExpiry();
  },

  /**
   * Check if token needs refresh soon
   */
  shouldRefreshToken(): boolean {
    return tokenManager.shouldRefreshToken();
  },

  /**
   * Check server health (no auth required)
   * Uses native fetch with extended timeout for slow networks
   */
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for health check

      const response = await fetch(`${API_CONFIG.BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Accept any 2xx status as healthy
      return response.ok;
    } catch (error: any) {
      console.error('Health check failed:', error.message);
      return false;
    }
  },

  /**
   * Get system version info
   */
  async getVersion(): Promise<any> {
    const response = await httpClient.get(ENDPOINTS.HEALTH.VERSION, { skipAuth: true });
    return response.data;
  },

  /**
   * Fetch user-specific defaults (CO, Branch, etc.)
   */
  async fetchUserSettings(username: string): Promise<UserSettings | null> {
    try {
      const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.USERS, {
        params: {
          usercode: username,
          selectlist: 'recid,defco,defbranch,defsalesrep,defaccount,deftillno'
        }
      });

      const data = response.data?.data || response.data || [];
      const records = Array.isArray(data) ? data : [];

      if (records.length > 0) {
        const settings: UserSettings = records[0];
        saveUserSettings(settings);
        return settings;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },

  /**
   * Get currently stored user settings
   */
  getCurrentUserSettings(): UserSettings | null {
    return getStoredUserSettings();
  }
};

export default authService;

/**
 * Vision API HTTP Client
 * 
 * Core HTTP client with:
 * - Automatic token injection
 * - Token refresh on expiry
 * - Request/response interceptors
 * - Error handling
 * - Retry logic
 */

import { API_CONFIG } from './config';
import type { ApiResponse, ApiError } from '../types/api.types';

// ============================================
// Token Management
// ============================================

class TokenManager {
  private static instance: TokenManager;

  private constructor() { }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  getToken(): string | null {
    return localStorage.getItem(API_CONFIG.TOKEN_KEY);
  }

  setToken(token: string, expiresAt?: Date): void {
    localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
    if (expiresAt) {
      localStorage.setItem(API_CONFIG.TOKEN_EXPIRY_KEY, expiresAt.toISOString());
    } else {
      // Default: 3 hours from now
      const expiry = new Date(Date.now() + API_CONFIG.TOKEN_VALIDITY_MS);
      localStorage.setItem(API_CONFIG.TOKEN_EXPIRY_KEY, expiry.toISOString());
    }
  }

  clearToken(): void {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(API_CONFIG.TOKEN_REFRESH_KEY);
  }

  isTokenExpired(): boolean {
    const expiry = localStorage.getItem(API_CONFIG.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return new Date(expiry).getTime() < Date.now();
  }

  shouldRefreshToken(): boolean {
    const expiry = localStorage.getItem(API_CONFIG.TOKEN_EXPIRY_KEY);
    if (!expiry) return false;
    const expiryTime = new Date(expiry).getTime();
    const refreshThreshold = expiryTime - API_CONFIG.TOKEN_REFRESH_THRESHOLD_MS;
    return Date.now() > refreshThreshold && Date.now() < expiryTime;
  }

  getTokenExpiry(): Date | null {
    const expiry = localStorage.getItem(API_CONFIG.TOKEN_EXPIRY_KEY);
    return expiry ? new Date(expiry) : null;
  }
}

export const tokenManager = TokenManager.getInstance();

// ============================================
// HTTP Client
// ============================================

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  timeout?: number;
  skipAuth?: boolean;
  retries?: number;
}

class HttpClient {
  private baseUrl: string;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = tokenManager.getToken();
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  }

  /**
   * Handle token refresh
   */
  private async refreshToken(): Promise<string> {
    // If already refreshing, wait for that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const currentToken = tokenManager.getToken();
        if (!currentToken) {
          throw new Error('No token to refresh');
        }

        const response = await fetch(`${this.baseUrl}/refreshtoken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        const newToken = data.token || data.data?.token;

        if (newToken) {
          tokenManager.setToken(newToken);
          return newToken;
        }

        throw new Error('No token in refresh response');
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Make HTTP request with automatic token handling
   */
  async request<T = any>(
    method: string,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      params,
      timeout = API_CONFIG.REQUEST_TIMEOUT_MS,
      skipAuth = false,
      retries = 0,
      ...fetchOptions
    } = options;

    // Check if token needs refresh
    if (!skipAuth && tokenManager.shouldRefreshToken()) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.warn('Token refresh failed, continuing with current token');
      }
    }

    const url = this.buildUrl(endpoint, params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(!skipAuth ? this.getAuthHeaders() : {}),
      ...(fetchOptions.headers as Record<string, string> || {}),
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 - try token refresh once
      if (response.status === 401 && !skipAuth && retries < 1) {
        try {
          await this.refreshToken();
          // Retry the request with new token
          return this.request<T>(method, endpoint, { ...options, retries: retries + 1 });
        } catch (refreshError) {
          // Refresh failed, clear token and throw
          tokenManager.clearToken();
          throw new HttpError(401, 'Session expired. Please login again.');
        }
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;
      let text = await response.text();

      try {
        // Try parsing as JSON regardless of content-type if it looks like JSON
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          data = JSON.parse(text);
        } else if (contentType?.includes('application/json')) {
          data = JSON.parse(text);
        } else {
          data = text;
        }
      } catch (e) {
        data = text;
      }

      // Handle error responses
      if (!response.ok) {
        const message = data?.message || data?.error || `HTTP ${response.status}`;
        throw new HttpError(response.status, message, data);
      }

      // Check if response is an error object (backend returns 200 with error object)
      // Example: {classname: "Exception", message: "No Data Found.."}
      if (data && typeof data === 'object' && data.classname === 'Exception') {
        // For GET requests with "No Data Found", return empty array instead of error
        if (method === 'GET' && data.message?.includes('No Data Found')) {
          return {
            status: response.status,
            data: [] as any,
            message: data.message,
          };
        }
        // For other exceptions, throw error
        throw new HttpError(response.status, data.message || 'API Error', data);
      }

      // Return standardized response
      return {
        status: response.status,
        data: data.data !== undefined ? data.data : data,
        message: data.message,
        total: data.total || data.recordcount || data.total_records || data.total_count,
        page: data.page || data.pageno,
        pageSize: data.pageSize || data.recordsperpage
      };

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout');
      }

      if (error instanceof HttpError) {
        throw error;
      }

      // Network error or other
      throw new HttpError(0, error.message || 'Network error');
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, options);
  }

  async post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options);
  }
}

// ============================================
// HTTP Error Class
// ============================================

export class HttpError extends Error {
  status: number;
  details?: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }
}

// ============================================
// Export singleton instance
// ============================================

export const httpClient = new HttpClient(API_CONFIG.BASE_URL);

export default httpClient;

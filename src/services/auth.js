/**
 * Authentication Service
 * Handles authentication logic and token management
 */

import { parkingAPI } from './parkingApi';
import { tokenStorage, refreshTokenStorage, userStorage, clearAuthStorage } from '@/utils/storage';
import { isValidEmail } from '@/utils/validation';
import { SECURITY } from '@/config/constants';

/**
 * Authentication Service
 */
class AuthService {
  /**
   * Login with email and password
   */
  async login(email, password) {
    // Validate input
    if (!isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (!password || password.length === 0) {
      throw new Error('Password is required');
    }

    try {
      console.log('🔑 AuthService: Starting login process...');
      const response = await parkingAPI.login(email, password);
      
      console.log('🔑 AuthService: Login API response:', response);
      console.log('🔑 AuthService: Response type:', typeof response);
      console.log('🔑 AuthService: Response keys:', response ? Object.keys(response) : 'null');
      console.log('🔑 AuthService: Full response JSON:', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      // Google Apps Script returns: { success: true, data: { token, expiresAt, user } }
      let responseData = response;
      
      // If response is wrapped in a data property (axios response wrapper)
      // Check if it's an axios response object with a data property
      if (response && typeof response === 'object' && 'data' in response && 'status' in response) {
        // This looks like an axios response object, extract the actual data
        responseData = response.data;
        console.log('🔑 AuthService: Extracted data from axios response:', responseData);
      }
      
      // Log the structure for debugging
      console.log('🔑 AuthService: Response structure:', {
        hasSuccess: !!responseData?.success,
        hasData: !!responseData?.data,
        hasToken: !!responseData?.data?.token,
        responseKeys: responseData ? Object.keys(responseData) : [],
        responseDataType: typeof responseData,
        responseDataValue: responseData,
      });
      
      // Check if response has success flag
      if (responseData && responseData.success === true) {
        // Google Apps Script format: { success: true, data: { token, expiresAt, user } }
        const token = responseData.data?.token;
        const refreshToken = responseData.data?.refreshToken;
        const expiresAt = responseData.data?.expiresAt;
        const user = responseData.data?.user || { email };
        
        if (!token) {
          console.error('❌ AuthService: No token in response:', responseData);
          throw new Error('Login successful but no token received from server');
        }
        
        console.log('✅ AuthService: Token received, storing...');
        
        // Store tokens
        tokenStorage.set(token);
        if (refreshToken) {
          refreshTokenStorage.set(refreshToken);
        }
        
        // Store user data (including role, timezone, and password change requirement)
        const userData = user || responseData.data?.user || { email };
        if (userData) {
          userStorage.set(userData);
        }
        
        // Schedule token refresh
        if (expiresAt) {
          this.scheduleTokenRefresh(expiresAt);
        }
        
        console.log('✅ AuthService: Login successful, token stored');
        console.log('User data:', userData);
        console.log('Requires password change:', userData?.requires_password_change);
        
        return {
          success: true,
          user: userData,
          requiresPasswordChange: userData?.requires_password_change === true,
        };
      }
      
      // If response doesn't have expected structure
      console.error('⚠️ AuthService: Unexpected response structure');
      console.error('Full response:', JSON.stringify(response, null, 2));
      console.error('Response type:', typeof response);
      console.error('Response success:', responseData?.success);
      console.error('Response data:', responseData?.data);
      console.error('Response token:', responseData?.token || responseData?.data?.token);
      console.error('Response keys:', responseData ? Object.keys(responseData) : 'null');
      
      // Check if it's actually a successful response but in wrong format
      if (responseData && responseData.data && responseData.data.token) {
        console.warn('⚠️ Token found but success flag missing - attempting to use response anyway');
        const token = responseData.data.token;
        const expiresAt = responseData.data.expiresAt;
        const user = responseData.data.user || { email };
        
        tokenStorage.set(token);
        if (expiresAt) {
          this.scheduleTokenRefresh(expiresAt);
        }
        if (user) {
          userStorage.set(user);
        }
        
        return {
          success: true,
          user: user || { email },
        };
      }
      
      // Try to extract error message
      const errorMessage = responseData?.error?.message || 
                          responseData?.message || 
                          response?.message || 
                          'Login failed - invalid response from server';
      
      throw new Error(errorMessage);
    } catch (error) {
      console.error('❌ AuthService: Login error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await parkingAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthStorage();
      this.clearTokenRefresh();
    }
  }

  /**
   * Check if user is authenticated (only checks if token exists in storage)
   * Use validateToken() to actually verify with backend
   */
  isAuthenticated() {
    const token = tokenStorage.get();
    return !!token;
  }

  /**
   * Validate token with backend
   * Returns true if token is valid, false otherwise
   */
  async validateToken() {
    const token = tokenStorage.get();
    if (!token) {
      return false;
    }

    try {
      // Use a lightweight authenticated endpoint to validate the token
      // getDashboardStats is a good choice as it's fast and requires auth
      const response = await parkingAPI.getDashboardStats();
      
      // Handle different response structures from Google Apps Script
      let responseData = response;
      if (response && typeof response === 'object' && 'data' in response && 'status' in response) {
        responseData = response.data;
      }
      
      // Check if response indicates success
      // Google Apps Script typically returns { success: true, data: {...} }
      if (responseData && (responseData.success === true || responseData.data)) {
        // Token is valid
        return true;
      }
      
      // If response doesn't indicate success, token might be invalid
      return false;
    } catch (error) {
      // If we get 401 or token validation fails, token is invalid
      if (error.response?.status === 401 || 
          error.code === 'TOKEN_REFRESH_FAILED' ||
          error.code === 'UNAUTHORIZED') {
        console.log('Token validation failed - token is invalid or expired');
        return false;
      }
      
      // Check error message for unauthorized
      if (error.message && (
          error.message.includes('unauthorized') || 
          error.message.includes('Unauthorized') ||
          error.message.includes('not authorized'))) {
        console.log('Token validation failed - unauthorized');
        return false;
      }
      
      // For other errors (network, etc.), we'll be conservative and return false
      // This ensures invalid tokens don't allow access
      console.warn('Token validation error:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return userStorage.get();
  }

  /**
   * Get auth token
   */
  getToken() {
    return tokenStorage.get();
  }

  /**
   * Schedule token refresh before expiry
   */
  scheduleTokenRefresh(expiresAt) {
    this.clearTokenRefresh();
    
    if (!expiresAt) return;
    
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const refreshTime = expiryTime - now - SECURITY.TOKEN_REFRESH_THRESHOLD;
    
    if (refreshTime > 0) {
      this.tokenRefreshTimeout = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    }
  }

  /**
   * Clear token refresh timeout
   */
  clearTokenRefresh() {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    try {
      const refreshToken = refreshTokenStorage.get();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await adminAPI.refreshToken(refreshToken);
      
      if (response.success && response.data) {
        const { token, refreshToken: newRefreshToken, expiresAt } = response.data;
        
        tokenStorage.set(token);
        if (newRefreshToken) {
          refreshTokenStorage.set(newRefreshToken);
        }
        
        this.scheduleTokenRefresh(expiresAt);
        
        return true;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      // Refresh failed - clear auth and redirect to login
      clearAuthStorage();
      this.clearTokenRefresh();
      
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
      
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;


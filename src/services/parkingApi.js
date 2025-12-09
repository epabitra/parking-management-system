/**
 * Parking Management API Service
 * Centralized API client for parking management system
 */

import axios from 'axios';
import { API_CONFIG, API_ACTIONS, ERROR_MESSAGES } from '@/config/constants';
import { tokenStorage } from '@/utils/storage';
import { ENV } from '@/config/env';

// Create axios instance
const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    
    if (ENV.ENABLE_DEBUG || ENV.IS_DEVELOPMENT) {
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        params: config.params,
        data: config.data,
        hasToken: !!token,
      });
    }
    
    return config;
  },
  (error) => {
    if (ENV.ENABLE_DEBUG || ENV.IS_DEVELOPMENT) {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    let responseData = response.data;
    
    if (typeof responseData === 'object' && responseData !== null) {
      return responseData;
    }
    
    if (typeof responseData === 'string') {
      responseData = responseData.trim();
      
      if (responseData === '') {
        return {};
      }
      
      try {
        return JSON.parse(responseData);
      } catch (e) {
        if (responseData.includes('<!doctype html>') || responseData.includes('<html>')) {
          throw new Error('API returned HTML instead of JSON. Please check VITE_API_BASE_URL in .env file.');
        }
        return {
          success: false,
          error: {
            message: 'Invalid response format',
            raw: responseData.substring(0, 200),
          },
        };
      }
    }
    
    return responseData;
  },
  async (error) => {
    if (ENV.ENABLE_DEBUG || ENV.IS_DEVELOPMENT) {
      console.error('API Error:', error);
    }
    
    if (!ENV.API_BASE_URL || ENV.API_BASE_URL === '') {
      return Promise.reject({
        message: 'API endpoint not configured.',
        code: 'API_NOT_CONFIGURED',
      });
    }
    
    if (!error.response && error.request) {
      if (error.code === 'ERR_NETWORK' || 
          error.message.includes('CORS') || 
          error.message.includes('Access-Control')) {
        return Promise.reject({
          message: 'CORS Error: Please check Google Apps Script deployment settings.',
          code: 'CORS_ERROR',
        });
      }
    }
    
    const errorMessage = error.response?.data?.error?.message || 
                        error.message || 
                        ERROR_MESSAGES.GENERIC;
    
    return Promise.reject({
      message: errorMessage,
      code: error.response?.status || 'UNKNOWN_ERROR',
      data: error.response?.data,
    });
  }
);

/**
 * Parking Management API Methods
 */
export const parkingAPI = {
  /**
   * Login
   */
  login: async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.LOGIN);
      params.append('email', email);
      params.append('password', password);

      const response = await apiClient.post('', params.toString(), {
        params: {},
        timeout: 60000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        },
      });
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Logout
   */
  logout: async () => {
    try {
      const token = tokenStorage.get();
      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.LOGOUT);
      params.append('token', token || '');
      
      await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenStorage.remove();
    }
  },

  /**
   * Generate unique token number
   */
  generateTokenNumber: async () => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const params = new URLSearchParams();
      params.append('action', 'generateTokenNumber');
      params.append('token', token);
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Generate token number error:', error);
      throw error;
    }
  },

  /**
   * Register Vehicle (supports bulk registration)
   */
  registerVehicle: async (vehicleData) => {
    try {
      const token = tokenStorage.get();
      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.REGISTER_VEHICLE);
      if (token) params.append('token', token);
      
      Object.keys(vehicleData).forEach(key => {
        const value = vehicleData[key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            // For arrays (like vehicle_numbers, vehicle_image_urls), send as JSON
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      });
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Register vehicle error:', error);
      throw error;
    }
  },

  /**
   * Discharge Vehicle (supports bulk discharge)
   * @param {string|string[]} vehicleIds - Vehicle ID(s) to discharge
   * @param {object} options - Additional options (verification_method, discharge_image_url)
   */
  dischargeVehicle: async (vehicleIds, options = {}) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.DISCHARGE_VEHICLE);
      params.append('token', token);
      
      // Support both single ID and array of IDs
      if (Array.isArray(vehicleIds)) {
        params.append('id', JSON.stringify(vehicleIds));
      } else {
        params.append('id', vehicleIds);
      }

      // Add optional discharge data
      if (options.verification_method) {
        params.append('verification_method', options.verification_method);
      }
      if (options.discharge_image_url) {
        params.append('discharge_image_url', options.discharge_image_url);
      }
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Discharge vehicle error:', error);
      throw error;
    }
  },

  /**
   * Update Vehicle
   */
  updateVehicle: async (id, vehicleData) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.UPDATE_VEHICLE);
      params.append('token', token);
      params.append('id', id);
      
      Object.keys(vehicleData).forEach(key => {
        const value = vehicleData[key];
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Update vehicle error:', error);
      throw error;
    }
  },

  /**
   * List Vehicles
   */
  listVehicles: async (params = {}) => {
    try {
      const token = tokenStorage.get();
      return apiClient.get('', {
        params: {
          action: API_ACTIONS.LIST_VEHICLES,
          token: token || '',
          ...params,
        },
      });
    } catch (error) {
      console.error('List vehicles error:', error);
      throw error;
    }
  },

  /**
   * Get Customer History by Mobile Number
   */
  getCustomerHistory: async (mobileNumber) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }
      return apiClient.get('', {
        params: {
          action: API_ACTIONS.GET_CUSTOMER_HISTORY,
          token: token,
          mobile_number: mobileNumber,
        },
      });
    } catch (error) {
      console.error('Get customer history error:', error);
      throw error;
    }
  },

  /**
   * Get Vehicle
   */
  getVehicle: async (id) => {
    try {
      return apiClient.get('', {
        params: {
          action: API_ACTIONS.GET_VEHICLE,
          id,
        },
      });
    } catch (error) {
      console.error('Get vehicle error:', error);
      throw error;
    }
  },

  /**
   * Send OTP
   */
  sendOTP: async (mobileNumber, purpose, vehicleId = null) => {
    try {
      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.SEND_OTP);
      params.append('mobile_number', mobileNumber);
      params.append('purpose', purpose);
      if (vehicleId) params.append('vehicle_id', vehicleId);
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  },

  /**
   * Verify OTP
   */
  verifyOTP: async (mobileNumber, otpCode, purpose) => {
    try {
      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.VERIFY_OTP);
      params.append('mobile_number', mobileNumber);
      params.append('otp_code', otpCode);
      params.append('purpose', purpose);
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  },

  /**
   * Get Dashboard Statistics
   */
  getDashboardStats: async (params = {}) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      return apiClient.get('', {
        params: {
          action: API_ACTIONS.GET_DASHBOARD_STATS,
          token,
          ...params,
        },
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  },

  /**
   * Create Employee
   */
  createEmployee: async (employeeData) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.CREATE_EMPLOYEE);
      params.append('token', token);
      
      Object.keys(employeeData).forEach(key => {
        const value = employeeData[key];
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Create employee error:', error);
      throw error;
    }
  },

  /**
   * Add Employee (alias for createEmployee)
   */
  addEmployee: async (employeeData) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.CREATE_EMPLOYEE);
      params.append('token', token);
      
      Object.keys(employeeData).forEach(key => {
        const value = employeeData[key];
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Add employee error:', error);
      throw error;
    }
  },

  /**
   * Update Employee
   */
  updateEmployee: async (id, employeeData) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.UPDATE_EMPLOYEE);
      params.append('token', token);
      params.append('id', id);
      
      Object.keys(employeeData).forEach(key => {
        const value = employeeData[key];
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Update employee error:', error);
      throw error;
    }
  },

  /**
   * Delete Employee
   */
  deleteEmployee: async (id) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.DELETE_EMPLOYEE);
      params.append('token', token);
      params.append('id', id);
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Delete employee error:', error);
      throw error;
    }
  },

  /**
   * Remove Employee (alias for deleteEmployee)
   */
  removeEmployee: async (id) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.DELETE_EMPLOYEE);
      params.append('token', token);
      params.append('id', id);
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Remove employee error:', error);
      throw error;
    }
  },

  /**
   * List Employees
   */
  listEmployees: async () => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Use fetch with mode: 'no-cors' workaround for Google Apps Script CORS issues
      // Or use the standard axios call - Google Apps Script should handle CORS when deployed correctly
      return apiClient.get('', {
        params: {
          action: API_ACTIONS.LIST_EMPLOYEES,
          token,
        },
        // Add these to help with CORS
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
    } catch (error) {
      console.error('List employees error:', error);
      // Provide helpful error message for CORS issues
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS') || error.message?.includes('Access-Control')) {
        throw new Error('CORS Error: Please verify Google Apps Script deployment settings:\n1. Deploy as Web App\n2. Set "Who has access" to "Anyone"\n3. Redeploy after making changes\n4. Check the Web App URL is correct');
      }
      throw error;
    }
  },

  /**
   * Get Employee
   */
  getEmployee: async (id) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      return apiClient.get('', {
        params: {
          action: API_ACTIONS.GET_EMPLOYEE,
          token,
          id,
        },
      });
    } catch (error) {
      console.error('Get employee error:', error);
      throw error;
    }
  },

  /**
   * Upload Media (Vehicle Image) - Now uses Firebase by default
   * This method is kept for backward compatibility but Firebase should be used directly
   */
  uploadMedia: async (file, onProgress) => {
    try {
      // Note: This method now expects Firebase URL to be passed
      // For actual uploads, use firebaseStorageService.uploadImage() directly
      const token = tokenStorage.get();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async () => {
          try {
            const base64String = reader.result.split(',')[1];
            const fileName = file.name;
            const fileType = file.type;
            
            if (onProgress) {
              onProgress(30);
            }
            
            const params = new URLSearchParams();
            params.append('action', API_ACTIONS.UPLOAD_MEDIA);
            if (token) params.append('token', token);
            params.append('file', base64String);
            params.append('fileName', fileName);
            params.append('fileType', fileType);
            
            if (onProgress) {
              onProgress(50);
            }
            
            const response = await apiClient.post('', params.toString(), {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              timeout: 120000,
            });
            
            if (onProgress) {
              onProgress(100);
            }
            
            resolve(response);
          } catch (error) {
            console.error('Upload media error:', error);
            reject(error);
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Upload media error:', error);
      throw error;
    }
  },

  /**
   * Export Data (with timezone support)
   */
  exportData: async (fromDate, toDate) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.EXPORT_DATA);
      params.append('token', token);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Export data error:', error);
      throw error;
    }
  },

  /**
   * Change Password
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.CHANGE_PASSWORD);
      params.append('token', token);
      params.append('current_password', currentPassword);
      params.append('new_password', newPassword);
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  /**
   * Register Company (Public - no auth required)
   * Creates company and admin employee automatically
   */
  registerCompany: async (companyData) => {
    try {
      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.REGISTER_COMPANY);
      
      Object.keys(companyData).forEach(key => {
        const value = companyData[key];
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Register company error:', error);
      throw error;
    }
  },

  /**
   * Create Company (Super Admin only)
   */
  createCompany: async (companyData) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.CREATE_COMPANY);
      params.append('token', token);
      
      Object.keys(companyData).forEach(key => {
        const value = companyData[key];
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Create company error:', error);
      throw error;
    }
  },

  /**
   * List Companies (Super Admin only)
   */
  listCompanies: async () => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      return apiClient.get('', {
        params: {
          action: API_ACTIONS.LIST_COMPANIES,
          token,
        },
      });
    } catch (error) {
      console.error('List companies error:', error);
      throw error;
    }
  },

  /**
   * Get Company (Super Admin only)
   */
  getCompany: async (id) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      return apiClient.get('', {
        params: {
          action: API_ACTIONS.GET_COMPANY,
          token,
          id,
        },
      });
    } catch (error) {
      console.error('Get company error:', error);
      throw error;
    }
  },

  /**
   * Update Company (Super Admin only)
   */
  updateCompany: async (id, companyData) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.UPDATE_COMPANY);
      params.append('token', token);
      params.append('id', id);
      
      Object.keys(companyData).forEach(key => {
        const value = companyData[key];
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Update company error:', error);
      throw error;
    }
  },

  /**
   * Delete Company (Super Admin only)
   */
  deleteCompany: async (id) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('action', API_ACTIONS.DELETE_COMPANY);
      params.append('token', token);
      params.append('id', id);
      
      const response = await apiClient.post('', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response;
    } catch (error) {
      console.error('Delete company error:', error);
      throw error;
    }
  },
};

export default parkingAPI;


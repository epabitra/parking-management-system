/**
 * Application Constants
 * Centralized configuration for the parking management application
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.REACT_APP_API_BASE_URL || '',
  TIMEOUT: 60000, // 60 seconds (Google Apps Script can be slow)
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: import.meta.env.REACT_APP_TOKEN_STORAGE_KEY || 'auth_token',
  REFRESH_TOKEN: import.meta.env.REACT_APP_REFRESH_TOKEN_KEY || 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
};

export const ROUTES = {
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_REGISTER: '/admin/register',
  ADMIN_VEHICLES: '/admin/vehicles',
  ADMIN_VEHICLE_EDIT: '/admin/vehicles/:id/edit',
  ADMIN_DELIVERY: '/admin/delivery',
  ADMIN_EMPLOYEES: '/admin/employees',
  ADMIN_CHANGE_PASSWORD: '/admin/change-password',
};

export const API_ACTIONS = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Vehicles
  REGISTER_VEHICLE: 'registerVehicle',
  DISCHARGE_VEHICLE: 'dischargeVehicle',
  UPDATE_VEHICLE: 'updateVehicle',
  LIST_VEHICLES: 'listVehicles',
  GET_VEHICLE: 'getVehicle',
  
  // OTP
  SEND_OTP: 'sendOTP',
  VERIFY_OTP: 'verifyOTP',
  
  // Employees
  CREATE_EMPLOYEE: 'createEmployee',
  UPDATE_EMPLOYEE: 'updateEmployee',
  DELETE_EMPLOYEE: 'deleteEmployee',
  LIST_EMPLOYEES: 'listEmployees',
  GET_EMPLOYEE: 'getEmployee',
  CHANGE_PASSWORD: 'changePassword',
  
  // Dashboard
  GET_DASHBOARD_STATS: 'getDashboardStats',
  
  // Media
  UPLOAD_MEDIA: 'uploadMedia',
  
  // Export
  EXPORT_DATA: 'exportData',
};

export const VEHICLE_STATUS = {
  PARKED: 'parked',
  DISCHARGED: 'discharged',
};

export const OTP_PURPOSE = {
  REGISTER: 'register',
  DISCHARGE: 'discharge',
};

export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

export const VALIDATION = {
  VEHICLE_NUMBER_MIN_LENGTH: 1,
  VEHICLE_NUMBER_MAX_LENGTH: 20,
  MOBILE_NUMBER_LENGTH: 10,
  NAME_MAX_LENGTH: 100,
  ADDRESS_MAX_LENGTH: 200,
  OTP_LENGTH: 6,
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
};

export const SECURITY = {
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh token 5 minutes before expiry
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes
  OTP_EXPIRY_MINUTES: 10,
};

export const DATE_FORMATS = {
  DISPLAY: 'MMMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMMM dd, yyyy, h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  DATE_ONLY: 'yyyy-MM-dd',
  TIME_ONLY: 'h:mm a',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UPLOAD_ERROR: 'File upload failed. Please try again.',
  GENERIC: 'Something went wrong. Please try again.',
  INVALID_OTP: 'Invalid or expired OTP. Please try again.',
  MISSING_VEHICLE_NUMBER: 'Vehicle number is required.',
  MISSING_MOBILE_NUMBER: 'Mobile number is required.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  VEHICLE_REGISTERED: 'Vehicle registered successfully',
  VEHICLE_DISCHARGED: 'Vehicle discharged successfully',
  VEHICLE_UPDATED: 'Vehicle updated successfully',
  OTP_SENT: 'OTP sent successfully',
  OTP_VERIFIED: 'OTP verified successfully',
  EMPLOYEE_CREATED: 'Employee created successfully',
  EMPLOYEE_UPDATED: 'Employee updated successfully',
  EMPLOYEE_DELETED: 'Employee deleted successfully',
  MEDIA_UPLOADED: 'Image uploaded successfully',
  DATA_EXPORTED: 'Data exported successfully',
};

export const EMPLOYEE_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
};

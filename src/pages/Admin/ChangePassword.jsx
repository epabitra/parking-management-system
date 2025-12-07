/**
 * Change Password Page
 * Allows users to change their own password
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { parkingAPI } from '@/services/parkingApi';
import { ROUTES } from '@/config/constants';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const newPassword = watch('new_password');

  const onSubmit = async (data) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      const response = await parkingAPI.changePassword(data.current_password, data.new_password);
      
      if (response.success) {
        toast.success('Password changed successfully. Please login again.');
        // Logout and redirect to login
        setTimeout(() => {
          navigate(ROUTES.ADMIN_LOGIN);
        }, 2000);
      } else {
        toast.error(response.error?.message || 'Failed to change password');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Change Password - Parking Management</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-2xl mx-auto animate-fade-in">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
                <p className="text-gray-600 mt-1">Update your account password</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  {...register('current_password', {
                    required: 'Current password is required',
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
                {errors.current_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.current_password.message}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  {...register('new_password', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  placeholder="Enter new password (min 6 characters)"
                  autoComplete="new-password"
                />
                {errors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  {...register('confirm_password', {
                    required: 'Please confirm your new password',
                    validate: (value) =>
                      value === newPassword || 'Passwords do not match',
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Changing Password...
                    </span>
                  ) : (
                    'Change Password'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
                  className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold text-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangePassword;


/**
 * Public Company Registration Page
 * Companies can self-register and create their admin account
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { parkingAPI } from '@/services/parkingApi';
import { ROUTES } from '@/config/constants';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import { getCommonTimezones } from '@/utils/timezone';

const RegisterCompany = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      const companyData = {
        name: data.company_name,
        address: data.address || '',
        contact_info: data.contact_info || '',
        admin_name: data.admin_name,
        admin_email: data.admin_email,
        admin_password: data.admin_password,
        admin_mobile_number: data.admin_mobile_number || '',
        admin_timezone: data.admin_timezone || 'UTC',
      };
      
      const response = await parkingAPI.registerCompany(companyData);
      
      if (response.success) {
        toast.success('Company registered successfully! You can now login with your admin credentials.');
        navigate(ROUTES.ADMIN_LOGIN);
      } else {
        toast.error(response.error?.message || 'Failed to register company');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to register company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register Your Company - Parking Management</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-3xl animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Register Your Company</h1>
              <p className="text-blue-100 text-sm">Create your company account and admin user</p>
            </div>

            {/* Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Company Information */}
                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Company Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('company_name', { required: 'Company name is required' })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                        placeholder="Enter your company name"
                      />
                      {errors.company_name && (
                        <p className="mt-2 text-sm text-red-600">{errors.company_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        {...register('address')}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                        placeholder="Enter company address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Info
                      </label>
                      <input
                        type="text"
                        {...register('contact_info')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                        placeholder="Phone number or contact details"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Account */}
                <div className="bg-purple-50 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Admin Account
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Admin Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('admin_name', { required: 'Admin name is required' })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                        placeholder="Enter admin name"
                      />
                      {errors.admin_name && (
                        <p className="mt-2 text-sm text-red-600">{errors.admin_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Admin Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        {...register('admin_email', { 
                          required: 'Admin email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                        placeholder="admin@company.com"
                      />
                      {errors.admin_email && (
                        <p className="mt-2 text-sm text-red-600">{errors.admin_email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Admin Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        {...register('admin_password', { 
                          required: 'Admin password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                          }
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                        placeholder="Enter password"
                      />
                      {errors.admin_password && (
                        <p className="mt-2 text-sm text-red-600">{errors.admin_password.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Admin Mobile Number
                      </label>
                      <input
                        type="tel"
                        {...register('admin_mobile_number')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                        placeholder="Enter mobile number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Timezone <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('admin_timezone', { required: 'Timezone is required' })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                      >
                        {getCommonTimezones().map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                      {errors.admin_timezone && (
                        <p className="mt-2 text-sm text-red-600">{errors.admin_timezone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </span>
                    ) : (
                      'Register Company'
                    )}
                  </button>
                  <Link
                    to={ROUTES.ADMIN_LOGIN}
                    className="flex-1 px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-semibold text-center"
                  >
                    Already have an account? Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterCompany;


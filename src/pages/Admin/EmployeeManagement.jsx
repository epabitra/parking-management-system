/**
 * Employee Management Page
 * Modern UI for managing employees
 */

import { useState, useEffect } from 'react';
import { parkingAPI } from '@/services/parkingApi';
import { EMPLOYEE_ROLES, SUCCESS_MESSAGES } from '@/config/constants';
import { getCommonTimezones } from '@/utils/timezone';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import Loading from '@/components/Loading';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

const EmployeeManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const isAdmin = user?.role === EMPLOYEE_ROLES.ADMIN;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (isAdmin) {
      loadEmployees();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await parkingAPI.listEmployees();
      if (response.success) {
        setEmployees(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!isAdmin) {
      toast.error('Only admin can create or update employees');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare employee data
      const employeeData = {
        name: data.name,
        email: data.email,
        mobile_number: data.mobile_number || '',
        role: data.role || 'employee',
        timezone: data.timezone || 'UTC',
        is_active: data.is_active !== undefined ? data.is_active : true,
      };
      
      // Add company_id - super admin can specify, regular admin uses their own company
      if (user?.is_super_admin && data.company_id) {
        employeeData.company_id = data.company_id;
      } else if (user?.company_id) {
        employeeData.company_id = user.company_id;
      }
      
      // Only include password if provided (for new employees, default is Test@123; for updates, it's optional)
      if (data.password && data.password.trim() !== '') {
        employeeData.password = data.password;
      } else if (!editingEmployee) {
        // Use default password for new employees
        employeeData.password = 'Test@123';
      }
      
      let response;

      if (editingEmployee) {
        employeeData.id = editingEmployee.id;
        response = await parkingAPI.updateEmployee(editingEmployee.id, employeeData);
        toast.success(SUCCESS_MESSAGES.EMPLOYEE_UPDATED);
      } else {
        response = await parkingAPI.addEmployee(employeeData);
        toast.success(SUCCESS_MESSAGES.EMPLOYEE_ADDED);
      }

      if (response.success) {
        reset();
        setShowForm(false);
        setEditingEmployee(null);
        loadEmployees();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    // Ensure is_active is properly set (convert to boolean if needed)
    const employeeData = {
      ...employee,
      is_active: employee.is_active !== undefined 
        ? (employee.is_active === true || employee.is_active === 'true' || employee.is_active === 1)
        : true,
    };
    reset(employeeData);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('Only admin can delete employees');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      const response = await parkingAPI.removeEmployee(id);
      if (response.success) {
        toast.success(SUCCESS_MESSAGES.EMPLOYEE_REMOVED);
        loadEmployees();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete employee');
    }
  };

  const handleCancel = () => {
    reset();
    setShowForm(false);
    setEditingEmployee(null);
  };

  if (loading) {
    return <Loading />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 font-semibold text-lg">Access Denied</p>
          <p className="text-gray-600 mt-2">Only administrators can manage employees</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Employee Management - Parking Management</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">👥</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
                  <p className="text-gray-600 mt-1">Manage your team members</p>
                  {user?.company && (
                    <p className="text-blue-600 text-sm mt-1 font-semibold">
                      🏢 Company: {user.company.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingEmployee(null);
                  reset({
                    is_active: true, // Default to active for new employees
                  });
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Employee
              </button>
            </div>
          </div>

          {/* Employee Form */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">📝</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h2>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Name is required' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                      placeholder="Enter employee name"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                      placeholder="employee@example.com"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Password {!editingEmployee && <span className="text-red-500">*</span>}
                      {editingEmployee && <span className="text-gray-400 text-xs font-normal">(Leave empty to keep current password)</span>}
                    </label>
                    <input
                      type="password"
                      {...register('password', { 
                        required: !editingEmployee ? 'Password is required' : false,
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      defaultValue={!editingEmployee ? 'Test@123' : ''}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                      placeholder={editingEmployee ? "Enter new password (optional)" : "Enter password (default: Test@123)"}
                    />
                    {!editingEmployee && (
                      <p className="mt-1 text-xs text-gray-500">Default password: <span className="font-mono font-semibold">Test@123</span> (employee must change on first login)</p>
                    )}
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mobile Number <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      {...register('mobile_number')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                    <select
                      {...register('role')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                    >
                      <option value={EMPLOYEE_ROLES.EMPLOYEE}>Employee</option>
                      <option value={EMPLOYEE_ROLES.ADMIN}>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Timezone <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('timezone', { required: 'Timezone is required' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                    >
                      {getCommonTimezones().map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                    {errors.timezone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.timezone.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center pt-8">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          {...register('is_active')}
                          checked={watch('is_active') !== undefined ? watch('is_active') : true}
                          onChange={(e) => setValue('is_active', e.target.checked, { shouldValidate: true })}
                          className="sr-only"
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ${
                          watch('is_active') !== undefined && watch('is_active') ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                          watch('is_active') !== undefined && watch('is_active') ? 'translate-x-6' : 'translate-x-0'
                        }`}></div>
                      </div>
                      <span className="ml-4 text-sm font-semibold text-gray-700">Active Status</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-gray-100">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      editingEmployee ? 'Update Employee' : 'Create Employee'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Employee List Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">All Employees</h2>
                <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-xl font-semibold">
                  {employees.length} Total
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Timezone</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <p className="text-gray-500 text-lg font-semibold">No employees found</p>
                          <p className="text-gray-400 text-sm mt-2">Click "Add Employee" to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee, index) => (
                      <tr 
                        key={employee.id} 
                        className="hover:bg-purple-50/50 transition-colors duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-3 shadow-md">
                              <span className="text-white font-bold text-sm">{employee.name?.charAt(0).toUpperCase() || 'E'}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{employee.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{employee.email || <span className="text-gray-400">N/A</span>}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{employee.mobile_number || <span className="text-gray-400">N/A</span>}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            employee.role === EMPLOYEE_ROLES.ADMIN
                              ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                              : 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          }`}>
                            {employee.role === EMPLOYEE_ROLES.ADMIN ? '👑 Admin' : '👤 Employee'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            employee.is_active
                              ? 'bg-green-100 text-green-800 border-2 border-green-300'
                              : 'bg-red-100 text-red-800 border-2 border-red-300'
                          }`}>
                            {employee.is_active ? '✓ Active' : '✗ Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700 font-medium">{employee.timezone || 'UTC'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {employee.created_at
                              ? format(new Date(employee.created_at), 'MMM dd, yyyy')
                              : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(employee)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(employee.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeManagement;

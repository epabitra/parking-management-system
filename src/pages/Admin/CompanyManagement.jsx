/**
 * Company Management Page
 * Super Admin only - Manage companies
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { parkingAPI } from '@/services/parkingApi';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/components/Loading';

const CompanyManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_info: '',
    admin_email: '',
    is_active: true,
  });

  useEffect(() => {
    // Check if user is super admin
    if (user && !user.is_super_admin) {
      toast.error('Only super admin can access company management');
      return;
    }
    loadCompanies();
  }, [user]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await parkingAPI.listCompanies();
      if (response.success) {
        setCompanies(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        const response = await parkingAPI.updateCompany(editingCompany.id, formData);
        if (response.success) {
          toast.success('Company updated successfully');
          setShowModal(false);
          resetForm();
          loadCompanies();
        }
      } else {
        const response = await parkingAPI.createCompany(formData);
        if (response.success) {
          toast.success('Company created successfully');
          setShowModal(false);
          resetForm();
          loadCompanies();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save company');
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || '',
      address: company.address || '',
      contact_info: company.contact_info || '',
      admin_email: company.admin_email || '',
      is_active: company.is_active !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (company) => {
    if (!window.confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await parkingAPI.deleteCompany(company.id);
      if (response.success) {
        toast.success('Company deleted successfully');
        loadCompanies();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete company');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      contact_info: '',
      admin_email: '',
      is_active: true,
    });
    setEditingCompany(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  if (!user || !user.is_super_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only super admin can access company management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>Company Management - Parking Management</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
                  <p className="text-gray-600 mt-1">Manage all companies and their settings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">{companies.length}</p>
                <p className="text-sm text-gray-600">Total Companies</p>
              </div>
            </div>
          </div>

          {/* Add Company Button */}
          <div className="flex justify-end">
            <button
              onClick={handleAddNew}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add New Company</span>
            </button>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-200 animate-fade-in"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{company.name || 'Unnamed Company'}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        company.is_active !== false
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {company.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {company.address && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{company.address}</span>
                    </div>
                  )}
                  {company.contact_info && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="truncate">{company.contact_info}</span>
                    </div>
                  )}
                  {company.admin_email && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <span className="truncate">{company.admin_email}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(company)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(company)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {companies.length === 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Companies Yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first company.</p>
              <button
                onClick={handleAddNew}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
              >
                Add First Company
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingCompany ? 'Edit Company' : 'Add New Company'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                  placeholder="Enter company address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Info</label>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                  placeholder="Phone number or contact details"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email</label>
                <input
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                  placeholder="Admin email for this company"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
                >
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyManagement;


/**
 * Vehicle List Page
 * Modern, beautiful table with filters and search
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parkingAPI } from '@/services/parkingApi';
import { VEHICLE_STATUS, SUCCESS_MESSAGES, ROUTES } from '@/config/constants';
import { formatInTimezone, getUserTimezone } from '@/utils/timezone';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import Loading from '@/components/Loading';
import { differenceInHours, differenceInDays } from 'date-fns';

const VehicleList = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    vehicle_number: '',
    mobile_number: '',
    from_date: '',
    to_date: '',
  });
  // Local state for input fields (not applied until filter button is clicked or Enter/blur)
  const [inputFilters, setInputFilters] = useState({
    vehicle_number: '',
    mobile_number: '',
  });
  const [sortBy, setSortBy] = useState('newest');
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '', title: '' });
  const userTimezone = getUserTimezone(user);

  // Auto-filter only for status, dates, and sort (not for text inputs)
  useEffect(() => {
    loadVehicles();
  }, [filters.status, filters.from_date, filters.to_date, sortBy]);

  const applyFilters = () => {
    // Apply input filters to actual filters
    const newFilters = {
      ...filters,
      vehicle_number: inputFilters.vehicle_number,
      mobile_number: inputFilters.mobile_number,
    };
    setFilters(newFilters);
    // Trigger load immediately with new filters
    loadVehiclesWithFilters(newFilters);
  };

  const loadVehicles = async () => {
    await loadVehiclesWithFilters(filters);
  };

  const loadVehiclesWithFilters = async (filterParams = filters) => {
    try {
      setLoading(true);
      const params = { ...filterParams, timezone: userTimezone };
      if (!params.status) delete params.status;
      if (!params.vehicle_number) delete params.vehicle_number;
      if (!params.mobile_number) delete params.mobile_number;
      if (!params.from_date) delete params.from_date;
      if (!params.to_date) delete params.to_date;
      if (!params.timezone) delete params.timezone;

      const response = await parkingAPI.listVehicles(params);
      if (response.success) {
        let data = response.data || [];
        
        if (sortBy === 'newest') {
          data.sort((a, b) => new Date(b.registered_at || b.created_at) - new Date(a.registered_at || a.created_at));
        } else if (sortBy === 'oldest') {
          data.sort((a, b) => new Date(a.registered_at || a.created_at) - new Date(b.registered_at || b.created_at));
        } else if (sortBy === 'longest_parked') {
          data = data.filter(v => v.status === VEHICLE_STATUS.PARKED);
          data.sort((a, b) => {
            const aDate = new Date(a.registered_at || a.created_at);
            const bDate = new Date(b.registered_at || b.created_at);
            return aDate - bDate;
          });
        }
        
        setVehicles(data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const getDuration = (registeredAt) => {
    if (!registeredAt) return 'N/A';
    const regDate = new Date(registeredAt);
    const now = new Date();
    const days = differenceInDays(now, regDate);
    const hours = differenceInHours(now, regDate) % 24;
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  const openImageModal = (imageUrl, title) => {
    if (imageUrl) {
      setImageModal({ isOpen: true, imageUrl, title });
    }
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: '', title: '' });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>Vehicle List - Parking Management</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">📋</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Vehicle List</h1>
                  <p className="text-gray-600 mt-1">View and manage all registered vehicles</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{vehicles.length}</p>
                <p className="text-sm text-gray-600">Total Vehicles</p>
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center mb-6">
              <svg className="w-6 h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-800">Filters & Search</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                >
                  <option value="">All Status</option>
                  <option value={VEHICLE_STATUS.PARKED}>Parked</option>
                  <option value={VEHICLE_STATUS.DISCHARGED}>Discharged</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={inputFilters.vehicle_number}
                    onChange={(e) => setInputFilters({ ...inputFilters, vehicle_number: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyFilters();
                      }
                    }}
                    onBlur={() => {
                      // Apply filter when user leaves the field
                      if (inputFilters.vehicle_number !== filters.vehicle_number) {
                        applyFilters();
                      }
                    }}
                    placeholder="Search vehicle number (partial match)"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={inputFilters.mobile_number}
                    onChange={(e) => setInputFilters({ ...inputFilters, mobile_number: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyFilters();
                      }
                    }}
                    onBlur={() => {
                      // Apply filter when user leaves the field
                      if (inputFilters.mobile_number !== filters.mobile_number) {
                        applyFilters();
                      }
                    }}
                    placeholder="Search mobile number (partial match)"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="longest_parked">Longest Parked</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={applyFilters}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setFilters({ status: '', vehicle_number: '', mobile_number: '', from_date: '', to_date: '' });
                  setInputFilters({ vehicle_number: '', mobile_number: '' });
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Vehicle Table Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vehicle #</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Registered Image</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Discharge Image</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-gray-500 text-lg font-semibold">No vehicles found</p>
                          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((vehicle, index) => (
                      <tr 
                        key={vehicle.id} 
                        className="hover:bg-blue-50/50 transition-colors duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                              <span className="text-white font-bold text-sm">🚗</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{vehicle.vehicle_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700 font-medium">{vehicle.mobile_number}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{vehicle.name || <span className="text-gray-400">N/A</span>}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            vehicle.status === VEHICLE_STATUS.PARKED
                              ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                              : 'bg-green-100 text-green-800 border-2 border-green-300'
                          }`}>
                            {vehicle.status === VEHICLE_STATUS.PARKED ? '⏳ Parked' : '✅ Discharged'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {vehicle.registered_at
                              ? formatInTimezone(vehicle.registered_at, userTimezone, 'MMM dd, yyyy HH:mm')
                              : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700 font-medium">
                            {vehicle.status === VEHICLE_STATUS.PARKED
                              ? getDuration(vehicle.registered_at || vehicle.created_at)
                              : vehicle.discharged_at
                              ? formatInTimezone(vehicle.discharged_at, userTimezone, 'MMM dd, yyyy HH:mm')
                              : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vehicle.vehicle_image_url ? (
                            <img
                              src={vehicle.vehicle_image_url}
                              alt="Vehicle"
                              className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={() => openImageModal(vehicle.vehicle_image_url, `Vehicle Image - ${vehicle.vehicle_number}`)}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vehicle.status === VEHICLE_STATUS.DISCHARGED && vehicle.discharge_image_url ? (
                            <img
                              src={vehicle.discharge_image_url}
                              alt="Discharge"
                              className="w-16 h-16 object-cover rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={() => openImageModal(vehicle.discharge_image_url, `Discharge Image - ${vehicle.vehicle_number}`)}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                              <span className="text-gray-400 text-xs">
                                {vehicle.status === VEHICLE_STATUS.DISCHARGED ? 'No image' : 'N/A'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={ROUTES.ADMIN_VEHICLE_EDIT.replace(':id', vehicle.id)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
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

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 shadow-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">{imageModal.title}</h3>
              </div>
              <div className="p-4">
                <img
                  src={imageModal.imageUrl}
                  alt={imageModal.title}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeImageModal}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VehicleList;

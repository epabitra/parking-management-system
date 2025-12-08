/**
 * Delivery Request Page
 * Modern UI for discharging vehicles with OTP/image validation
 */

import { useState, useEffect } from 'react';
import { parkingAPI } from '@/services/parkingApi';
import { VEHICLE_STATUS, OTP_PURPOSE, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/config/constants';
import { formatInTimezone, getUserTimezone } from '@/utils/timezone';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import Loading from '@/components/Loading';

const DeliveryRequest = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [filters, setFilters] = useState({
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
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [discharging, setDischarging] = useState(false);
  const [mobileForOTP, setMobileForOTP] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('otp'); // 'otp', 'image', or 'manual'
  const [imageVerified, setImageVerified] = useState(false);
  const [selectedVehicleImages, setSelectedVehicleImages] = useState([]);
  const [dischargeImageUrl, setDischargeImageUrl] = useState(''); // Image of person who took the bike
  const [uploadingDischargeImage, setUploadingDischargeImage] = useState(false);
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '', title: '' });
  const userTimezone = getUserTimezone(user);

  // Auto-filter only for dates (not for text inputs)
  useEffect(() => {
    loadVehicles();
  }, [filters.from_date, filters.to_date]);

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
      const params = {
        status: VEHICLE_STATUS.PARKED,
        ...filterParams,
        timezone: userTimezone,
      };
      if (!params.vehicle_number) delete params.vehicle_number;
      if (!params.mobile_number) delete params.mobile_number;
      if (!params.from_date) delete params.from_date;
      if (!params.to_date) delete params.to_date;
      if (!params.timezone) delete params.timezone;

      const response = await parkingAPI.listVehicles(params);
      if (response.success) {
        setVehicles(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicles((prev) => {
      const newSelection = prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId];
      
      // Update selected vehicle images when selection changes
      if (newSelection.length > 0) {
        const selectedVehiclesData = vehicles.filter(v => newSelection.includes(v.id));
        const images = selectedVehiclesData
          .map(v => v.vehicle_image_url)
          .filter(url => url && url.trim() !== '');
        setSelectedVehicleImages(images);
      } else {
        setSelectedVehicleImages([]);
      }
      
      // Reset verification states when selection changes
      setImageVerified(false);
      setOtpSent(false);
      setOtpCode('');
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedVehicles.length === vehicles.length) {
      setSelectedVehicles([]);
      setSelectedVehicleImages([]);
      setImageVerified(false);
      setOtpSent(false);
      setOtpCode('');
    } else {
      const allIds = vehicles.map((v) => v.id);
      setSelectedVehicles(allIds);
      // Update images for all selected vehicles
      const images = vehicles
        .map(v => v.vehicle_image_url)
        .filter(url => url && url.trim() !== '');
      setSelectedVehicleImages(images);
      // Reset verification states
      setImageVerified(false);
      setOtpSent(false);
      setOtpCode('');
    }
  };

  const handleSendOTP = async () => {
    if (selectedVehicles.length === 0) {
      toast.error('Please select at least one vehicle');
      return;
    }

    const firstVehicle = vehicles.find((v) => v.id === selectedVehicles[0]);
    if (!firstVehicle || !firstVehicle.mobile_number) {
      toast.error('Selected vehicle does not have a mobile number');
      return;
    }

    const mobileNumber = firstVehicle.mobile_number;
    setMobileForOTP(mobileNumber);

    const allSameMobile = selectedVehicles.every((id) => {
      const vehicle = vehicles.find((v) => v.id === id);
      return vehicle && vehicle.mobile_number === mobileNumber;
    });

    if (!allSameMobile) {
      toast.error('All selected vehicles must have the same mobile number for bulk discharge');
      return;
    }

    try {
      setOtpSent(false);
      const response = await parkingAPI.sendOTP(mobileNumber, OTP_PURPOSE.DISCHARGE);
      if (response.success) {
        setOtpSent(true);
        setOtpCode(response.data.otpCode);
        toast.success(SUCCESS_MESSAGES.OTP_SENT);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifyingOTP(true);
      const response = await parkingAPI.verifyOTP(mobileForOTP, otpCode, OTP_PURPOSE.DISCHARGE);
      if (response.success) {
        toast.success(SUCCESS_MESSAGES.OTP_VERIFIED);
      }
    } catch (error) {
      toast.error(error.message || ERROR_MESSAGES.INVALID_OTP);
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleVerifyImage = () => {
    if (selectedVehicleImages.length === 0) {
      toast.error('Selected vehicles do not have images for verification');
      return;
    }
    setImageVerified(true);
    toast.success('Image verified successfully');
  };

  const openImageModal = (imageUrl, title) => {
    if (imageUrl) {
      setImageModal({ isOpen: true, imageUrl, title });
    }
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: '', title: '' });
  };

  // Handle discharge image upload
  const handleDischargeImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingDischargeImage(true);
      const firebaseUrl = await firebaseStorageService.uploadImage(file, {
        folder: 'discharge',
        onProgress: (progress) => {
          // Progress tracking
        }
      });
      setDischargeImageUrl(firebaseUrl);
      toast.success('Discharge image uploaded successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingDischargeImage(false);
    }
  };

  const handleDischarge = async () => {
    if (selectedVehicles.length === 0) {
      toast.error('Please select at least one vehicle');
      return;
    }

    // Check verification based on selected method
    if (verificationMethod === 'otp') {
      if (!otpSent) {
        toast.error('Please send and verify OTP first');
        return;
      }
    } else if (verificationMethod === 'image') {
      if (!imageVerified) {
        toast.error('Please verify the vehicle image first');
        return;
      }
    }
    // Manual method doesn't need verification

    try {
      setDischarging(true);
      const response = await parkingAPI.dischargeVehicle(selectedVehicles, {
        verification_method: verificationMethod,
        discharge_image_url: dischargeImageUrl || '',
      });
      if (response.success) {
        toast.success(`${response.data?.dischargedCount || selectedVehicles.length} vehicle(s) discharged successfully`);
        setSelectedVehicles([]);
        setOtpSent(false);
        setOtpCode('');
        setMobileForOTP('');
        setImageVerified(false);
        setSelectedVehicleImages([]);
        setDischargeImageUrl(''); // Reset discharge image
        setVerificationMethod('otp'); // Reset to default
        loadVehicles();
      } else {
        toast.error(response.error?.message || 'Failed to discharge vehicle');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to discharge vehicle');
    } finally {
      setDischarging(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>Delivery Request - Parking Management</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">📦</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Delivery Request</h1>
                  <p className="text-gray-600 mt-1">Discharge vehicles from parking</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{vehicles.length}</p>
                <p className="text-sm text-gray-600">Pending Vehicles</p>
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center mb-6">
              <svg className="w-6 h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-800">Search & Filter</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none"
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
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none"
                              />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={applyFilters}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setFilters({ vehicle_number: '', mobile_number: '', from_date: '', to_date: '' });
                  setInputFilters({ vehicle_number: '', mobile_number: '' });
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Verification Card */}
          {selectedVehicles.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-6 border-2 border-green-200 animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-2xl">🔐</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Verification Method</h2>
                  <p className="text-sm text-gray-600">{selectedVehicles.length} vehicle(s) selected</p>
                </div>
              </div>

              {/* Verification Method Selection */}
              <div className="mb-6 bg-white rounded-xl p-4 border-2 border-gray-200">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="otp"
                      checked={verificationMethod === 'otp'}
                      onChange={() => {
                        setVerificationMethod('otp');
                        setImageVerified(false);
                        setOtpSent(false);
                        setOtpCode('');
                      }}
                      className="w-5 h-5 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-3 font-semibold text-gray-800">OTP Verification</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="image"
                      checked={verificationMethod === 'image'}
                      onChange={() => {
                        setVerificationMethod('image');
                        setOtpSent(false);
                        setOtpCode('');
                        setImageVerified(false);
                      }}
                      className="w-5 h-5 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-3 font-semibold text-gray-800">Image Verification</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="manual"
                      checked={verificationMethod === 'manual'}
                      onChange={() => {
                        setVerificationMethod('manual');
                        setOtpSent(false);
                        setOtpCode('');
                        setImageVerified(false);
                      }}
                      className="w-5 h-5 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-3 font-semibold text-gray-800">Manual (No Verification)</span>
                  </label>
                </div>
              </div>

              {/* OTP Verification Section */}
              {verificationMethod === 'otp' && (
                <div className="space-y-4">
                  <button
                    onClick={handleSendOTP}
                    disabled={otpSent}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {otpSent ? '✓ OTP Sent' : 'Send OTP to Mobile'}
                  </button>
                  
                  {otpSent && (
                    <div className="space-y-3 animate-fade-in">
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none text-center text-2xl tracking-widest font-bold"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleVerifyOTP}
                          disabled={verifyingOTP || otpCode.length !== 6}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {verifyingOTP ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button
                          onClick={handleDischarge}
                          disabled={discharging || !otpSent}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {discharging ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Discharging...
                            </span>
                          ) : (
                            `Discharge ${selectedVehicles.length} Vehicle(s)`
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Verification Section */}
              {verificationMethod === 'manual' && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-lg font-bold text-yellow-800">Manual Discharge</h3>
                    </div>
                    <p className="text-sm text-yellow-700">No verification required. Click the discharge button below to proceed.</p>
                  </div>
                  <button
                    onClick={handleDischarge}
                    disabled={discharging}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {discharging ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Discharging...
                      </span>
                    ) : (
                      `Discharge ${selectedVehicles.length} Vehicle(s)`
                    )}
                  </button>
                </div>
              )}

              {/* Discharge Image Upload (Optional - for all methods) */}
              <div className="mt-6 bg-white rounded-xl p-4 border-2 border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  📸 Discharge Image (Optional)
                  <span className="text-gray-500 text-xs font-normal ml-2">- Photo of person who took the vehicle</span>
                </label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleDischargeImageUpload}
                      disabled={uploadingDischargeImage}
                      className="hidden"
                    />
                    <div className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-center font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      {dischargeImageUrl ? '📁 Change Image' : '📁 Choose File'}
                    </div>
                  </label>
                  {dischargeImageUrl && (
                    <button
                      type="button"
                      onClick={() => setDischargeImageUrl('')}
                      className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {dischargeImageUrl && (
                  <div className="mt-3">
                    <img src={dischargeImageUrl} alt="Discharge" className="w-full h-48 object-cover rounded-xl border-2 border-gray-200" />
                  </div>
                )}
                {uploadingDischargeImage && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-sm text-gray-600 mt-2">Uploading...</p>
                  </div>
                )}
              </div>

              {/* Image Verification Section */}
              {verificationMethod === 'image' && (
                <div className="space-y-4">
                  {selectedVehicleImages.length > 0 ? (
                    <>
                      <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Registered Vehicle Image(s)</h3>
                        <p className="text-sm text-gray-600 mb-4">Please verify that the vehicle matches the image below before discharging:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedVehicleImages.map((imageUrl, index) => (
                            <div key={index} className="relative">
                              <img
                                src={imageUrl}
                                alt={`Vehicle ${index + 1}`}
                                className="w-full h-64 object-cover rounded-xl border-2 border-gray-300 shadow-lg"
                              />
                              <div className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                                Image {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleVerifyImage}
                          disabled={imageVerified}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {imageVerified ? (
                            <span className="flex items-center justify-center">
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Image Verified
                            </span>
                          ) : (
                            'Verify Image Matches'
                          )}
                        </button>
                        <button
                          onClick={handleDischarge}
                          disabled={discharging || !imageVerified}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {discharging ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Discharging...
                            </span>
                          ) : (
                            `Discharge ${selectedVehicles.length} Vehicle(s)`
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-semibold mb-2">No Images Available</p>
                      <p className="text-sm text-gray-600">Selected vehicles do not have registered images. Please use OTP verification instead.</p>
                      <button
                        onClick={() => setVerificationMethod('otp')}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
                      >
                        Switch to OTP Verification
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vehicle List Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedVehicles.length === vehicles.length && vehicles.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="font-bold text-gray-800">
                    Select All ({selectedVehicles.length} of {vehicles.length} selected)
                  </span>
                </div>
                {selectedVehicles.length > 0 && (
                  <div className="px-4 py-2 bg-green-100 text-green-800 rounded-xl font-semibold">
                    {selectedVehicles.length} vehicle(s) ready for discharge
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-12">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vehicle #</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Image</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 text-lg font-semibold">No vehicles pending discharge</p>
                          <p className="text-gray-400 text-sm mt-2">All vehicles have been discharged</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((vehicle, index) => (
                      <tr 
                        key={vehicle.id} 
                        className={`hover:bg-green-50/50 transition-colors duration-200 ${selectedVehicles.includes(vehicle.id) ? 'bg-green-50' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedVehicles.includes(vehicle.id)}
                            onChange={() => handleSelectVehicle(vehicle.id)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
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
                          <span className="text-sm text-gray-700">
                            {vehicle.registered_at
                              ? formatInTimezone(vehicle.registered_at, userTimezone, 'MMM dd, yyyy HH:mm')
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
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
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

export default DeliveryRequest;

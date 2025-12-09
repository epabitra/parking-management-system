/**
 * Vehicle Registration Page
 * Modern, professional form with smooth animations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { parkingAPI } from '@/services/parkingApi';
import { firebaseStorageService } from '@/services/firebaseStorage';
import { ROUTES, OTP_PURPOSE, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/config/constants';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import Loading from '@/components/Loading';
import { useAuth } from '@/context/AuthContext';

const RegisterVehicle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('otp'); // 'otp', 'image', or 'none'
  const [bulkMode, setBulkMode] = useState(false);
  const [vehicleNumbers, setVehicleNumbers] = useState(['']);
  const [bulkImageMode, setBulkImageMode] = useState('single'); // 'single' or 'multiple'
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [tokenNumber, setTokenNumber] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);
  const [duplicateTokenModal, setDuplicateTokenModal] = useState({ isOpen: false, tokens: [], vehicleData: null });
  const isSuperAdmin = user?.is_super_admin || false;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const mobileNumber = watch('mobile_number');
  const selectedCompanyId = watch('company_id');

  // Load companies for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      loadCompanies();
    }
  }, [isSuperAdmin]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await parkingAPI.listCompanies();
      if (response.success) {
        setCompanies(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Camera capture function for desktop/tablets
  const captureFromCamera = async (index = null) => {
    try {
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera access is not available in your browser');
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });

      // Create video element to show camera preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = '100%';
      video.style.maxHeight = '400px';
      video.style.objectFit = 'cover';
      video.style.borderRadius = '12px';

      // Create modal for camera preview
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      modal.style.zIndex = '9999';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '20px';

      const container = document.createElement('div');
      container.style.maxWidth = '600px';
      container.style.width = '100%';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.gap = '20px';

      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '10px';
      buttonContainer.style.width = '100%';
      buttonContainer.style.justifyContent = 'center';

      const captureButton = document.createElement('button');
      captureButton.textContent = '📷 Capture Photo';
      captureButton.style.padding = '12px 24px';
      captureButton.style.backgroundColor = '#3b82f6';
      captureButton.style.color = 'white';
      captureButton.style.border = 'none';
      captureButton.style.borderRadius = '8px';
      captureButton.style.fontSize = '16px';
      captureButton.style.fontWeight = 'bold';
      captureButton.style.cursor = 'pointer';

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.padding = '12px 24px';
      cancelButton.style.backgroundColor = '#6b7280';
      cancelButton.style.color = 'white';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '8px';
      cancelButton.style.fontSize = '16px';
      cancelButton.style.fontWeight = 'bold';
      cancelButton.style.cursor = 'pointer';

      container.appendChild(video);
      buttonContainer.appendChild(captureButton);
      buttonContainer.appendChild(cancelButton);
      container.appendChild(buttonContainer);
      modal.appendChild(container);
      document.body.appendChild(modal);

      // Track if capture is in progress
      let isCapturing = false;

      // Capture photo
      const capturePhoto = async () => {
        // Prevent multiple clicks
        if (isCapturing) {
          return;
        }
        
        isCapturing = true;
        
        // Disable buttons immediately
        captureButton.disabled = true;
        captureButton.style.opacity = '0.5';
        captureButton.style.cursor = 'not-allowed';
        captureButton.textContent = '📷 Capturing...';
        cancelButton.disabled = true;
        cancelButton.style.opacity = '0.5';
        cancelButton.style.cursor = 'not-allowed';

        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);

          // Stop all tracks immediately after capturing
          stream.getTracks().forEach(track => track.stop());

          // Hide video and show loading
          video.style.display = 'none';
          const loadingDiv = document.createElement('div');
          loadingDiv.style.textAlign = 'center';
          loadingDiv.style.color = 'white';
          loadingDiv.innerHTML = `
            <div style="margin-bottom: 20px;">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white" style="border-color: white;"></div>
            </div>
            <p style="font-size: 18px; font-weight: bold;">Uploading image...</p>
          `;
          container.insertBefore(loadingDiv, buttonContainer);

          // Convert canvas to blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              toast.error('Failed to capture image');
              document.body.removeChild(modal);
              return;
            }

            try {
              // Create a File object from blob
              const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
              
              // Process the file like a regular upload
              await processImageFile(file, index);
              
              // Remove modal after successful upload
              document.body.removeChild(modal);
            } catch (error) {
              console.error('Upload error:', error);
              toast.error('Failed to upload image: ' + (error.message || 'Unknown error'));
              document.body.removeChild(modal);
            }
          }, 'image/jpeg', 0.9);
        } catch (error) {
          console.error('Capture error:', error);
          toast.error('Failed to capture image: ' + (error.message || 'Unknown error'));
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        }
      };

      captureButton.onclick = capturePhoto;
      cancelButton.onclick = () => {
        if (isCapturing) return; // Prevent cancel during capture
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };

      // Auto-focus and show preview
      video.onloadedmetadata = () => {
        video.play();
      };
    } catch (error) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found on your device');
      } else {
        toast.error('Failed to access camera: ' + error.message);
      }
    }
  };

  // Process image file (used by both file upload and camera capture)
  const processImageFile = async (file, index = null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const firebaseUrl = await firebaseStorageService.uploadImage(file, {
        folder: 'vehicles',
      });
      
      if (index !== null && bulkMode && bulkImageMode === 'multiple') {
        const newUrls = [...imageUrls];
        newUrls[index] = firebaseUrl;
        setImageUrls(newUrls);
      } else {
        setImageUrl(firebaseUrl);
      }
      
      toast.success(SUCCESS_MESSAGES.MEDIA_UPLOADED);
    } catch (error) {
      toast.error(error.message || ERROR_MESSAGES.UPLOAD_ERROR);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e, index = null) => {
    const file = e.target.files[0];
    if (!file) return;
    await processImageFile(file, index);
  };
  
  const addVehicleField = () => {
    setVehicleNumbers([...vehicleNumbers, '']);
    // Only add to imageUrls if in multiple image mode
    if (bulkImageMode === 'multiple') {
      setImageUrls([...imageUrls, '']);
    }
  };
  
  const removeVehicleField = (index) => {
    const newNumbers = vehicleNumbers.filter((_, i) => i !== index);
    setVehicleNumbers(newNumbers);
    // Only update imageUrls if in multiple image mode
    if (bulkImageMode === 'multiple') {
      const newUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newUrls);
    }
  };
  
  const updateVehicleNumber = (index, value) => {
    const newNumbers = [...vehicleNumbers];
    newNumbers[index] = value;
    setVehicleNumbers(newNumbers);
  };

  const handleGenerateToken = async () => {
    try {
      setGeneratingToken(true);
      const response = await parkingAPI.generateTokenNumber();
      if (response.success && response.data?.token_number) {
        setTokenNumber(response.data.token_number);
        toast.success('Token number generated successfully');
      } else {
        toast.error('Failed to generate token number');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate token number');
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleDuplicateTokenProceed = async (proceedWithSameToken) => {
    const { vehicleData } = duplicateTokenModal;
    setDuplicateTokenModal({ isOpen: false, tokens: [], vehicleData: null });
    
    if (proceedWithSameToken) {
      // Proceed with same token number - allow duplicate token
      const vehicleDataWithFlag = {
        ...vehicleData,
        allow_duplicate_token: true
      };
      await submitVehicleRegistration(vehicleDataWithFlag);
    } else {
      // User wants to change token number - clear it and let them enter new one
      setTokenNumber('');
      toast.info('Please enter a new token number');
    }
  };

  const submitVehicleRegistration = async (vehicleData) => {
    try {
      setSubmitting(true);
      const response = await parkingAPI.registerVehicle(vehicleData);

      if (response.success) {
        const count = bulkMode ? (response.data?.count || vehicleNumbers.filter(vn => vn.trim() !== '').length) : 1;
        toast.success(`${count} vehicle(s) registered successfully`);
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else {
        // Check for duplicate token error
        if (response.error?.code === 'DUPLICATE_TOKEN') {
          try {
            const errorData = typeof response.error.message === 'string' ? JSON.parse(response.error.message) : response.error;
            setDuplicateTokenModal({
              isOpen: true,
              tokens: errorData.tokens || [],
              vehicleData: vehicleData
            });
          } catch (e) {
            toast.error(response.error?.message || 'Failed to register vehicle');
          }
        } else {
          toast.error(response.error?.message || 'Failed to register vehicle');
        }
      }
    } catch (error) {
      // Check for duplicate token error in catch block
      if (error.data?.error?.code === 'DUPLICATE_TOKEN') {
        try {
          const errorData = typeof error.data.error.message === 'string' ? JSON.parse(error.data.error.message) : error.data.error;
          setDuplicateTokenModal({
            isOpen: true,
            tokens: errorData.tokens || [],
            vehicleData: vehicleData
          });
        } catch (e) {
          toast.error(error.message || 'Failed to register vehicle');
        }
      } else {
        toast.error(error.message || 'Failed to register vehicle');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOTP = async () => {
    if (!mobileNumber) {
      toast.error('Please enter mobile number first');
      return;
    }

    try {
      setOtpSent(false);
      const response = await parkingAPI.sendOTP(mobileNumber, OTP_PURPOSE.REGISTER);
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
      const response = await parkingAPI.verifyOTP(mobileNumber, otpCode, OTP_PURPOSE.REGISTER);
      if (response.success) {
        setOtpVerified(true);
        toast.success(SUCCESS_MESSAGES.OTP_VERIFIED);
      }
    } catch (error) {
      toast.error(error.message || ERROR_MESSAGES.INVALID_OTP);
    } finally {
      setVerifyingOTP(false);
    }
  };

  const onSubmit = async (data) => {
    // Validate based on verification method
    if (verificationMethod === 'otp' && !otpVerified) {
      toast.error('Please verify OTP');
      return;
    }
    if (verificationMethod === 'image' && !imageUrl && (!bulkMode || bulkImageMode === 'single' ? !imageUrl : imageUrls.every(url => !url))) {
      toast.error('Please upload vehicle image');
      return;
    }
    // 'none' method doesn't require validation

    try {
      setSubmitting(true);

      if (bulkMode) {
        const validNumbers = vehicleNumbers.filter(vn => vn.trim() !== '');
        if (validNumbers.length === 0) {
          toast.error('Please enter at least one vehicle number');
          setSubmitting(false);
          return;
        }

        // Handle image URLs based on bulk image mode
        let vehicleImageUrls = [];
        let vehicleImageUrl = '';
        
        if (bulkImageMode === 'single') {
          // Use single image for all vehicles
          vehicleImageUrl = imageUrl || '';
          vehicleImageUrls = validNumbers.map(() => imageUrl || '');
        } else {
          // Use multiple images (one per vehicle)
          vehicleImageUrls = imageUrls.filter((url, idx) => validNumbers[idx]);
          vehicleImageUrl = vehicleImageUrls[0] || imageUrl || '';
        }

        const vehicleData = {
          vehicle_numbers: validNumbers,
          mobile_number: data.mobile_number,
          name: data.name || '',
          address: data.address || '',
          vehicle_image_urls: vehicleImageUrls,
          vehicle_image_url: vehicleImageUrl,
          status: 'parked',
          verification_method: verificationMethod, // 'otp', 'image', or 'none'
          ...(tokenNumber.trim() && { token_number: tokenNumber.trim() }),
          ...(isSuperAdmin && selectedCompanyId && { company_id: selectedCompanyId }),
        };

        await submitVehicleRegistration(vehicleData);
      } else {
        const vehicleData = {
          vehicle_number: data.vehicle_number,
          mobile_number: data.mobile_number,
          name: data.name || '',
          address: data.address || '',
          vehicle_image_url: imageUrl || '',
          status: 'parked',
          verification_method: verificationMethod, // 'otp', 'image', or 'none'
          ...(tokenNumber.trim() && { token_number: tokenNumber.trim() }),
          ...(isSuperAdmin && selectedCompanyId && { company_id: selectedCompanyId }),
        };

        await submitVehicleRegistration(vehicleData);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to register vehicle');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register Vehicle - Parking Management</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">🚗</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Register Vehicle</h1>
                <p className="text-gray-600 mt-1">Add new vehicle to the parking system</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Selection for Super Admin */}
              {isSuperAdmin && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-100">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Select Company <span className="text-red-500">*</span>
                  </label>
                  {loadingCompanies ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      <span className="ml-2 text-gray-600">Loading companies...</span>
                    </div>
                  ) : (
                    <select
                      {...register('company_id', { required: isSuperAdmin ? 'Company selection is required' : false })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none"
                    >
                      <option value="">-- Select Company --</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.company_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.company_id.message}</p>
                  )}
                </div>
              )}

              {/* Bulk Mode Toggle */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-100">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={bulkMode}
                      onChange={(e) => {
                    setBulkMode(e.target.checked);
                    if (!e.target.checked) {
                      setVehicleNumbers(['']);
                      setImageUrls([]);
                      setBulkImageMode('single');
                    } else {
                      // Initialize imageUrls array when switching to bulk mode
                      if (bulkImageMode === 'multiple') {
                        setImageUrls(new Array(vehicleNumbers.length).fill(''));
                      }
                    }
                  }}
                      className="sr-only"
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ${bulkMode ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ${bulkMode ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <span className="ml-4 text-gray-700 font-semibold">Bulk Registration (Multiple Vehicles)</span>
                </label>
              </div>

              {/* Vehicle Number(s) */}
              {bulkMode ? (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Vehicle Numbers <span className="text-red-500">*</span>
                  </label>
                  {vehicleNumbers.map((vn, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 font-semibold">#{index + 1}</span>
                          </div>
                          <input
                            type="text"
                            value={vn}
                            onChange={(e) => updateVehicleNumber(index, e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                            placeholder={`Vehicle number ${index + 1}`}
                          />
                        </div>
                      </div>
                      {vehicleNumbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVehicleField(index)}
                          className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addVehicleField}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Another Vehicle
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Vehicle Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('vehicle_number', {
                      required: !bulkMode ? ERROR_MESSAGES.MISSING_VEHICLE_NUMBER : false,
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                    placeholder="Enter vehicle number"
                  />
                  {errors.vehicle_number && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.vehicle_number.message}
                    </p>
                  )}
                </div>
              )}

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    {...register('mobile_number', {
                      required: ERROR_MESSAGES.MISSING_MOBILE_NUMBER,
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Mobile number must be 10 digits',
                      },
                    })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>
                {errors.mobile_number && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.mobile_number.message}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Name <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  placeholder="Enter depositor name"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Address <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none resize-none"
                  placeholder="Enter address"
                />
              </div>

              {/* Token Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Token Number <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenNumber}
                    onChange={(e) => setTokenNumber(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                    placeholder="Enter token number or click Generate"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateToken}
                    disabled={generatingToken}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {generatingToken ? 'Generating...' : 'Generate'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave empty if no token number needed</p>
              </div>

              {/* Validation Method */}
              <div className="border-t-2 border-gray-100 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full mr-3"></span>
                  Validation Method
                </h3>

                {/* Compact selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'otp', label: 'OTP Verification', desc: 'Send & verify OTP', color: 'from-blue-500 to-indigo-600' },
                    { key: 'image', label: 'Image Validation', desc: 'Upload depositor photo', color: 'from-green-500 to-emerald-600' },
                    { key: 'none', label: 'No Verification', desc: 'Quick register, no proof', color: 'from-gray-500 to-slate-600' },
                  ].map(option => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setVerificationMethod(option.key)}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                        verificationMethod === option.key ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-600">{option.desc}</p>
                        </div>
                        <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${option.color} text-white flex items-center justify-center font-bold`}>
                          {verificationMethod === option.key ? '✓' : ''}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Render only the selected method details */}
                {verificationMethod === 'otp' && (
                  <div className="border-2 rounded-xl p-5 border-blue-200 bg-blue-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-800">OTP Verification</div>
                      {otpVerified && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>

                    {!otpVerified && (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={!mobileNumber || otpSent}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {otpSent ? 'OTP Sent ✓' : 'Send OTP'}
                        </button>

                        {otpSent && (
                          <div className="space-y-3 animate-fade-in">
                            <input
                              type="text"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="Enter 6-digit OTP"
                              maxLength={6}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-center text-2xl tracking-widest font-bold"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOTP}
                              disabled={verifyingOTP || otpCode.length !== 6}
                              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {verifyingOTP ? 'Verifying...' : 'Verify OTP'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {verificationMethod === 'image' && (
                  <div className="border-2 rounded-xl p-5 border-blue-200 bg-blue-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-800">Image Validation</div>
                      {imageUrl && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Uploaded
                        </span>
                      )}
                    </div>

                    {bulkMode ? (
                      <div className="space-y-4">
                        {/* Image Mode Selection for Bulk */}
                        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                          <label className="block text-sm font-bold text-gray-700 mb-3">Image Upload Mode:</label>
                          <div className="flex gap-4">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="bulkImageMode"
                                value="single"
                                checked={bulkImageMode === 'single'}
                                onChange={(e) => {
                                  setBulkImageMode(e.target.value);
                                  // Clear multiple images if switching to single
                                  if (e.target.value === 'single') {
                                    setImageUrls([]);
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-700">One Image for All Vehicles</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="bulkImageMode"
                                value="multiple"
                                checked={bulkImageMode === 'multiple'}
                                onChange={(e) => {
                                  setBulkImageMode(e.target.value);
                                  // Initialize imageUrls array if switching to multiple
                                  if (e.target.value === 'multiple' && imageUrls.length === 0) {
                                    setImageUrls(new Array(vehicleNumbers.length).fill(''));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-700">Multiple Images (One per Vehicle)</span>
                            </label>
                          </div>
                        </div>

                        {/* Single Image Mode */}
                        {bulkImageMode === 'single' ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
                            <p className="text-sm font-medium text-gray-700 mb-3">Upload One Image for All Vehicles:</p>
                            <div className="flex gap-2 mb-3">
                              <label className="flex-1">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  disabled={uploadingImage}
                                  className="hidden"
                                />
                                <div className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-center font-semibold text-gray-700">
                                  📁 Choose File
                                </div>
                              </label>
                              <button
                                type="button"
                                onClick={() => captureFromCamera()}
                                disabled={uploadingImage}
                                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer transition-colors text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                📷 Use Camera
                              </button>
                            </div>
                            {imageUrl && (
                              <img src={imageUrl} alt="Vehicle Depositor" className="w-full h-40 object-cover rounded-xl mt-3 border-2 border-gray-200" />
                            )}
                            {uploadingImage && (
                              <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-600 mt-2">Uploading...</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Multiple Images Mode */
                          <div className="space-y-4">
                            {vehicleNumbers.map((vn, index) => (
                              <div key={index} className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
                                <p className="text-sm font-medium text-gray-700 mb-3">Vehicle {index + 1}: <span className="font-bold">{vn || 'Not entered'}</span></p>
                                <div className="flex gap-2 mb-3">
                                  <label className="flex-1">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(e, index)}
                                      disabled={uploadingImage}
                                      className="hidden"
                                    />
                                    <div className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-center font-semibold text-gray-700">
                                      📁 Choose File
                                    </div>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => captureFromCamera(index)}
                                    disabled={uploadingImage}
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer transition-colors text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    📷 Use Camera
                                  </button>
                                </div>
                                {imageUrls[index] && (
                                  <img src={imageUrls[index]} alt={`Vehicle ${index + 1}`} className="w-full h-40 object-cover rounded-xl mt-3 border-2 border-gray-200" />
                                )}
                              </div>
                            ))}
                            {uploadingImage && (
                              <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-600 mt-2">Uploading...</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2 mb-3">
                          <label className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                              className="hidden"
                            />
                            <div className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-center font-semibold text-gray-700">
                              📁 Choose File
                            </div>
                          </label>
                          <button
                            type="button"
                            onClick={() => captureFromCamera()}
                            disabled={uploadingImage}
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer transition-colors text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            📷 Use Camera
                          </button>
                        </div>
                        {imageUrl && (
                          <img src={imageUrl} alt="Vehicle" className="w-full h-64 object-cover rounded-xl border-2 border-gray-200" />
                        )}
                        {uploadingImage && (
                          <div className="text-center py-4">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-gray-600 mt-2">Uploading...</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {verificationMethod === 'none' && (
                  <div className="border-2 rounded-xl p-5 border-gray-200 bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-800">No Verification</div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Quick Register
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Register vehicle without OTP or image verification. Just enter the information and submit.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
                <button
                  type="submit"
                  disabled={submitting || (
                    verificationMethod === 'otp' && !otpVerified
                  ) || (
                    verificationMethod === 'image' && (
                      bulkMode 
                        ? (bulkImageMode === 'single' ? !imageUrl : !imageUrls.some(url => url))
                        : !imageUrl
                    )
                  )}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                    bulkMode ? `Register ${vehicleNumbers.filter(vn => vn.trim()).length} Vehicle(s)` : 'Register Vehicle'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
                  className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Duplicate Token Warning Modal */}
      {duplicateTokenModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Token Number Already In Use</h3>
            </div>
            <p className="text-gray-700 mb-4">
              The token number <strong>{duplicateTokenModal.tokens[0]?.token_number || tokenNumber}</strong> is already assigned to a parked vehicle:
            </p>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-4">
              {duplicateTokenModal.tokens.map((token, idx) => (
                <div key={idx} className="text-sm text-gray-800 mb-2">
                  <strong>Vehicle:</strong> {token.vehicle_number} <br />
                  <strong>Token:</strong> {token.token_number}
                </div>
              ))}
            </div>
            <p className="text-gray-700 mb-2">
              <strong>Note:</strong> You can use the same token number for multiple vehicles (useful for groups of friends/colleagues registering together).
            </p>
            <p className="text-gray-700 mb-6">
              How would you like to proceed?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDuplicateTokenProceed(false)}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-semibold"
              >
                Change Token Number
              </button>
              <button
                onClick={() => handleDuplicateTokenProceed(true)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
              >
                Use Same Token Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RegisterVehicle;

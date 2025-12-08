/**
 * Edit Vehicle Page
 * Edit vehicle information (for employees)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { parkingAPI } from '@/services/parkingApi';
import { firebaseStorageService } from '@/services/firebaseStorage';
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/config/constants';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import Loading from '@/components/Loading';

const EditVehicle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const response = await parkingAPI.getVehicle(id);
      if (response.success) {
        const vehicle = response.data;
        setValue('vehicle_number', vehicle.vehicle_number);
        setValue('mobile_number', vehicle.mobile_number);
        setValue('name', vehicle.name || '');
        setValue('address', vehicle.address || '');
        setImageUrl(vehicle.vehicle_image_url || '');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load vehicle');
      navigate(ROUTES.ADMIN_VEHICLES);
    } finally {
      setLoading(false);
    }
  };

  // Camera capture function for desktop/tablets
  const captureFromCamera = async () => {
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
              await processImageFile(file);
              
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
  const processImageFile = async (file) => {
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
      setImageUrl(firebaseUrl);
      toast.success(SUCCESS_MESSAGES.MEDIA_UPLOADED);
    } catch (error) {
      toast.error(error.message || ERROR_MESSAGES.UPLOAD_ERROR);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await processImageFile(file);
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      const vehicleData = {
        vehicle_number: data.vehicle_number,
        mobile_number: data.mobile_number,
        name: data.name || '',
        address: data.address || '',
        vehicle_image_url: imageUrl || '',
      };

      const response = await parkingAPI.updateVehicle(id, vehicleData);

      if (response.success) {
        toast.success(SUCCESS_MESSAGES.VEHICLE_UPDATED);
        navigate(ROUTES.ADMIN_VEHICLES);
      } else {
        toast.error(response.error?.message || 'Failed to update vehicle');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>Edit Vehicle - Parking Management</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Vehicle</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('vehicle_number', {
                    required: ERROR_MESSAGES.MISSING_VEHICLE_NUMBER,
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.vehicle_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.vehicle_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('mobile_number', {
                    required: ERROR_MESSAGES.MISSING_MOBILE_NUMBER,
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Mobile number must be 10 digits',
                    },
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.mobile_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobile_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name (Optional)</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address (Optional)</label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {imageUrl && (
                  <img src={imageUrl} alt="Vehicle" className="w-full h-48 object-cover rounded-lg mt-4" />
                )}
                {uploadingImage && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitting ? 'Updating...' : 'Update Vehicle'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.ADMIN_VEHICLES)}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
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

export default EditVehicle;


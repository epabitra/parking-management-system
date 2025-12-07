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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
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


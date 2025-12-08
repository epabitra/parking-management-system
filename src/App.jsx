/**
 * Main App Component
 * Sets up routing, context providers, and global configuration
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import ScrollToTop from '@/components/ScrollToTop';
import { ROUTES } from '@/config/constants';

// Layouts
import AdminLayout from '@/components/Layout/AdminLayout';

// Admin Pages
import AdminLogin from '@/pages/Admin/Login';
import AdminDashboard from '@/pages/Admin/Dashboard';
import RegisterVehicle from '@/pages/Admin/RegisterVehicle';
import VehicleList from '@/pages/Admin/VehicleList';
import EditVehicle from '@/pages/Admin/EditVehicle';
import DeliveryRequest from '@/pages/Admin/DeliveryRequest';
import EmployeeManagement from '@/pages/Admin/EmployeeManagement';
import CompanyManagement from '@/pages/Admin/CompanyManagement';
import ChangePassword from '@/pages/Admin/ChangePassword';
import RegisterCompany from '@/pages/RegisterCompany';
import Home from '@/pages/Home';

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL || ''} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path={ROUTES.HOME} element={<Home />} />
              <Route path={ROUTES.REGISTER_COMPANY} element={<RegisterCompany />} />
              
              {/* Admin Routes */}
              <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLogin />} />
              
              <Route
                path={ROUTES.ADMIN_DASHBOARD}
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ADMIN_REGISTER}
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <RegisterVehicle />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ADMIN_VEHICLES}
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <VehicleList />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ADMIN_VEHICLE_EDIT}
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <EditVehicle />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ADMIN_DELIVERY}
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <DeliveryRequest />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ADMIN_EMPLOYEES}
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminLayout>
                        <EmployeeManagement />
                      </AdminLayout>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ADMIN_COMPANIES}
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <CompanyManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ADMIN_CHANGE_PASSWORD}
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <ChangePassword />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* Default redirect to home */}
              <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>

            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;

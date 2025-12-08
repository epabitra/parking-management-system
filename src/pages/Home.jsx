/**
 * Public Landing Page
 * Welcome page with information about the parking management system
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/constants';
import { Helmet } from 'react-helmet-async';

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Parking Management System - Efficient Vehicle Tracking</title>
        <meta name="description" content="Professional parking management system for tracking vehicles, managing registrations, and handling deliveries efficiently." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-2xl">🚗</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Parking Management</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to={ROUTES.REGISTER_COMPANY}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
                >
                  Register Company
                </Link>
                <Link
                  to={ROUTES.ADMIN_LOGIN}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6 shadow-2xl">
              <span className="text-5xl">🚗</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Professional Parking
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Management System
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Streamline your parking operations with our comprehensive vehicle tracking, 
              registration, and delivery management solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={ROUTES.REGISTER_COMPANY}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 font-semibold text-lg"
              >
                Get Started - Register Your Company
              </Link>
              <Link
                to={ROUTES.ADMIN_LOGIN}
                className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 transform hover:-translate-y-1 transition-all duration-200 font-semibold text-lg"
              >
                Login to Dashboard
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Vehicle Registration</h3>
              <p className="text-gray-600 leading-relaxed">
                Easily register vehicles with customer details, mobile numbers, and vehicle images. 
                Support for bulk registration to handle multiple vehicles at once.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure Discharge</h3>
              <p className="text-gray-600 leading-relaxed">
                Multiple verification methods including OTP, image verification, and manual discharge. 
                Track who discharged each vehicle with timestamps and verification details.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-time Dashboard</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive dashboard with statistics, vehicle lists, and filtering options. 
                Track parked and discharged vehicles with detailed analytics.
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Our System?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Secure & Reliable</h4>
                  <p className="text-gray-600">Enterprise-grade security with role-based access control and secure authentication.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Multi-Company Support</h4>
                  <p className="text-gray-600">Perfect for parking centers managing multiple locations with isolated data per company.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Image Management</h4>
                  <p className="text-gray-600">Capture and store vehicle images with camera support for mobile, tablet, and desktop devices.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Advanced Filtering</h4>
                  <p className="text-gray-600">Powerful search and filter capabilities with pagination for efficient data management.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-12 text-center text-white animate-fade-in" style={{ animationDelay: '500ms' }}>
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join multiple parking centers already using our system to manage their vehicle operations efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={ROUTES.REGISTER_COMPANY}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transform hover:-translate-y-1 transition-all duration-200 font-semibold text-lg shadow-lg"
              >
                Register Your Company Now
              </Link>
              <Link
                to={ROUTES.ADMIN_LOGIN}
                className="px-8 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-400 transform hover:-translate-y-1 transition-all duration-200 font-semibold text-lg shadow-lg border-2 border-white"
              >
                Login to Existing Account
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="mb-2">© {new Date().getFullYear()} Parking Management System. All rights reserved.</p>
              <p className="text-sm text-gray-500">Professional vehicle tracking and parking management solution</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;


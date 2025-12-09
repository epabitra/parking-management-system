/**
 * Parking Management Dashboard
 * Modern, beautiful dashboard with statistics and quick actions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parkingAPI } from '@/services/parkingApi';
import { ROUTES } from '@/config/constants';
import Loading from '@/components/Loading';
import { Helmet } from 'react-helmet-async';
import { formatInTimezone, getUserTimezone } from '@/utils/timezone';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    today: { registered: 0, discharged: 0, pending: 0 },
    week: { registered: 0, discharged: 0 },
    month: { registered: 0, discharged: 0 },
    total: { registered: 0, discharged: 0, pending: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userTimezone = getUserTimezone(user);

  useEffect(() => {
    loadDashboardData();
    // Removed auto-refresh - user can manually refresh if needed
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await parkingAPI.getDashboardStats();
      if (response.success) {
        setStats(response.data || stats);
      } else {
        setError(response.error?.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4 font-semibold">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, gradient, delay = 0 }) => {
    const gradients = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-500 to-yellow-600',
      purple: 'from-purple-500 to-purple-600',
      indigo: 'from-indigo-500 to-indigo-600',
      pink: 'from-pink-500 to-pink-600',
    };

    return (
      <div 
        className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 animate-fade-in"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-left flex-1">
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm font-semibold text-gray-600">{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradients[gradient] || gradients.blue} flex items-center justify-center shadow-lg ml-4`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${gradients[gradient] || gradients.blue} rounded-full`} style={{ width: '100%' }}></div>
        </div>
      </div>
    );
  };

  const QuickActionCard = ({ title, icon, to, gradient, onClick }) => {
    const gradients = {
      blue: 'from-blue-500 to-indigo-600',
      green: 'from-green-500 to-emerald-600',
      purple: 'from-purple-500 to-pink-600',
      orange: 'from-orange-500 to-red-600',
    };

    const content = (
      <div className={`bg-gradient-to-br ${gradients[gradient] || gradients.blue} rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <div className="flex items-center text-white/90 text-sm">
          <span>Click to open</span>
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    );

    if (onClick) {
      return <div onClick={onClick}>{content}</div>;
    }

    return <Link to={to}>{content}</Link>;
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Parking Management</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Dashboard Overview
                </h1>
                {user?.company && (
                  <p className="text-blue-600 text-sm font-semibold">
                    🏢 {user.company.name}
                  </p>
                )}
                {user?.is_super_admin && (
                  <p className="text-yellow-600 text-sm font-semibold">
                    ⭐ Super Admin
                  </p>
                )}
                <p className="text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Last updated: {formatInTimezone(new Date().toISOString(), userTimezone, 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>

          {/* Today's Statistics */}
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full mr-3"></span>
              Today's Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Registered Today"
                value={stats.today.registered}
                subtitle="New vehicles"
                icon="🚗"
                gradient="blue"
                delay={0}
              />
              <StatCard
                title="Discharged Today"
                value={stats.today.discharged}
                subtitle="Vehicles released"
                icon="✅"
                gradient="green"
                delay={100}
              />
              <StatCard
                title="Currently Parked"
                value={stats.today.pending}
                subtitle="In parking now"
                icon="⏳"
                gradient="yellow"
                delay={200}
              />
            </div>
          </div>

          {/* Weekly & Monthly Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">📅</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">This Week</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 font-medium">Registered</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats.week.registered}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 font-medium">Discharged</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{stats.week.discharged}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">This Month</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 font-medium">Registered</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats.month.registered}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 font-medium">Discharged</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{stats.month.discharged}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Statistics */}
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-3"></span>
              Total Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Registered"
                value={stats.total.registered}
                subtitle="All time"
                icon="📈"
                gradient="purple"
                delay={0}
              />
              <StatCard
                title="Total Discharged"
                value={stats.total.discharged}
                subtitle="All time"
                icon="🎯"
                gradient="green"
                delay={100}
              />
              <StatCard
                title="Currently Parked"
                value={stats.total.pending}
                subtitle="In parking now"
                icon="🅿️"
                gradient="indigo"
                delay={200}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full mr-3"></span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <QuickActionCard
                title="Register Vehicle"
                icon="🚗"
                to={ROUTES.ADMIN_REGISTER}
                gradient="blue"
              />
              <QuickActionCard
                title="Delivery Request"
                icon="📦"
                to={ROUTES.ADMIN_DELIVERY}
                gradient="green"
              />
              <QuickActionCard
                title="View All Vehicles"
                icon="📋"
                to={ROUTES.ADMIN_VEHICLES}
                gradient="purple"
              />
              <QuickActionCard
                title="Export Data"
                icon="📥"
                gradient="orange"
                onClick={async () => {
                  try {
                    const fromDate = new Date();
                    fromDate.setMonth(fromDate.getMonth() - 1);
                    const toDate = new Date();
                    
                    const response = await parkingAPI.exportData(
                      fromDate.toISOString().split('T')[0],
                      toDate.toISOString().split('T')[0]
                    );
                    
                    if (response.success) {
                      window.open(response.data.publicUrl, '_blank');
                      toast.success('Data exported successfully');
                    }
                  } catch (error) {
                    toast.error(error.message || 'Failed to export data');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

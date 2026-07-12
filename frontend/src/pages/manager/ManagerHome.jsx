import React, { useState, useEffect } from 'react';
import API from '../../api/API.js';
import { useAuth } from '../../context/AuthContext';
import AiAction from '../../components/AiAction.jsx';

const ManagerHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard')
      .then((res) => {
        const data = res.data.data || res.data;
        setStats(data);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cards = stats?.stats ? [
    { label: 'Total Assets', value: stats.stats.totalAssets, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Available', value: stats.stats.availableAssets, color: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'Allocated', value: stats.stats.allocatedAssets, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { label: 'Pending Maintenance', value: stats.stats.pendingMaintenance, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  ] : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.name || 'Manager'}</h1>
      <p className="text-gray-500 mb-6">Manager Dashboard</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`p-5 rounded-xl border ${card.color}`}>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {!stats && (
        <div className="text-center text-gray-500 py-12">
          <p>Unable to load dashboard data.</p>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">✨ AI Features</h2>
        <p className="text-sm text-gray-500 mb-2">Use AI to get insights and suggestions.</p>

        <AiAction
          label="Department Insights"
          endpoint="/ai/dashboard"
          payload={{
            available: stats?.stats?.availableAssets || 0,
            allocated: stats?.stats?.allocatedAssets || 0,
            maintenance: stats?.stats?.underMaintenance || 0,
            overdue: stats?.stats?.pendingMaintenance || 0,
          }}
          render={(d) => (
            <div className="space-y-1">
              <p><strong>Summary:</strong> {d.summary}</p>
              <p><strong>Top Insight:</strong> {d.topInsight}</p>
              <p><strong>Biggest Risk:</strong> {d.biggestRisk}</p>
              <p><strong>Recommendation:</strong> {d.recommendation}</p>
            </div>
          )}
        />

        <AiAction
          label="Smart Booking Suggestions"
          endpoint="/ai/booking"
          payload={{ asset_name: 'Conference Room A', requested_by: user?.name || 'Manager', start_date: '2026-07-15', end_date: '2026-07-15' }}
          render={(d) => (
            <div className="space-y-1">
              <p><strong>Available:</strong> {String(d.available)}</p>
              <p><strong>Conflict:</strong> {String(d.conflict)}</p>
              <p><strong>Suggestion:</strong> {d.suggestion}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default ManagerHome;
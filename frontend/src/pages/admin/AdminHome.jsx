import React, { useState, useEffect } from 'react';
import API from '../../api/API.js';
import AiAction from '../../components/AiAction.jsx';

const AdminHome = () => {
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
    { label: 'Under Maintenance', value: stats.stats.underMaintenance, color: 'bg-red-50 text-red-700 border-red-200' },
    { label: 'Total Employees', value: stats.stats.totalEmployees, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'Departments', value: stats.stats.totalDepartments, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { label: 'Pending Maintenance', value: stats.stats.pendingMaintenance, color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { label: 'Active Bookings', value: stats.stats.activeBookings, color: 'bg-teal-50 text-teal-700 border-teal-200' },
  ] : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`p-5 rounded-xl border ${card.color}`}>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {stats?.recentAllocations?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Allocations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Asset</th>
                  <th className="pb-2 font-medium">Tag</th>
                  <th className="pb-2 font-medium">Employee</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAllocations.map((a, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{a.asset?.name}</td>
                    <td className="py-2 text-gray-500">{a.asset?.assetTag}</td>
                    <td className="py-2">{a.employee?.name}</td>
                    <td className="py-2 text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats?.recentMaintenance?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Maintenance Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Asset</th>
                  <th className="pb-2 font-medium">Requested By</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentMaintenance.map((m, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{m.asset?.name}</td>
                    <td className="py-2">{m.requestedBy?.name}</td>
                    <td className="py-2 text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!stats && (
        <div className="text-center text-gray-500 py-12">
          <p>Unable to load dashboard data.</p>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">✨ AI Business Insights</h2>
        <p className="text-sm text-gray-500 mb-2">Get an AI-generated summary of your organization's asset health.</p>
        <AiAction
          label="Generate Business Insights"
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
      </div>
    </div>
  );
};

export default AdminHome;
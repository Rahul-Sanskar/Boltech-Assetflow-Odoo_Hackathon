import React, { useState, useEffect } from 'react';
import API from '../../api/API.js';
import AiAction from '../../components/AiAction.jsx';

const Reports = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get('/dashboard').then(r => setStats(r.data.data?.stats || null)).catch(() => setStats(null));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">✨ AI Executive Summary</h2>
        <p className="text-sm text-gray-500 mb-2">Generate an executive summary of current operations.</p>
        <AiAction
          label="Generate Executive Summary"
          endpoint="/ai/dashboard"
          payload={{
            available: stats?.availableAssets || 0,
            allocated: stats?.allocatedAssets || 0,
            maintenance: stats?.underMaintenance || 0,
            overdue: stats?.pendingMaintenance || 0
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

export default Reports;

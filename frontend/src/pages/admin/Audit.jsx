import React, { useState, useEffect } from 'react';
import API from '../../api/API.js';
import AiAction from '../../components/AiAction.jsx';

const Audit = () => {
  const [audits, setAudits] = useState([]);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    API.get('/audits').then(r => setAudits(r.data.data || [])).catch(() => setAudits([]));
    API.get('/assets').then(r => setAssets(r.data.data || [])).catch(() => setAssets([]));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Audit Cycle</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">✨ AI Audit Summary</h2>
        <p className="text-sm text-gray-500 mb-2">Generate an AI compliance summary across all assets.</p>
        <AiAction
          label="Generate AI Audit Summary"
          endpoint="/ai/audit"
          payload={assets.map(a => ({ id: a.id, name: a.name, status: a.status }))}
          render={(d) => (
            <div className="space-y-1">
              <p><strong>Summary:</strong> {d.summary}</p>
              <p><strong>Risk:</strong> {d.risk}</p>
              <p><strong>Recommendation:</strong> {d.recommendation}</p>
              <p><strong>Priority Assets:</strong> {Array.isArray(d.priorityAssets) ? d.priorityAssets.join(', ') : d.priorityAssets}</p>
            </div>
          )}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Audit Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Title</th><th className="pb-2">Status</th><th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {audits.map(a => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2">{a.title}</td>
                  <td className="py-2">{a.status}</td>
                  <td className="py-2">{a.auditDate ? new Date(a.auditDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Audit;

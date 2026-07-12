import React, { useState, useEffect } from 'react';
import API from '../../api/API.js';
import { useAuth } from '../../context/AuthContext';
import AiAction from '../../components/AiAction.jsx';

const Maintenance = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ assetId: '', description: '', priority: 'Medium' });
  const [msg, setMsg] = useState('');

  const load = () => {
    API.get('/maintenance').then(r => setRequests(r.data.data || [])).catch(() => setRequests([]));
    API.get('/assets').then(r => setAssets(r.data.data || [])).catch(() => setAssets([]));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await API.post('/maintenance', {
        assetId: Number(form.assetId),
        requestedById: user.employeeId,
        description: form.description,
        priority: form.priority
      });
      setMsg('Maintenance request created.');
      setForm({ assetId: '', description: '', priority: 'Medium' });
      load();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Failed to create request');
    }
  };

  const selectedAsset = assets.find(a => String(a.id) === String(form.assetId));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Maintenance</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">New Maintenance Request</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select required className="border rounded px-3 py-2" value={form.assetId} onChange={e => setForm({ ...form, assetId: e.target.value })}>
            <option value="">Select Asset</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
          </select>
          <select className="border rounded px-3 py-2" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
          </select>
          <textarea required placeholder="Describe the issue" className="border rounded px-3 py-2 md:col-span-2" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="md:col-span-2">
            <AiAction
              label="✨ Analyze Issue"
              endpoint="/ai/maintenance"
              payload={{ issue: form.description || 'General issue', asset: selectedAsset?.name || 'Asset' }}
              render={(d) => (
                <div className="space-y-1">
                  <p><strong>Category:</strong> {d.category}</p>
                  <p><strong>Priority:</strong> {d.priority}</p>
                  <p><strong>Cause:</strong> {d.possibleCause}</p>
                  <p><strong>Recommendation:</strong> {d.recommendation}</p>
                </div>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Submit Request</button>
            {msg && <span className="ml-3 text-sm text-green-600">{msg}</span>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Asset</th><th className="pb-2">Issue</th><th className="pb-2">Priority</th><th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(m => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-2">{m.asset?.name}</td>
                  <td className="py-2">{m.description}</td>
                  <td className="py-2">{m.priority}</td>
                  <td className="py-2">{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;

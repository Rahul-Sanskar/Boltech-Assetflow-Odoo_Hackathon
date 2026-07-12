import React, { useState, useEffect } from 'react';
import API from '../../api/API.js';
import { useAuth } from '../../context/AuthContext';
import AiAction from '../../components/AiAction.jsx';

const Booking = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ assetId: '', startTime: '', endTime: '' });
  const [msg, setMsg] = useState('');

  const load = () => {
    API.get('/bookings').then(r => setBookings(r.data.data || [])).catch(() => setBookings([]));
    API.get('/assets?isBookable=true').then(r => setAssets(r.data.data || [])).catch(() => setAssets([]));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await API.post('/bookings', {
        assetId: Number(form.assetId),
        employeeId: user.employeeId,
        startTime: form.startTime,
        endTime: form.endTime
      });
      setMsg('Booking created.');
      setForm({ assetId: '', startTime: '', endTime: '' });
      load();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Failed to book');
    }
  };

  const selectedAsset = assets.find(a => String(a.id) === String(form.assetId));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Resource Booking</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">New Booking</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select required className="border rounded px-3 py-2" value={form.assetId} onChange={e => setForm({ ...form, assetId: e.target.value })}>
            <option value="">Select Resource</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div></div>
          <input required type="datetime-local" className="border rounded px-3 py-2" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          <input required type="datetime-local" className="border rounded px-3 py-2" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
          <div className="md:col-span-2">
            <AiAction
              label="✨ Smart Booking Suggestions"
              endpoint="/ai/booking"
              payload={{
                asset_name: selectedAsset?.name || 'Resource',
                requested_by: user?.name || 'User',
                start_date: form.startTime || '2026-07-15',
                end_date: form.endTime || '2026-07-15'
              }}
              render={(d) => (
                <div className="space-y-1">
                  <p><strong>Available:</strong> {String(d.available)}</p>
                  <p><strong>Conflict:</strong> {String(d.conflict)}</p>
                  <p><strong>Suggestion:</strong> {d.suggestion}</p>
                </div>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Book</button>
            {msg && <span className="ml-3 text-sm text-green-600">{msg}</span>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Resource</th><th className="pb-2">Start</th><th className="pb-2">End</th><th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-2">{b.asset?.name}</td>
                  <td className="py-2">{new Date(b.startTime).toLocaleString()}</td>
                  <td className="py-2">{new Date(b.endTime).toLocaleString()}</td>
                  <td className="py-2">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Booking;

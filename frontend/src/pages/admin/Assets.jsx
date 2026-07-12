import React, { useState, useEffect } from 'react';
import API from '../../api/API.js';
import AiAction from '../../components/AiAction.jsx';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', assetTag: '', serialNumber: '', condition: 'Good',
    location: '', acquisitionCost: '', departmentId: '', categoryId: '', isBookable: false
  });
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    API.get('/assets').then(r => setAssets(r.data.data || [])).catch(() => setAssets([]));
    API.get('/departments').then(r => setDepartments(r.data.data || [])).catch(() => setDepartments([]));
    API.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => setCategories([]));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await API.post('/assets', { ...form, departmentId: Number(form.departmentId), categoryId: Number(form.categoryId), acquisitionCost: Number(form.acquisitionCost) });
      setMsg('Asset registered successfully.');
      setForm({ name: '', assetTag: '', serialNumber: '', condition: 'Good', location: '', acquisitionCost: '', departmentId: '', categoryId: '', isBookable: false });
      load();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Failed to register asset');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Asset Management</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Register Asset</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Name" className="border rounded px-3 py-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="Asset Tag" className="border rounded px-3 py-2" value={form.assetTag} onChange={e => setForm({ ...form, assetTag: e.target.value })} />
          <input placeholder="Serial Number" className="border rounded px-3 py-2" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} />
          <input placeholder="Location" className="border rounded px-3 py-2" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          <input type="number" placeholder="Acquisition Cost" className="border rounded px-3 py-2" value={form.acquisitionCost} onChange={e => setForm({ ...form, acquisitionCost: e.target.value })} />
          <select className="border rounded px-3 py-2" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="border rounded px-3 py-2" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.isBookable} onChange={e => setForm({ ...form, isBookable: e.target.checked })} /> Bookable
          </label>
          <div className="md:col-span-2">
            <AiAction
              label="✨ Generate Description"
              endpoint="/ai/description"
              payload={{ asset_name: form.name, category: categories.find(c => String(c.id) === String(form.categoryId))?.name || 'General', specifications: form.serialNumber }}
              render={(d) => (
                <div className="space-y-1">
                  <p><strong>Description:</strong> {d.description}</p>
                  <p><strong>Tags:</strong> {Array.isArray(d.tags) ? d.tags.join(', ') : d.tags}</p>
                  <p><strong>Maintenance Notes:</strong> {d.maintenanceNotes}</p>
                  <button type="button" className="mt-2 text-blue-600 underline" onClick={() => setDesc(d.description)}>Use this description</button>
                </div>
              )}
            />
            <textarea placeholder="Description (optional)" className="w-full border rounded px-3 py-2 mt-2" rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Register</button>
            {msg && <span className="ml-3 text-sm text-green-600">{msg}</span>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Asset Directory</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Name</th><th className="pb-2">Tag</th><th className="pb-2">Status</th><th className="pb-2">Dept</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2">{a.name}</td>
                  <td className="py-2 text-gray-500">{a.assetTag}</td>
                  <td className="py-2">{a.status}</td>
                  <td className="py-2">{a.department?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Assets;

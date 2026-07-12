import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Trash2 } from 'lucide-react';

const statusBadge = (status) => {
  const map = {
    Available: 'success',
    Allocated: 'warning',
    'Under Maintenance': 'danger',
    Retired: 'default',
  };
  return <Badge variant={map[status] || 'default'}>{status}</Badge>;
};

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', assetTag: '', serialNumber: '', condition: 'Good', location: '', departmentId: '', categoryId: '', acquisitionCost: '' });

  const fetchAssets = () => {
    setLoading(true);
    API.get('/assets')
      .then((res) => setAssets(res.data.data || []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
    API.get('/categories').then((res) => setCategories(res.data.data || [])).catch(() => {});
    API.get('/departments').then((res) => setDepartments(res.data.data || [])).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/assets', {
        ...form,
        departmentId: Number(form.departmentId),
        categoryId: Number(form.categoryId),
        acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : null,
      });
      setShowCreate(false);
      setForm({ name: '', assetTag: '', serialNumber: '', condition: 'Good', location: '', departmentId: '', categoryId: '', acquisitionCost: '' });
      fetchAssets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create asset');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      await API.delete(`/assets/${id}`);
      fetchAssets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const columns = [
    { label: 'Asset', key: 'name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs">
          {row.name?.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{row.assetTag}</p>
        </div>
      </div>
    )},
    { label: 'Category', key: 'category', render: (row) => row.category?.name || '—' },
    { label: 'Department', key: 'department', render: (row) => row.department?.name || '—' },
    { label: 'Condition', key: 'condition' },
    { label: 'Status', key: 'status', render: (row) => statusBadge(row.status) },
    { label: '', key: 'actions', render: (row) => (
      <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    )},
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Assets" subtitle={`${assets.length} total assets`} actionLabel="Add Asset" onAction={() => setShowCreate(true)} />
      <DataTable columns={columns} data={assets} emptyMessage="No assets found. Create your first asset." />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Asset" size="lg">
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Asset Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Asset Tag</label>
            <input required value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Serial Number</label>
            <input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Department</label>
            <select required value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="">Select</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="">Select</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Condition</label>
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Acquisition Cost</label>
            <input type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 active:scale-95">Create Asset</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssetList;

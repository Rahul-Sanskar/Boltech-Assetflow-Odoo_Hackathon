import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const AllocationList = () => {
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ assetId: '', employeeId: '' });

  const fetchAllocations = () => {
    setLoading(true);
    API.get('/allocations')
      .then((res) => setAllocations(res.data.data || []))
      .catch(() => setAllocations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllocations();
    API.get('/assets?status=Available').then((res) => setAssets(res.data.data || [])).catch(() => {});
    API.get('/employees').then((res) => setEmployees(res.data.data || [])).catch(() => {});
  }, []);

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/allocations', { assetId: Number(form.assetId), employeeId: Number(form.employeeId) });
      setShowCreate(false);
      setForm({ assetId: '', employeeId: '' });
      fetchAllocations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to allocate');
    }
  };

  const handleReturn = async (id) => {
    try {
      await API.patch(`/allocations/${id}/return`, {});
      fetchAllocations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return');
    }
  };

  const columns = [
    { label: 'Asset', key: 'asset', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 font-bold text-xs">
          {row.asset?.name?.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{row.asset?.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{row.asset?.assetTag}</p>
        </div>
      </div>
    )},
    { label: 'Assigned To', key: 'employee', render: (row) => row.employee?.name || '—' },
    { label: 'Allocated', key: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { label: 'Returned', key: 'returnedAt', render: (row) => row.returnedAt ? new Date(row.returnedAt).toLocaleDateString() : <Badge variant="warning">Active</Badge> },
    { label: '', key: 'actions', render: (row) => !row.returnedAt && (
      <button onClick={(e) => { e.stopPropagation(); handleReturn(row.id); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
        Return
      </button>
    )},
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Allocations" subtitle={`${allocations.filter(a => !a.returnedAt).length} active allocations`} actionLabel="Allocate Asset" onAction={() => setShowCreate(true)} />
      <DataTable columns={columns} data={allocations} emptyMessage="No allocations found." />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Allocate Asset">
        <form onSubmit={handleAllocate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Asset</label>
            <select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="">Select available asset</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Employee</label>
            <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="">Select employee</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 active:scale-95">Allocate</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AllocationList;

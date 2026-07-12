import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const ManagerAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReturn, setShowReturn] = useState(null);
  const [form, setForm] = useState({ assetId: '', employeeId: '', expectedReturnDate: '' });
  const [returnNotes, setReturnNotes] = useState('');

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
      const payload = {
        assetId: Number(form.assetId),
        employeeId: Number(form.employeeId),
      };
      if (form.expectedReturnDate) {
        payload.expectedReturnDate = form.expectedReturnDate;
      }
      await API.post('/allocations', payload);
      setShowCreate(false);
      setForm({ assetId: '', employeeId: '', expectedReturnDate: '' });
      fetchAllocations();
      API.get('/assets?status=Available').then((res) => setAssets(res.data.data || [])).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to allocate');
    }
  };

  const handleReturn = async () => {
    try {
      await API.patch(`/allocations/${showReturn.id}/return`, { returnNotes });
      setShowReturn(null);
      setReturnNotes('');
      fetchAllocations();
      API.get('/assets?status=Available').then((res) => setAssets(res.data.data || [])).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return');
    }
  };

  const isOverdue = (allocation) => {
    if (allocation.returnedAt || !allocation.expectedReturnDate) return false;
    return new Date(allocation.expectedReturnDate) < new Date();
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
    { label: 'Expected Return', key: 'expectedReturnDate', render: (row) => {
      if (!row.expectedReturnDate) return '—';
      const date = new Date(row.expectedReturnDate).toLocaleDateString();
      if (isOverdue(row)) return <span className="text-red-600 font-semibold">{date} (Overdue)</span>;
      return date;
    }},
    { label: 'Status', key: 'returnedAt', render: (row) => {
      if (row.returnedAt) return <Badge variant="success">Returned</Badge>;
      if (isOverdue(row)) return <Badge variant="danger">Overdue</Badge>;
      return <Badge variant="warning">Active</Badge>;
    }},
    { label: '', key: 'actions', render: (row) => !row.returnedAt && (
      <button onClick={(e) => { e.stopPropagation(); setShowReturn(row); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
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
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Expected Return Date (optional)</label>
            <input type="date" value={form.expectedReturnDate} onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 active:scale-95">Allocate</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showReturn} onClose={() => { setShowReturn(null); setReturnNotes(''); }} title="Return Asset">
        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--bg-surface-hover)] p-4">
            <p className="text-sm font-medium text-[var(--text-main)]">{showReturn?.asset?.name}</p>
            <p className="text-xs text-[var(--text-muted)]">Assigned to: {showReturn?.employee?.name}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Condition Check-in Notes</label>
            <textarea rows={3} value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors resize-none" placeholder="Describe the condition of the returned asset..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowReturn(null); setReturnNotes(''); }} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button onClick={handleReturn} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg active:scale-95">Confirm Return</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerAllocations;

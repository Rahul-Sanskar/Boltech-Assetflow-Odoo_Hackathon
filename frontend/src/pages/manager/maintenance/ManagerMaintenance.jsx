import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const priorityBadge = (p) => {
  const map = { Low: 'info', Medium: 'warning', High: 'danger', Critical: 'danger' };
  return <Badge variant={map[p] || 'default'}>{p}</Badge>;
};

const statusBadge = (s) => {
  const map = { Pending: 'warning', Approved: 'info', 'In Progress': 'purple', Resolved: 'success', Rejected: 'danger' };
  return <Badge variant={map[s] || 'default'}>{s}</Badge>;
};

const ManagerMaintenance = () => {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpdate, setShowUpdate] = useState(null);
  const [form, setForm] = useState({ assetId: '', requestedById: '', description: '', priority: 'Medium' });
  const [updateForm, setUpdateForm] = useState({ status: '', technicianId: '' });

  const fetchRequests = () => {
    setLoading(true);
    API.get('/maintenance')
      .then((res) => setRequests(res.data.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    API.get('/assets').then((res) => setAssets(res.data.data || [])).catch(() => {});
    API.get('/employees').then((res) => setEmployees(res.data.data || [])).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/maintenance', {
        assetId: Number(form.assetId),
        requestedById: Number(form.requestedById),
        description: form.description,
        priority: form.priority,
      });
      setShowCreate(false);
      setForm({ assetId: '', requestedById: '', description: '', priority: 'Medium' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {};
      if (updateForm.status) payload.status = updateForm.status;
      if (updateForm.technicianId) payload.technicianId = Number(updateForm.technicianId);
      await API.patch(`/maintenance/${showUpdate.id}`, payload);
      setShowUpdate(null);
      setUpdateForm({ status: '', technicianId: '' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const openUpdate = (row) => {
    setShowUpdate(row);
    setUpdateForm({ status: row.status, technicianId: row.technicianId || '' });
  };

  const columns = [
    { label: 'Asset', key: 'asset', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-xs">
          {row.asset?.name?.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{row.asset?.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{row.asset?.assetTag}</p>
        </div>
      </div>
    )},
    { label: 'Description', key: 'description', render: (row) => (
      <p className="max-w-[200px] truncate text-sm">{row.description}</p>
    )},
    { label: 'Requested By', key: 'requestedBy', render: (row) => row.requestedBy?.name || '—' },
    { label: 'Technician', key: 'technician', render: (row) => row.technician?.name || '—' },
    { label: 'Priority', key: 'priority', render: (row) => priorityBadge(row.priority) },
    { label: 'Status', key: 'status', render: (row) => statusBadge(row.status) },
    { label: '', key: 'actions', render: (row) => row.status !== 'Resolved' && (
      <button onClick={(e) => { e.stopPropagation(); openUpdate(row); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
        Update
      </button>
    )},
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Maintenance" subtitle={`${requests.filter(r => r.status === 'Pending').length} pending requests`} actionLabel="New Request" onAction={() => setShowCreate(true)} />
      <DataTable columns={columns} data={requests} emptyMessage="No maintenance requests." />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Maintenance Request" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Asset</label>
              <select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
                <option value="">Select asset</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Requested By</label>
              <select required value={form.requestedById} onChange={(e) => setForm({ ...form, requestedById: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
                <option value="">Select employee</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Description</label>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors resize-none" placeholder="Describe the issue..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 active:scale-95">Submit Request</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showUpdate} onClose={() => { setShowUpdate(null); setUpdateForm({ status: '', technicianId: '' }); }} title="Update Maintenance Request">
        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--bg-surface-hover)] p-4">
            <p className="text-sm font-medium text-[var(--text-main)]">{showUpdate?.asset?.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{showUpdate?.description}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Status</label>
            <select value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Assign Technician</label>
            <select value={updateForm.technicianId} onChange={(e) => setUpdateForm({ ...updateForm, technicianId: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="">Select technician</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowUpdate(null); setUpdateForm({ status: '', technicianId: '' }); }} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button onClick={handleUpdate} className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 active:scale-95">Update</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerMaintenance;

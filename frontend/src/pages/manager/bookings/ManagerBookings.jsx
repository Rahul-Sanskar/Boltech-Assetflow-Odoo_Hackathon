import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const statusBadge = (s) => {
  const map = { Upcoming: 'info', Ongoing: 'purple', Completed: 'success', Cancelled: 'default' };
  return <Badge variant={map[s] || 'default'}>{s}</Badge>;
};

const ManagerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ assetId: '', employeeId: '', startTime: '', endTime: '' });

  const fetchBookings = () => {
    setLoading(true);
    API.get('/bookings')
      .then((res) => setBookings(res.data.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
    API.get('/assets').then((res) => {
      const bookable = (res.data.data || []).filter(a => a.isBookable);
      setAssets(bookable);
    }).catch(() => {});
    API.get('/employees').then((res) => setEmployees(res.data.data || [])).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/bookings', {
        assetId: Number(form.assetId),
        employeeId: Number(form.employeeId),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      setShowCreate(false);
      setForm({ assetId: '', employeeId: '', startTime: '', endTime: '' });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await API.patch(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const columns = [
    { label: 'Resource', key: 'asset', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-xs">
          {row.asset?.name?.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{row.asset?.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{row.asset?.assetTag}</p>
        </div>
      </div>
    )},
    { label: 'Booked By', key: 'employee', render: (row) => row.employee?.name || '—' },
    { label: 'Start', key: 'startTime', render: (row) => new Date(row.startTime).toLocaleString() },
    { label: 'End', key: 'endTime', render: (row) => new Date(row.endTime).toLocaleString() },
    { label: 'Status', key: 'status', render: (row) => statusBadge(row.status) },
    { label: '', key: 'actions', render: (row) => (row.status === 'Upcoming' || row.status === 'Ongoing') && (
      <button onClick={(e) => { e.stopPropagation(); handleCancel(row.id); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
        Cancel
      </button>
    )},
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Resource Bookings" subtitle={`${bookings.filter(b => b.status === 'Upcoming').length} upcoming bookings`} actionLabel="Book Resource" onAction={() => setShowCreate(true)} />
      <DataTable columns={columns} data={bookings} emptyMessage="No bookings found." />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Book a Resource" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Resource</label>
              <select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
                <option value="">Select bookable resource</option>
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Start Time</label>
              <input required type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">End Time</label>
              <input required type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 active:scale-95">Book Resource</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerBookings;

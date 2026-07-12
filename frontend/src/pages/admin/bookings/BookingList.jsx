import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ErrorState from '../../../components/ui/ErrorState';
import { FormField, FormSelect, FormInput, SearchInput } from '../../../components/ui/FormField';
import { useToast } from '../../../context/ToastContext';
import { getErrorMessage, statusBadgeVariant } from '../../../utils/apiError';
import { Calendar, Eye } from 'lucide-react';

function toLocalInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) {
    return `${s.toLocaleDateString()} · ${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `${s.toLocaleString()} → ${e.toLocaleString()}`;
}

const BookingList = () => {
  const { success, error: toastError } = useToast();
  const [bookings, setBookings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    assetId: '',
    employeeId: '',
    startTime: '',
    endTime: '',
  });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Upcoming');

  const fetchBookings = useCallback(() => {
    setLoading(true);
    setError(null);
    const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    API.get(`/bookings${query}`)
      .then((res) => setBookings(res.data.data || []))
      .catch((err) => {
        setBookings([]);
        setError(getErrorMessage(err, 'Failed to load bookings'));
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    API.get('/assets')
      .then((res) => setAssets((res.data.data || []).filter((a) => a.isBookable)))
      .catch(() => {});
    API.get('/employees')
      .then((res) => setEmployees(res.data.data || []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.asset?.name?.toLowerCase().includes(q) ||
        b.asset?.assetTag?.toLowerCase().includes(q) ||
        b.employee?.name?.toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const openCreate = () => {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setForm({
      assetId: '',
      employeeId: '',
      startTime: toLocalInputValue(start),
      endTime: toLocalInputValue(end),
    });
    setShowCreate(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.assetId || !form.employeeId || !form.startTime || !form.endTime) {
      toastError('Please fill all required fields');
      return;
    }
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    if (!(start < end)) {
      toastError('End time must be after start time');
      return;
    }
    setSaving(true);
    try {
      await API.post('/bookings', {
        assetId: Number(form.assetId),
        employeeId: Number(form.employeeId),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      success('Booking created');
      setShowCreate(false);
      fetchBookings();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        toastError(getErrorMessage(err, 'Time slot conflicts with an existing booking'));
      } else {
        toastError(getErrorMessage(err, 'Failed to create booking'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setSaving(true);
    try {
      await API.patch(`/bookings/${cancelTarget.id}/cancel`);
      success('Booking cancelled');
      setCancelTarget(null);
      setShowDetails(false);
      fetchBookings();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to cancel booking'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      label: 'When',
      key: 'startTime',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-sm whitespace-normal max-w-[260px]">
              {formatRange(row.startTime, row.endTime)}
            </p>
          </div>
        </div>
      ),
    },
    {
      label: 'Resource',
      key: 'asset',
      render: (row) => (
        <div>
          <p className="font-medium">{row.asset?.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{row.asset?.assetTag}</p>
        </div>
      ),
    },
    { label: 'Employee', key: 'employee', render: (row) => row.employee?.name || '—' },
    {
      label: 'Status',
      key: 'status',
      render: (row) => <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>,
    },
    {
      label: '',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="Details"
            onClick={() => {
              setSelected(row);
              setShowDetails(true);
            }}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'Upcoming' && (
            <button
              type="button"
              onClick={() => setCancelTarget(row)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchBookings} />;

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle={`${filtered.length} booking${filtered.length === 1 ? '' : 's'}`}
        actionLabel="New Booking"
        onAction={openCreate}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search bookings…" />
        <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All statuses</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Cancelled">Cancelled</option>
        </FormSelect>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => {
          setSelected(row);
          setShowDetails(true);
        }}
        emptyMessage="No bookings found."
      />

      <Modal
        isOpen={showCreate}
        onClose={() => !saving && setShowCreate(false)}
        title="Create Booking"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Bookable Asset *">
              <FormSelect
                required
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
              >
                <option value="">Select resource</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.assetTag})
                  </option>
                ))}
              </FormSelect>
              {assets.length === 0 && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  No bookable assets. Mark an asset as bookable first.
                </p>
              )}
            </FormField>
            <FormField label="Employee *">
              <FormSelect
                required
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>
            <FormField label="Start *">
              <FormInput
                required
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </FormField>
            <FormField label="End *">
              <FormInput
                required
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </FormField>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Adjacent slots are allowed (e.g. 09:00–10:00 and 10:00–11:00). Overlaps return 409.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || assets.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Booking'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title="Booking Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-main)]">{selected.asset?.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{selected.asset?.assetTag}</p>
              </div>
              <Badge variant={statusBadgeVariant(selected.status)}>{selected.status}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Employee</p>
                <p className="font-medium">{selected.employee?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Created</p>
                <p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-[var(--text-muted)]">Schedule</p>
                <p className="font-medium">{formatRange(selected.startTime, selected.endTime)}</p>
              </div>
            </div>
            {selected.status === 'Upcoming' && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCancelTarget(selected)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
                >
                  Cancel Booking
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel booking"
        message={`Cancel booking of "${cancelTarget?.asset?.name}" for ${cancelTarget?.employee?.name}?`}
        confirmLabel="Cancel Booking"
        loading={saving}
      />
    </div>
  );
};

export default BookingList;

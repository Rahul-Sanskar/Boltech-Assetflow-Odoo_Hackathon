import React, { useState, useEffect, useMemo } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ErrorState from '../../../components/ui/ErrorState';
import { FormField, FormSelect, FormTextarea, SearchInput } from '../../../components/ui/FormField';
import { useToast } from '../../../context/ToastContext';
import { getErrorMessage, statusBadgeVariant } from '../../../utils/apiError';
import { Check, X, Wrench } from 'lucide-react';

const MaintenanceList = () => {
  const { success, error: toastError } = useToast();
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    assetId: '',
    requestedById: '',
    description: '',
    priority: 'Medium',
  });
  const [actionTarget, setActionTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = () => {
    setLoading(true);
    setError(null);
    API.get('/maintenance')
      .then((res) => setRequests(res.data.data || []))
      .catch((err) => {
        setRequests([]);
        setError(getErrorMessage(err, 'Failed to load maintenance requests'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    API.get('/assets').then((res) => setAssets(res.data.data || [])).catch(() => {});
    API.get('/employees').then((res) => setEmployees(res.data.data || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let rows = [...requests];
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.asset?.name?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.requestedBy?.name?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [requests, search, statusFilter]);

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post('/maintenance', {
        assetId: Number(form.assetId),
        requestedById: Number(form.requestedById),
        description: form.description.trim(),
        priority: form.priority,
      });
      success('Maintenance request created');
      setShowCreate(false);
      setForm({ assetId: '', requestedById: '', description: '', priority: 'Medium' });
      fetchRequests();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to create request'));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async () => {
    if (!actionTarget) return;
    const { row, status } = actionTarget;
    setSaving(true);
    try {
      await API.patch(`/maintenance/${row.id}`, { status });
      success(`Request ${status.toLowerCase()}`);
      setActionTarget(null);
      setShowDetails(false);
      fetchRequests();
    } catch (err) {
      toastError(getErrorMessage(err, `Failed to ${status.toLowerCase()} request`));
    } finally {
      setSaving(false);
    }
  };

  const actionLabel = {
    Approved: 'Approve',
    Rejected: 'Reject',
    Resolved: 'Resolve',
  };

  const columns = [
    {
      label: 'Asset',
      key: 'asset',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-xs">
            {row.asset?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{row.asset?.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.asset?.assetTag}</p>
          </div>
        </div>
      ),
    },
    {
      label: 'Description',
      key: 'description',
      render: (row) => <p className="max-w-[200px] truncate text-sm">{row.description}</p>,
    },
    { label: 'Requested By', key: 'requestedBy', render: (row) => row.requestedBy?.name || '—' },
    {
      label: 'Priority',
      key: 'priority',
      render: (row) => (
        <Badge variant={row.priority === 'High' || row.priority === 'Critical' ? 'danger' : row.priority === 'Medium' ? 'warning' : 'info'}>
          {row.priority}
        </Badge>
      ),
    },
    {
      label: 'Status',
      key: 'status',
      render: (row) => <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>,
    },
    {
      label: 'Date',
      key: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      label: '',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {row.status === 'Pending' && (
            <>
              <button
                type="button"
                title="Approve"
                onClick={() => setActionTarget({ row, status: 'Approved' })}
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Reject"
                onClick={() => setActionTarget({ row, status: 'Rejected' })}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          {(row.status === 'Approved' || row.status === 'In Progress') && (
            <button
              type="button"
              title="Resolve"
              onClick={() => setActionTarget({ row, status: 'Resolved' })}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300"
            >
              Resolve
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchRequests} />;

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle={`${pendingCount} pending · ${requests.length} total`}
        actionLabel="New Request"
        onAction={() => setShowCreate(true)}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search requests…" />
        <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All statuses</option>
          {['Pending', 'Approved', 'In Progress', 'Resolved', 'Rejected'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FormSelect>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => {
          setSelected(row);
          setShowDetails(true);
        }}
        emptyMessage="No maintenance requests."
      />

      <Modal
        isOpen={showCreate}
        onClose={() => !saving && setShowCreate(false)}
        title="New Maintenance Request"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Asset *">
              <FormSelect
                required
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
              >
                <option value="">Select asset</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>
            <FormField label="Requested By *">
              <FormSelect
                required
                value={form.requestedById}
                onChange={(e) => setForm({ ...form, requestedById: e.target.value })}
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          </div>
          <FormField label="Priority">
            <FormSelect value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Description *">
            <FormTextarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the issue…"
            />
          </FormField>
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
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title="Maintenance Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-main)]">{selected.asset?.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{selected.asset?.assetTag}</p>
                </div>
              </div>
              <Badge variant={statusBadgeVariant(selected.status)}>{selected.status}</Badge>
            </div>

            <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap">{selected.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Requested by</p>
                <p className="font-medium">{selected.requestedBy?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Priority</p>
                <p className="font-medium">{selected.priority}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Created</p>
                <p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Resolved</p>
                <p className="font-medium">
                  {selected.resolvedDate ? new Date(selected.resolvedDate).toLocaleString() : '—'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                Timeline
              </p>
              <ol className="space-y-3 border-l border-[var(--border-light)] pl-4">
                <li className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />
                  <p className="text-sm font-medium">Created · Pending</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </li>
                {['Approved', 'In Progress', 'Resolved', 'Rejected'].includes(selected.status) &&
                  selected.status !== 'Pending' && (
                    <li className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <p className="text-sm font-medium">Status · {selected.status}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {selected.resolvedDate
                          ? new Date(selected.resolvedDate).toLocaleString()
                          : 'Updated'}
                      </p>
                    </li>
                  )}
              </ol>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {selected.status === 'Pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => setActionTarget({ row: selected, status: 'Rejected' })}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionTarget({ row: selected, status: 'Approved' })}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                </>
              )}
              {(selected.status === 'Approved' || selected.status === 'In Progress') && (
                <button
                  type="button"
                  onClick={() => setActionTarget({ row: selected, status: 'Resolved' })}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--brand-primary)] text-white"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={runAction}
        title={`${actionLabel[actionTarget?.status] || 'Update'} request`}
        message={`Set maintenance request for "${actionTarget?.row?.asset?.name}" to ${actionTarget?.status}?`}
        confirmLabel={actionLabel[actionTarget?.status] || 'Confirm'}
        variant={actionTarget?.status === 'Rejected' ? 'danger' : actionTarget?.status === 'Resolved' ? 'success' : 'primary'}
        loading={saving}
      />
    </div>
  );
};

export default MaintenanceList;

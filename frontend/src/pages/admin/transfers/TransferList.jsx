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
import { Check, X, ArrowLeftRight, Eye } from 'lucide-react';

const TransferList = () => {
  const { success, error: toastError } = useToast();
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ assetId: '', requestedById: '' });
  const [actionTarget, setActionTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const holderByAssetId = useMemo(() => {
    const map = {};
    assets.forEach((a) => {
      map[a.id] = a.employee?.name || null;
    });
    return map;
  }, [assets]);

  const fetchTransfers = () => {
    setLoading(true);
    setError(null);
    API.get('/transfers')
      .then((res) => setTransfers(res.data.data || []))
      .catch((err) => {
        setTransfers([]);
        setError(getErrorMessage(err, 'Failed to load transfers'));
      })
      .finally(() => setLoading(false));
  };

  const refreshLookups = () => {
    API.get('/assets')
      .then((res) => setAssets(res.data.data || []))
      .catch(() => {});
    API.get('/employees')
      .then((res) => setEmployees(res.data.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchTransfers();
    refreshLookups();
  }, []);

  const allocatedAssets = useMemo(
    () => assets.filter((a) => a.status === 'Allocated' || a.status === 'Under Maintenance'),
    [assets]
  );

  const filtered = useMemo(() => {
    let rows = [...transfers];
    if (statusFilter) rows = rows.filter((t) => t.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (t) =>
          t.asset?.name?.toLowerCase().includes(q) ||
          t.asset?.assetTag?.toLowerCase().includes(q) ||
          t.requestedBy?.name?.toLowerCase().includes(q) ||
          holderByAssetId[t.assetId]?.toLowerCase().includes(q)
      );
    }
    return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [transfers, search, statusFilter, holderByAssetId]);

  const openDetails = async (row) => {
    setSelected(row);
    setShowDetails(true);
    try {
      const res = await API.get(`/transfers/${row.id}`);
      const detail = res.data.data;
      setSelected(detail);
      // Enrich holder from assets cache if needed
      if (detail?.assetId && !detail.asset?.employee) {
        const holder = holderByAssetId[detail.assetId];
        if (holder) {
          setSelected({
            ...detail,
            _currentHolderName: holder,
          });
        }
      }
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to load transfer details'));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.assetId || !form.requestedById) {
      toastError('Select an asset and requester');
      return;
    }
    setSaving(true);
    try {
      await API.post('/transfers', {
        assetId: Number(form.assetId),
        requestedById: Number(form.requestedById),
      });
      success('Transfer request created');
      setShowCreate(false);
      setForm({ assetId: '', requestedById: '' });
      fetchTransfers();
      refreshLookups();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to create transfer'));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async () => {
    if (!actionTarget) return;
    const { row, action } = actionTarget;
    setSaving(true);
    try {
      if (action === 'approve') {
        await API.patch(`/transfers/${row.id}/approve`);
        success('Transfer approved');
      } else {
        await API.patch(`/transfers/${row.id}/reject`, {
          rejectedReason: rejectReason.trim() || null,
        });
        success('Transfer rejected');
      }
      setActionTarget(null);
      setRejectReason('');
      setShowDetails(false);
      fetchTransfers();
      refreshLookups();
    } catch (err) {
      toastError(getErrorMessage(err, `Failed to ${action} transfer`));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      label: 'Asset',
      key: 'asset',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium">{row.asset?.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.asset?.assetTag}</p>
          </div>
        </div>
      ),
    },
    {
      label: 'Current Holder',
      key: 'holder',
      render: (row) => holderByAssetId[row.assetId] || (row.status === 'Requested' ? '—' : '—'),
    },
    {
      label: 'Requested By',
      key: 'requestedBy',
      render: (row) => row.requestedBy?.name || '—',
    },
    {
      label: 'Requested',
      key: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
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
            onClick={() => openDetails(row)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'Requested' && (
            <>
              <button
                type="button"
                title="Approve"
                onClick={() => setActionTarget({ row, action: 'approve' })}
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Reject"
                onClick={() => {
                  setRejectReason('');
                  setActionTarget({ row, action: 'reject' });
                }}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchTransfers} />;

  const detail = selected;
  const currentHolder =
    detail?._currentHolderName ||
    detail?.asset?.employee?.name ||
    holderByAssetId[detail?.assetId] ||
    '—';

  return (
    <div>
      <PageHeader
        title="Transfers"
        subtitle={`${transfers.filter((t) => t.status === 'Requested').length} pending · ${transfers.length} total`}
        actionLabel="New Transfer"
        onAction={() => {
          refreshLookups();
          setShowCreate(true);
        }}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search transfers…" />
        <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All statuses</option>
          {['Requested', 'Approved', 'Rejected'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FormSelect>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={openDetails}
        emptyMessage="No transfer requests found."
      />

      <Modal
        isOpen={showCreate}
        onClose={() => !saving && setShowCreate(false)}
        title="Create Transfer Request"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Allocated Asset *">
            <FormSelect
              required
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
            >
              <option value="">Select asset</option>
              {allocatedAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.assetTag}){a.employee?.name ? ` — held by ${a.employee.name}` : ''}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="New Holder (Requester) *">
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
              {saving ? 'Submitting…' : 'Create Request'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title="Transfer Details" size="lg">
        {detail && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-main)]">{detail.asset?.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{detail.asset?.assetTag}</p>
              </div>
              <Badge variant={statusBadgeVariant(detail.status)}>{detail.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Current / prior holder</p>
                <p className="font-medium">{currentHolder}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Requested holder</p>
                <p className="font-medium">{detail.requestedBy?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Requested date</p>
                <p className="font-medium">{new Date(detail.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Approved date</p>
                <p className="font-medium">
                  {detail.approvedDate ? new Date(detail.approvedDate).toLocaleString() : '—'}
                </p>
              </div>
              {detail.rejectedReason && (
                <div className="col-span-2">
                  <p className="text-xs text-[var(--text-muted)]">Rejection reason</p>
                  <p className="font-medium">{detail.rejectedReason}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                Timeline
              </p>
              <ol className="space-y-3 border-l border-[var(--border-light)] pl-4">
                <li className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />
                  <p className="text-sm font-medium">Requested</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(detail.createdAt).toLocaleString()} · by {detail.requestedBy?.name}
                  </p>
                </li>
                {detail.status === 'Approved' && (
                  <li className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <p className="text-sm font-medium">Approved · ownership transferred</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {detail.approvedDate
                        ? new Date(detail.approvedDate).toLocaleString()
                        : 'Completed'}
                    </p>
                  </li>
                )}
                {detail.status === 'Rejected' && (
                  <li className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                    <p className="text-sm font-medium">Rejected</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {detail.rejectedReason || 'No reason provided'}
                    </p>
                  </li>
                )}
                {detail.status === 'Requested' && (
                  <li className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <p className="text-sm font-medium">Awaiting approval</p>
                    <p className="text-xs text-[var(--text-muted)]">Manager or admin action required</p>
                  </li>
                )}
              </ol>
            </div>

            {detail.status === 'Requested' && (
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectReason('');
                    setActionTarget({ row: detail, action: 'reject' });
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setActionTarget({ row: detail, action: 'approve' })}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={actionTarget?.action === 'reject'}
        onClose={() => !saving && setActionTarget(null)}
        title="Reject Transfer"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Reject transfer of &quot;{actionTarget?.row?.asset?.name}&quot;?
          </p>
          <FormField label="Reason (optional)">
            <FormTextarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this transfer rejected?"
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => setActionTarget(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={runAction}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={actionTarget?.action === 'approve'}
        onClose={() => setActionTarget(null)}
        onConfirm={runAction}
        title="Approve transfer"
        message={`Approve transfer of "${actionTarget?.row?.asset?.name}" to ${actionTarget?.row?.requestedBy?.name}? This closes the current allocation and creates a new one.`}
        confirmLabel="Approve"
        variant="success"
        loading={saving}
      />
    </div>
  );
};

export default TransferList;

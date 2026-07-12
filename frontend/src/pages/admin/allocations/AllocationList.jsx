import React, { useState, useEffect, useMemo } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ErrorState from '../../../components/ui/ErrorState';
import { FormField, FormSelect, SearchInput } from '../../../components/ui/FormField';
import { useToast } from '../../../context/ToastContext';
import { getErrorMessage, isActiveAllocation } from '../../../utils/apiError';

const AllocationList = () => {
  const { success, error: toastError } = useToast();
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ assetId: '', employeeId: '' });
  const [returnTarget, setReturnTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Allocated');

  const fetchAllocations = () => {
    setLoading(true);
    setError(null);
    API.get('/allocations')
      .then((res) => setAllocations(res.data.data || []))
      .catch((err) => {
        setAllocations([]);
        setError(getErrorMessage(err, 'Failed to load allocations'));
      })
      .finally(() => setLoading(false));
  };

  const refreshLookups = () => {
    API.get('/assets?status=Available').then((res) => setAssets(res.data.data || [])).catch(() => {});
    API.get('/employees').then((res) => setEmployees(res.data.data || [])).catch(() => {});
  };

  useEffect(() => {
    fetchAllocations();
    refreshLookups();
  }, []);

  const filtered = useMemo(() => {
    let rows = [...allocations];
    if (statusFilter === 'Allocated') rows = rows.filter(isActiveAllocation);
    if (statusFilter === 'Returned') rows = rows.filter((a) => !isActiveAllocation(a));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (a) =>
          a.asset?.name?.toLowerCase().includes(q) ||
          a.asset?.assetTag?.toLowerCase().includes(q) ||
          a.employee?.name?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [allocations, search, statusFilter]);

  const activeCount = allocations.filter(isActiveAllocation).length;

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!form.assetId || !form.employeeId) {
      toastError('Select an asset and employee');
      return;
    }
    setSaving(true);
    try {
      await API.post('/allocations', {
        assetId: Number(form.assetId),
        employeeId: Number(form.employeeId),
      });
      success('Asset allocated');
      setShowCreate(false);
      setForm({ assetId: '', employeeId: '' });
      fetchAllocations();
      refreshLookups();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to allocate'));
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async () => {
    if (!returnTarget) return;
    setSaving(true);
    try {
      await API.patch(`/allocations/${returnTarget.id}/return`, {});
      success('Asset returned');
      setReturnTarget(null);
      fetchAllocations();
      refreshLookups();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to return asset'));
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
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 font-bold text-xs">
            {row.asset?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{row.asset?.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.asset?.assetTag}</p>
          </div>
        </div>
      ),
    },
    { label: 'Assigned To', key: 'employee', render: (row) => row.employee?.name || '—' },
    {
      label: 'Allocated',
      key: 'allocatedDate',
      render: (row) => new Date(row.allocatedDate || row.createdAt).toLocaleDateString(),
    },
    {
      label: 'Status',
      key: 'status',
      render: (row) =>
        isActiveAllocation(row) ? (
          <Badge variant="warning">Active</Badge>
        ) : (
          <Badge variant="success">Returned</Badge>
        ),
    },
    {
      label: 'Returned',
      key: 'returnedDate',
      render: (row) =>
        row.returnedDate ? new Date(row.returnedDate).toLocaleDateString() : '—',
    },
    {
      label: '',
      key: 'actions',
      render: (row) =>
        isActiveAllocation(row) ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setReturnTarget(row);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25 transition-colors"
          >
            Return
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface-hover)] text-[var(--text-muted)] opacity-60 cursor-not-allowed"
          >
            Returned
          </button>
        ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchAllocations} />;

  return (
    <div>
      <PageHeader
        title="Allocations"
        subtitle={`${activeCount} active · ${allocations.length} total`}
        actionLabel="Allocate Asset"
        onAction={() => {
          refreshLookups();
          setShowCreate(true);
        }}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search allocations…" />
        <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[150px]">
          <option value="Allocated">Active</option>
          <option value="Returned">Returned</option>
          <option value="">All history</option>
        </FormSelect>
      </PageHeader>

      <DataTable columns={columns} data={filtered} emptyMessage="No allocations found." />

      <Modal isOpen={showCreate} onClose={() => !saving && setShowCreate(false)} title="Allocate Asset">
        <form onSubmit={handleAllocate} className="space-y-4">
          <FormField label="Available Asset *">
            <FormSelect
              required
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
            >
              <option value="">Select available asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.assetTag})
                </option>
              ))}
            </FormSelect>
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
              {saving ? 'Allocating…' : 'Allocate'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        onConfirm={handleReturn}
        title="Return asset"
        message={`Mark "${returnTarget?.asset?.name}" as returned from ${returnTarget?.employee?.name}?`}
        confirmLabel="Return"
        variant="success"
        loading={saving}
      />
    </div>
  );
};

export default AllocationList;

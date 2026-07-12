import React, { useCallback, useEffect, useMemo, useState } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorState from '../../../components/ui/ErrorState';
import { FormField, FormInput, FormSelect, FormTextarea, SearchInput } from '../../../components/ui/FormField';
import { useToast } from '../../../context/ToastContext';
import { getErrorMessage, statusBadgeVariant } from '../../../utils/apiError';
import { ClipboardCheck, Eye, UserPlus, PackagePlus } from 'lucide-react';

const AuditList = () => {
  const { success, error: toastError } = useToast();
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    scope: 'Department',
    departmentId: '',
    location: '',
    startDate: '',
    endDate: '',
  });
  const [assignForm, setAssignForm] = useState({ auditorId: '' });
  const [itemForm, setItemForm] = useState({ assetId: '', result: '', notes: '' });

  const fetchCycles = useCallback(() => {
    setLoading(true);
    setError(null);
    API.get('/audits')
      .then((res) => setCycles(res.data.data || []))
      .catch((err) => {
        setCycles([]);
        setError(getErrorMessage(err, 'Failed to load audits'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCycles();
    API.get('/departments').then((res) => setDepartments(res.data.data || [])).catch(() => {});
    API.get('/users').then((res) => setUsers(res.data.data || [])).catch(() => {});
    API.get('/assets').then((res) => setAssets(res.data.data || [])).catch(() => {});
  }, [fetchCycles]);

  const filtered = useMemo(() => {
    let rows = [...cycles];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.scope?.toLowerCase().includes(q) ||
          c.department?.name?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) rows = rows.filter((c) => c.status === statusFilter);
    return rows;
  }, [cycles, search, statusFilter]);

  const openDetail = async (row) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await API.get(`/audits/${row.id}`);
      setDetail(res.data.data);
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to load audit details'));
    } finally {
      setDetailLoading(false);
    }
  };

  const discrepancy = useMemo(() => {
    if (!detail?.items) return { found: 0, missing: 0, damaged: 0, pending: 0 };
    return detail.items.reduce(
      (acc, item) => {
        const r = (item.result || '').toLowerCase();
        if (!item.result) acc.pending += 1;
        else if (r === 'missing') acc.missing += 1;
        else if (r === 'damaged') acc.damaged += 1;
        else acc.found += 1;
        return acc;
      },
      { found: 0, missing: 0, damaged: 0, pending: 0 }
    );
  }, [detail]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.scope.trim() || !form.startDate || !form.endDate) {
      toastError('Name, scope, start and end dates are required');
      return;
    }
    setSaving(true);
    try {
      await API.post('/audits', {
        name: form.name.trim(),
        scope: form.scope.trim(),
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        location: form.location.trim() || null,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      success('Audit cycle created');
      setShowCreate(false);
      setForm({ name: '', scope: 'Department', departmentId: '', location: '', startDate: '', endDate: '' });
      fetchCycles();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to create audit'));
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (status) => {
    if (!detail) return;
    setSaving(true);
    try {
      await API.patch(`/audits/${detail.id}`, { status });
      success(`Audit marked ${status}`);
      const res = await API.get(`/audits/${detail.id}`);
      setDetail(res.data.data);
      fetchCycles();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to update status'));
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!detail || !assignForm.auditorId) return;
    setSaving(true);
    try {
      await API.post(`/audits/${detail.id}/assign`, { auditorId: Number(assignForm.auditorId) });
      success('Auditor assigned');
      setShowAssign(false);
      setAssignForm({ auditorId: '' });
      const res = await API.get(`/audits/${detail.id}`);
      setDetail(res.data.data);
      fetchCycles();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to assign auditor'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!detail || !itemForm.assetId) return;
    setSaving(true);
    try {
      await API.post(`/audits/${detail.id}/items`, {
        assetId: Number(itemForm.assetId),
        result: itemForm.result || null,
        notes: itemForm.notes || null,
      });
      success('Audit item added');
      setShowAddItem(false);
      setItemForm({ assetId: '', result: '', notes: '' });
      const res = await API.get(`/audits/${detail.id}`);
      setDetail(res.data.data);
      fetchCycles();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to add item'));
    } finally {
      setSaving(false);
    }
  };

  const updateItemResult = async (item, result) => {
    if (!detail) return;
    try {
      await API.patch(`/audits/${detail.id}/items/${item.id}`, { result });
      success('Item updated');
      const res = await API.get(`/audits/${detail.id}`);
      setDetail(res.data.data);
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to update item'));
    }
  };

  const columns = [
    {
      label: 'Audit',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.scope}</p>
          </div>
        </div>
      ),
    },
    {
      label: 'Department',
      key: 'department',
      render: (row) => row.department?.name || 'Organization-wide',
    },
    {
      label: 'Status',
      key: 'status',
      render: (row) => <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>,
    },
    {
      label: 'Assigned',
      key: 'assignments',
      render: (row) =>
        row.assignments?.length
          ? row.assignments.map((a) => a.auditor?.name).filter(Boolean).join(', ')
          : '—',
    },
    {
      label: 'Items',
      key: 'items',
      render: (row) => row._count?.items ?? 0,
    },
    {
      label: 'Period',
      key: 'dates',
      render: (row) =>
        `${new Date(row.startDate).toLocaleDateString()} – ${new Date(row.endDate).toLocaleDateString()}`,
    },
    {
      label: '',
      key: 'actions',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openDetail(row);
          }}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchCycles} />;

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <PageHeader
        title="Audits"
        subtitle="Physical verification cycles and discrepancy tracking"
        actionLabel="New Audit"
        onAction={() => setShowCreate(true)}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search audits…" className="max-w-sm flex-1" />
        <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </FormSelect>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No audit cycles found." onRowClick={openDetail} />

      {(detail || detailLoading) && (
        <Modal
          isOpen
          onClose={() => {
            setDetail(null);
            setShowAssign(false);
            setShowAddItem(false);
          }}
          title={detail?.name || 'Audit Details'}
          size="xl"
        >
          {detailLoading || !detail ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadgeVariant(detail.status)}>{detail.status}</Badge>
                <span className="text-sm text-[var(--text-muted)]">
                  {detail.department?.name || 'Organization-wide'}
                  {detail.location ? ` · ${detail.location}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Found / OK', value: discrepancy.found, variant: 'success' },
                  { label: 'Missing', value: discrepancy.missing, variant: 'danger' },
                  { label: 'Damaged', value: discrepancy.damaged, variant: 'warning' },
                  { label: 'Pending', value: discrepancy.pending, variant: 'info' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-[var(--border-light)] p-3">
                    <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                    <p className="text-xl font-bold text-[var(--text-main)] mt-1">{s.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2">Timeline</h3>
                <ol className="relative border-l border-[var(--border-light)] ml-2 space-y-4">
                  <li className="ml-4">
                    <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-[var(--brand-primary)]" />
                    <p className="text-sm font-medium text-[var(--text-main)]">Created</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(detail.createdAt).toLocaleString()}</p>
                  </li>
                  <li className="ml-4">
                    <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-blue-500" />
                    <p className="text-sm font-medium text-[var(--text-main)]">Start</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(detail.startDate).toLocaleString()}</p>
                  </li>
                  <li className="ml-4">
                    <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-amber-500" />
                    <p className="text-sm font-medium text-[var(--text-main)]">End</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(detail.endDate).toLocaleString()}</p>
                  </li>
                  {detail.status === 'Closed' && (
                    <li className="ml-4">
                      <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-emerald-500" />
                      <p className="text-sm font-medium text-[var(--text-main)]">Closed</p>
                      <p className="text-xs text-[var(--text-muted)]">{new Date(detail.updatedAt).toLocaleString()}</p>
                    </li>
                  )}
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--text-main)]">Assigned auditors</h3>
                  {detail.status === 'Open' && (
                    <button
                      type="button"
                      onClick={() => setShowAssign(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Assign
                    </button>
                  )}
                </div>
                {detail.assignments?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {detail.assignments.map((a) => (
                      <Badge key={a.id} variant="info">
                        {a.auditor?.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">No auditors assigned</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--text-main)]">Audit lines</h3>
                  {detail.status === 'Open' && (
                    <button
                      type="button"
                      onClick={() => setShowAddItem(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]"
                    >
                      <PackagePlus className="w-3.5 h-3.5" /> Add item
                    </button>
                  )}
                </div>
                <div className="rounded-xl border border-[var(--border-light)] divide-y divide-[var(--border-light)] max-h-64 overflow-y-auto">
                  {(detail.items || []).length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">No items yet</p>
                  ) : (
                    detail.items.map((item) => (
                      <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-main)] truncate">{item.asset?.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{item.asset?.assetTag}</p>
                          {item.notes && <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.notes}</p>}
                        </div>
                        {detail.status === 'Open' ? (
                          <FormSelect
                            value={item.result || ''}
                            onChange={(e) => updateItemResult(item, e.target.value)}
                            className="max-w-[140px]"
                          >
                            <option value="">Pending</option>
                            <option value="Found">Found</option>
                            <option value="Missing">Missing</option>
                            <option value="Damaged">Damaged</option>
                          </FormSelect>
                        ) : (
                          <Badge variant={statusBadgeVariant(item.result || 'Pending')}>{item.result || 'Pending'}</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {detail.status === 'Open' && (
                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-light)]">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => updateStatus('Closed')}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Close audit
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      <Modal isOpen={showCreate} onClose={() => !saving && setShowCreate(false)} title="Create Audit Cycle">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Name">
            <FormInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Scope">
            <FormSelect value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
              <option value="Department">Department</option>
              <option value="Location">Location</option>
              <option value="Organization">Organization</option>
            </FormSelect>
          </FormField>
          <FormField label="Department (optional)">
            <FormSelect value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Organization-wide</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Location">
            <FormInput value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start date">
              <FormInput type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </FormField>
            <FormField label="End date">
              <FormInput type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-muted)]">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--brand-primary)] disabled:opacity-50">
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAssign} onClose={() => !saving && setShowAssign(false)} title="Assign Auditor" size="sm">
        <form onSubmit={handleAssign} className="space-y-4">
          <FormField label="Auditor">
            <FormSelect value={assignForm.auditorId} onChange={(e) => setAssignForm({ auditorId: e.target.value })} required>
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </FormSelect>
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAssign(false)} className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-muted)]">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--brand-primary)] disabled:opacity-50">
              Assign
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAddItem} onClose={() => !saving && setShowAddItem(false)} title="Add Audit Item">
        <form onSubmit={handleAddItem} className="space-y-4">
          <FormField label="Asset">
            <FormSelect value={itemForm.assetId} onChange={(e) => setItemForm({ ...itemForm, assetId: e.target.value })} required>
              <option value="">Select asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.assetTag})
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Result">
            <FormSelect value={itemForm.result} onChange={(e) => setItemForm({ ...itemForm, result: e.target.value })}>
              <option value="">Pending</option>
              <option value="Found">Found</option>
              <option value="Missing">Missing</option>
              <option value="Damaged">Damaged</option>
            </FormSelect>
          </FormField>
          <FormField label="Notes">
            <FormTextarea rows={3} value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddItem(false)} className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-muted)]">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--brand-primary)] disabled:opacity-50">
              Add
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AuditList;

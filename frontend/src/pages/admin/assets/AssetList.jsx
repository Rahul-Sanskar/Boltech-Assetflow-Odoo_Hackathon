import React, { useState, useEffect, useMemo } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ErrorState from '../../../components/ui/ErrorState';
import { FormField, FormInput, FormSelect, SearchInput } from '../../../components/ui/FormField';
import { useToast } from '../../../context/ToastContext';
import { getErrorMessage, statusBadgeVariant } from '../../../utils/apiError';
import { Trash2, Pencil, Eye } from 'lucide-react';

const emptyForm = {
  name: '',
  assetTag: '',
  serialNumber: '',
  condition: 'Good',
  location: '',
  departmentId: '',
  categoryId: '',
  acquisitionCost: '',
  status: 'Available',
  isBookable: false,
};

const AssetList = () => {
  const { success, error: toastError } = useToast();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [sortKey, setSortKey] = useState('name');

  const fetchAssets = () => {
    setLoading(true);
    setError(null);
    API.get('/assets')
      .then((res) => setAssets(res.data.data || []))
      .catch((err) => {
        setAssets([]);
        setError(getErrorMessage(err, 'Failed to load assets'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
    API.get('/categories').then((res) => setCategories(res.data.data || [])).catch(() => {});
    API.get('/departments').then((res) => setDepartments(res.data.data || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let rows = [...assets];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.assetTag?.toLowerCase().includes(q) ||
          a.serialNumber?.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) rows = rows.filter((a) => a.status === statusFilter);
    if (deptFilter) rows = rows.filter((a) => String(a.departmentId) === String(deptFilter));
    rows.sort((a, b) => {
      const av = (a[sortKey] || '').toString().toLowerCase();
      const bv = (b[sortKey] || '').toString().toLowerCase();
      return av.localeCompare(bv);
    });
    return rows;
  }, [assets, search, statusFilter, deptFilter, sortKey]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      assetTag: row.assetTag || '',
      serialNumber: row.serialNumber || '',
      condition: row.condition || 'Good',
      location: row.location || '',
      departmentId: row.departmentId || '',
      categoryId: row.categoryId || '',
      acquisitionCost: row.acquisitionCost ?? '',
      status: row.status || 'Available',
      isBookable: !!row.isBookable,
    });
    setShowForm(true);
  };

  const openDetails = (row) => {
    setSelected(row);
    setShowDetails(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.assetTag.trim() || !form.departmentId || !form.categoryId) {
      toastError('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await API.patch(`/assets/${editing.id}`, {
          name: form.name.trim(),
          condition: form.condition,
          location: form.location || null,
          departmentId: Number(form.departmentId),
          categoryId: Number(form.categoryId),
          isBookable: form.isBookable,
          ...(form.status && form.status !== editing.status ? { status: form.status } : {}),
        });
        success('Asset updated');
      } else {
        await API.post('/assets', {
          name: form.name.trim(),
          assetTag: form.assetTag.trim(),
          serialNumber: form.serialNumber || null,
          condition: form.condition,
          location: form.location || null,
          departmentId: Number(form.departmentId),
          categoryId: Number(form.categoryId),
          acquisitionCost: form.acquisitionCost !== '' ? Number(form.acquisitionCost) : null,
          isBookable: form.isBookable,
        });
        success('Asset created');
      }
      setShowForm(false);
      fetchAssets();
    } catch (err) {
      toastError(getErrorMessage(err, editing ? 'Failed to update asset' : 'Failed to create asset'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await API.delete(`/assets/${deleteTarget.id}`);
      success('Asset deleted');
      setDeleteTarget(null);
      fetchAssets();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to delete asset'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      label: 'Asset',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs">
            {row.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.assetTag}</p>
          </div>
        </div>
      ),
    },
    { label: 'Category', key: 'category', render: (row) => row.category?.name || '—' },
    { label: 'Department', key: 'department', render: (row) => row.department?.name || '—' },
    {
      label: 'Condition',
      key: 'condition',
      render: (row) => <Badge variant={statusBadgeVariant(row.condition)}>{row.condition}</Badge>,
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
            onClick={() => openDetails(row)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-colors"
            title="Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchAssets} />;

  return (
    <div>
      <PageHeader
        title="Assets"
        subtitle={`${filtered.length} of ${assets.length} assets`}
        actionLabel="Add Asset"
        onAction={openCreate}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search assets…" />
        <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All statuses</option>
          {['Available', 'Allocated', 'Under Maintenance', 'Reserved', 'Retired', 'Lost', 'Disposed'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FormSelect>
        <FormSelect value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </FormSelect>
        <FormSelect value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="max-w-[140px]">
          <option value="name">Sort: Name</option>
          <option value="assetTag">Sort: Tag</option>
          <option value="status">Sort: Status</option>
          <option value="condition">Sort: Condition</option>
        </FormSelect>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={openDetails}
        emptyMessage="No assets match your filters."
      />

      <Modal
        isOpen={showForm}
        onClose={() => !saving && setShowForm(false)}
        title={editing ? 'Edit Asset' : 'Create Asset'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Asset Name *" className="sm:col-span-2">
            <FormInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Asset Tag *">
            <FormInput
              required
              disabled={!!editing}
              value={form.assetTag}
              onChange={(e) => setForm({ ...form, assetTag: e.target.value })}
            />
          </FormField>
          <FormField label="Serial Number">
            <FormInput
              disabled={!!editing}
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
            />
          </FormField>
          <FormField label="Department *">
            <FormSelect
              required
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">Select</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Category *">
            <FormSelect
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Condition">
            <FormSelect value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {['New', 'Good', 'Fair', 'Poor'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Location">
            <FormInput value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </FormField>
          {!editing && (
            <FormField label="Acquisition Cost">
              <FormInput
                type="number"
                min="0"
                step="0.01"
                value={form.acquisitionCost}
                onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
              />
            </FormField>
          )}
          {editing && (
            <FormField label="Status (lifecycle)">
              <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['Available', 'Reserved', 'Retired', 'Unavailable'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                {editing.status &&
                  !['Available', 'Reserved', 'Retired', 'Unavailable'].includes(editing.status) && (
                    <option value={editing.status}>{editing.status} (current)</option>
                  )}
              </FormSelect>
            </FormField>
          )}
          <FormField label="Bookable" className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-main)] pb-2.5">
              <input
                type="checkbox"
                checked={form.isBookable}
                onChange={(e) => setForm({ ...form, isBookable: e.target.checked })}
                className="rounded border-[var(--border-light)]"
              />
              Allow bookings
            </label>
          </FormField>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Asset'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title="Asset Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-main)]">{selected.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{selected.assetTag}</p>
              </div>
              <Badge variant={statusBadgeVariant(selected.status)}>{selected.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Serial</p>
                <p className="font-medium">{selected.serialNumber || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Condition</p>
                <Badge variant={statusBadgeVariant(selected.condition)}>{selected.condition}</Badge>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Department</p>
                <p className="font-medium">{selected.department?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Category</p>
                <p className="font-medium">{selected.category?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Location</p>
                <p className="font-medium">{selected.location || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Holder</p>
                <p className="font-medium">{selected.employee?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Bookable</p>
                <p className="font-medium">{selected.isBookable ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Acquisition Cost</p>
                <p className="font-medium">
                  {selected.acquisitionCost != null ? `$${selected.acquisitionCost}` : '—'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  openEdit(selected);
                }}
                className="px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete asset"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={saving}
      />
    </div>
  );
};

export default AssetList;

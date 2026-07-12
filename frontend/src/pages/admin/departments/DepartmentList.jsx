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
import { Trash2, Pencil } from 'lucide-react';

const DepartmentList = () => {
  const { success, error: toastError } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', status: 'Active' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDepartments = () => {
    setLoading(true);
    setError(null);
    API.get('/departments')
      .then((res) => setDepartments(res.data.data || []))
      .catch((err) => {
        setDepartments([]);
        setError(getErrorMessage(err, 'Failed to load departments'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) => d.name?.toLowerCase().includes(q) || d.head?.name?.toLowerCase().includes(q)
    );
  }, [departments, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', status: 'Active' });
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name || '', status: row.status || 'Active' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toastError('Department name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await API.patch(`/departments/${editing.id}`, {
          name: form.name.trim(),
          status: form.status,
        });
        success('Department updated');
      } else {
        await API.post('/departments', { name: form.name.trim() });
        success('Department created');
      }
      setShowForm(false);
      fetchDepartments();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to save department'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await API.delete(`/departments/${deleteTarget.id}`);
      success('Department deleted');
      setDeleteTarget(null);
      fetchDepartments();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to delete department'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      label: 'Department',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-xs">
            {row.name?.charAt(0)}
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    { label: 'Head', key: 'head', render: (row) => row.head?.name || '—' },
    {
      label: 'Employees',
      key: '_count',
      render: (row) => <Badge variant="info">{row._count?.employees || 0}</Badge>,
    },
    {
      label: 'Assets',
      key: 'assets',
      render: (row) => <Badge variant="purple">{row._count?.assets || 0}</Badge>,
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
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchDepartments} />;

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle={`${filtered.length} of ${departments.length} departments`}
        actionLabel="Add Department"
        onAction={openCreate}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search departments…" />
      </PageHeader>

      <DataTable columns={columns} data={filtered} emptyMessage="No departments found." />

      <Modal
        isOpen={showForm}
        onClose={() => !saving && setShowForm(false)}
        title={editing ? 'Edit Department' : 'Create Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Department Name *">
            <FormInput
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Engineering"
            />
          </FormField>
          {editing && (
            <FormField label="Status">
              <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </FormSelect>
            </FormField>
          )}
          <div className="flex justify-end gap-3 pt-2">
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
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete department"
        message={`Delete "${deleteTarget?.name}"? Departments with employees or assets cannot be deleted.`}
        confirmLabel="Delete"
        loading={saving}
      />
    </div>
  );
};

export default DepartmentList;

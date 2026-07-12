import React, { useState, useEffect, useMemo } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ErrorState from '../../../components/ui/ErrorState';
import { FormField, FormInput, FormTextarea, SearchInput } from '../../../components/ui/FormField';
import { useToast } from '../../../context/ToastContext';
import { getErrorMessage } from '../../../utils/apiError';
import { Trash2, Pencil } from 'lucide-react';

const CategoryList = () => {
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', customFields: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCategories = () => {
    setLoading(true);
    setError(null);
    API.get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch((err) => {
        setCategories([]);
        setError(getErrorMessage(err, 'Failed to load categories'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name?.toLowerCase().includes(q));
  }, [categories, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', customFields: '' });
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name || '', customFields: row.customFields || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toastError('Category name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        customFields: form.customFields.trim() || null,
      };
      if (editing) {
        await API.patch(`/categories/${editing.id}`, payload);
        success('Category updated');
      } else {
        await API.post('/categories', payload);
        success('Category created');
      }
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to save category'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await API.delete(`/categories/${deleteTarget.id}`);
      success('Category deleted');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to delete category'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      label: 'Category',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 font-bold text-xs">
            {row.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            {row.customFields && (
              <p className="text-xs text-[var(--text-muted)] max-w-[220px] truncate">{row.customFields}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      label: 'Assets',
      key: '_count',
      render: (row) => <Badge variant="info">{row._count?.assets || 0}</Badge>,
    },
    {
      label: 'Created',
      key: 'createdAt',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
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
  if (error) return <ErrorState message={error} onRetry={fetchCategories} />;

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${filtered.length} of ${categories.length} categories`}
        actionLabel="Add Category"
        onAction={openCreate}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search categories…" />
      </PageHeader>

      <DataTable columns={columns} data={filtered} emptyMessage="No categories found. Create your first category." />

      <Modal
        isOpen={showForm}
        onClose={() => !saving && setShowForm(false)}
        title={editing ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Category Name *">
            <FormInput
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Laptops"
            />
          </FormField>
          <FormField label="Custom Fields (optional)">
            <FormTextarea
              rows={3}
              value={form.customFields}
              onChange={(e) => setForm({ ...form, customFields: e.target.value })}
              placeholder='Optional metadata, e.g. {"warrantyMonths":12}'
            />
          </FormField>
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
        title="Delete category"
        message={`Delete "${deleteTarget?.name}"? Categories with linked assets cannot be deleted.`}
        confirmLabel="Delete"
        loading={saving}
      />
    </div>
  );
};

export default CategoryList;

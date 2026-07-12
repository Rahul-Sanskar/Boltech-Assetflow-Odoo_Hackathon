import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Eye, Pencil, Trash2, UserX, UserCheck } from 'lucide-react';

const PAGE_SIZE = 10;

const UserList = () => {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', role: 'EMPLOYEE', status: 'Active' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    API.get('/users')
      .then((res) => setUsers(res.data.data || []))
      .catch((err) => {
        setUsers([]);
        setError(getErrorMessage(err, 'Failed to load users'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    let rows = [...users];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.employee?.department?.name?.toLowerCase().includes(q)
      );
    }
    if (roleFilter) rows = rows.filter((u) => u.role === roleFilter);
    if (statusFilter) rows = rows.filter((u) => u.status === statusFilter);
    return rows;
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      role: row.role || 'EMPLOYEE',
      status: row.status || 'Active',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing) return;
    if (!form.name.trim()) {
      toastError('Name is required');
      return;
    }
    setSaving(true);
    try {
      await API.patch(`/users/${editing.id}`, {
        name: form.name.trim(),
        role: form.role,
        status: form.status,
      });
      success('User updated');
      setEditing(null);
      fetchUsers();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to update user'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row) => {
    const next = row.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await API.patch(`/users/${row.id}`, { status: next });
      success(`User ${next === 'Active' ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to update status'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await API.delete(`/users/${deleteTarget.id}`);
      success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to delete user'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      label: 'User',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(row.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      label: 'Role',
      key: 'role',
      render: (row) => <Badge variant={statusBadgeVariant(row.role)}>{row.role}</Badge>,
    },
    {
      label: 'Department',
      key: 'department',
      render: (row) => row.employee?.department?.name || '—',
    },
    {
      label: 'Status',
      key: 'status',
      render: (row) => <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>,
    },
    {
      label: 'Joined',
      key: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      label: '',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="View"
            onClick={() => setDetail(row)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Edit"
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
            onClick={() => toggleStatus(row)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
          >
            {row.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
          <button
            type="button"
            title="Delete"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchUsers} />;

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <PageHeader title="Users" subtitle="Manage accounts, roles, and access" />

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, department…" className="max-w-sm flex-1" />
        <FormSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MANAGER">MANAGER</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
        </FormSelect>
        <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </FormSelect>
      </div>

      <DataTable columns={columns} data={pageRows} emptyMessage="No users found." onRowClick={setDetail} />

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 py-1.5">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="User Details" size="md">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-400 flex items-center justify-center text-white font-bold text-xl">
                {(detail.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[var(--text-main)]">{detail.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{detail.email}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Role</dt>
                <dd>
                  <Badge variant={statusBadgeVariant(detail.role)}>{detail.role}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Status</dt>
                <dd>
                  <Badge variant={statusBadgeVariant(detail.status)}>{detail.status}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Department</dt>
                <dd className="text-[var(--text-main)]">{detail.employee?.department?.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Employee ID</dt>
                <dd className="text-[var(--text-main)]">{detail.employee?.id ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Created</dt>
                <dd className="text-[var(--text-main)]">{new Date(detail.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Updated</dt>
                <dd className="text-[var(--text-main)]">{new Date(detail.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDetail(null);
                  openEdit(detail);
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--brand-primary)] text-white"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!editing} onClose={() => !saving && setEditing(null)} title="Edit User" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Name">
            <FormInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Email">
            <FormInput value={editing?.email || ''} disabled className="opacity-60" />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Email cannot be changed via the API</p>
          </FormField>
          <FormField label="Role">
            <FormSelect value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </FormSelect>
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </FormSelect>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={saving} onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-muted)]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--brand-primary)] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete user"
        message={`Permanently delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={saving}
      />
    </div>
  );
};

export default UserList;

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

const EmployeeList = () => {
  const { success, error: toastError } = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    departmentId: '',
    status: 'Active',
    role: 'EMPLOYEE',
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEmployees = () => {
    setLoading(true);
    setError(null);
    API.get('/employees')
      .then((res) => setEmployees(res.data.data || []))
      .catch((err) => {
        setEmployees([]);
        setError(getErrorMessage(err, 'Failed to load employees'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
    API.get('/departments').then((res) => setDepartments(res.data.data || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let rows = [...employees];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (e) => e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q)
      );
    }
    if (deptFilter) rows = rows.filter((e) => String(e.departmentId) === String(deptFilter));
    if (statusFilter) rows = rows.filter((e) => e.status === statusFilter);
    return rows;
  }, [employees, search, deptFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', departmentId: '', status: 'Active', role: 'EMPLOYEE' });
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      email: row.email || '',
      departmentId: row.departmentId || '',
      status: row.status || 'Active',
      role: row.user?.role || 'EMPLOYEE',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.departmentId) {
      toastError('Name, email, and department are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await API.patch(`/employees/${editing.id}`, {
          name: form.name.trim(),
          email: form.email.trim(),
          departmentId: Number(form.departmentId),
          status: form.status,
        });
        if (editing.user?.id && form.role !== editing.user.role) {
          await API.patch(`/users/${editing.user.id}`, { role: form.role });
        }
        success('Employee updated');
      } else {
        await API.post('/employees', {
          name: form.name.trim(),
          email: form.email.trim(),
          departmentId: Number(form.departmentId),
        });
        success('Employee created');
      }
      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to save employee'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await API.delete(`/employees/${deleteTarget.id}`);
      success('Employee deleted');
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to delete employee'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      label: 'Employee',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {row.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.email}</p>
          </div>
        </div>
      ),
    },
    { label: 'Department', key: 'department', render: (row) => row.department?.name || '—' },
    {
      label: 'Role',
      key: 'user',
      render: (row) => {
        const role = row.user?.role || '—';
        return <Badge variant={statusBadgeVariant(role)}>{role}</Badge>;
      },
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
  if (error) return <ErrorState message={error} onRetry={fetchEmployees} />;

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${filtered.length} of ${employees.length} employees`}
        actionLabel="Add Employee"
        onAction={openCreate}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search employees…" />
        <FormSelect value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </FormSelect>
        <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[140px]">
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </FormSelect>
      </PageHeader>

      <DataTable columns={columns} data={filtered} emptyMessage="No employees found." />

      <Modal
        isOpen={showForm}
        onClose={() => !saving && setShowForm(false)}
        title={editing ? 'Edit Employee' : 'Add Employee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full Name *">
            <FormInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Email *">
            <FormInput
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          {editing && (
            <>
              <FormField label="Status">
                <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </FormSelect>
              </FormField>
              <FormField label="Role">
                <FormSelect
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  disabled={!editing.user?.id}
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </FormSelect>
                {!editing.user?.id && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    No linked user account — role cannot be changed.
                  </p>
                )}
              </FormField>
            </>
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
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete employee"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        loading={saving}
      />
    </div>
  );
};

export default EmployeeList;

import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Trash2 } from 'lucide-react';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', departmentId: '' });

  const fetchEmployees = () => {
    setLoading(true);
    API.get('/employees')
      .then((res) => setEmployees(res.data.data || []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
    API.get('/departments').then((res) => setDepartments(res.data.data || [])).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/employees', { ...form, departmentId: Number(form.departmentId) });
      setShowCreate(false);
      setForm({ name: '', email: '', departmentId: '' });
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await API.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const columns = [
    { label: 'Employee', key: 'name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
          {row.name?.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{row.email}</p>
        </div>
      </div>
    )},
    { label: 'Department', key: 'department', render: (row) => row.department?.name || '—' },
    { label: 'Role', key: 'user', render: (row) => (
      <Badge variant={row.user?.role === 'ADMIN' ? 'danger' : row.user?.role === 'MANAGER' ? 'warning' : 'info'}>
        {row.user?.role || 'EMPLOYEE'}
      </Badge>
    )},
    { label: 'Status', key: 'status', render: (row) => (
      <Badge variant={row.status === 'Active' ? 'success' : 'default'}>{row.status}</Badge>
    )},
    { label: '', key: 'actions', render: (row) => (
      <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    )},
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Employees" subtitle={`${employees.length} employees`} actionLabel="Add Employee" onAction={() => setShowCreate(true)} />
      <DataTable columns={columns} data={employees} emptyMessage="No employees found." />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Employee">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Full Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Department</label>
            <select required value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="">Select</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 active:scale-95">Add Employee</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeList;

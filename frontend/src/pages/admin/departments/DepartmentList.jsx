import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Trash2 } from 'lucide-react';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '' });

  const fetchDepartments = () => {
    setLoading(true);
    API.get('/departments')
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/departments', form);
      setShowCreate(false);
      setForm({ name: '' });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await API.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const columns = [
    { label: 'Department', key: 'name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-xs">
          {row.name?.charAt(0)}
        </div>
        <span className="font-medium">{row.name}</span>
      </div>
    )},
    { label: 'Head', key: 'head', render: (row) => row.head?.name || '—' },
    { label: 'Employees', key: '_count', render: (row) => (
      <Badge variant="info">{row._count?.employees || 0}</Badge>
    )},
    { label: 'Assets', key: 'assets', render: (row) => (
      <Badge variant="purple">{row._count?.assets || 0}</Badge>
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
      <PageHeader title="Departments" subtitle={`${departments.length} departments`} actionLabel="Add Department" onAction={() => setShowCreate(true)} />
      <DataTable columns={columns} data={departments} emptyMessage="No departments found." />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Department">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Department Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors" placeholder="e.g. Engineering" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 active:scale-95">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentList;

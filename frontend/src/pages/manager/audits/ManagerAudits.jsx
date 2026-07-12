import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Eye, Plus } from 'lucide-react';

const statusBadge = (s) => {
  const map = { Open: 'info', 'In Progress': 'warning', Closed: 'success' };
  return <Badge variant={map[s] || 'default'}>{s}</Badge>;
};

const resultBadge = (r) => {
  if (!r) return <Badge variant="default">Pending</Badge>;
  const map = { Verified: 'success', Missing: 'danger', Damaged: 'warning' };
  return <Badge variant={map[r] || 'default'}>{r}</Badge>;
};

const ManagerAudits = () => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showUpdateItem, setShowUpdateItem] = useState(null);
  const [assets, setAssets] = useState([]);
  const [addForm, setAddForm] = useState({ assetId: '', result: '', notes: '' });
  const [updateItemForm, setUpdateItemForm] = useState({ result: '', notes: '' });

  const fetchCycles = () => {
    setLoading(true);
    API.get('/audits')
      .then((res) => setCycles(res.data.data || []))
      .catch(() => setCycles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCycles();
    API.get('/assets').then((res) => setAssets(res.data.data || [])).catch(() => {});
  }, []);

  const openDetail = async (cycle) => {
    try {
      const res = await API.get(`/audits/${cycle.id}`);
      setDetailData(res.data.data);
      setShowDetail(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load audit details');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/audits/${detailData.id}/items`, {
        assetId: Number(addForm.assetId),
        result: addForm.result || null,
        notes: addForm.notes || null,
      });
      setShowAddItem(false);
      setAddForm({ assetId: '', result: '', notes: '' });
      const res = await API.get(`/audits/${detailData.id}`);
      setDetailData(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add item');
    }
  };

  const handleUpdateItem = async () => {
    try {
      await API.patch(`/audits/${detailData.id}/items/${showUpdateItem.id}`, {
        result: updateItemForm.result || undefined,
        notes: updateItemForm.notes || undefined,
      });
      setShowUpdateItem(null);
      setUpdateItemForm({ result: '', notes: '' });
      const res = await API.get(`/audits/${detailData.id}`);
      setDetailData(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update item');
    }
  };

  const openUpdateItem = (item) => {
    setShowUpdateItem(item);
    setUpdateItemForm({ result: item.result || '', notes: item.notes || '' });
  };

  const columns = [
    { label: 'Audit Cycle', key: 'name', render: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-xs text-[var(--text-muted)]">{row.scope}</p>
      </div>
    )},
    { label: 'Department', key: 'department', render: (row) => row.department?.name || 'All' },
    { label: 'Period', key: 'startDate', render: (row) => `${new Date(row.startDate).toLocaleDateString()} – ${new Date(row.endDate).toLocaleDateString()}` },
    { label: 'Items', key: '_count', render: (row) => row._count?.items || 0 },
    { label: 'Status', key: 'status', render: (row) => statusBadge(row.status) },
    { label: '', key: 'actions', render: (row) => (
      <button onClick={(e) => { e.stopPropagation(); openDetail(row); }} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="View Details">
        <Eye className="w-4 h-4" />
      </button>
    )},
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Audit Cycles" subtitle={`${cycles.filter(c => c.status === 'Open').length} active cycles`} />
      <DataTable columns={columns} data={cycles} emptyMessage="No audit cycles assigned to you." />

      <Modal isOpen={showDetail} onClose={() => { setShowDetail(false); setDetailData(null); }} title={`Audit: ${detailData?.name || ''}`} size="xl">
        {detailData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-[var(--bg-surface-hover)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Scope</p>
                <p className="text-sm font-semibold text-[var(--text-main)]">{detailData.scope}</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-surface-hover)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Department</p>
                <p className="text-sm font-semibold text-[var(--text-main)]">{detailData.department?.name || 'All'}</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-surface-hover)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Status</p>
                <p className="text-sm">{statusBadge(detailData.status)}</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-surface-hover)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Items</p>
                <p className="text-sm font-semibold text-[var(--text-main)]">{detailData.items?.length || 0}</p>
              </div>
            </div>

            {detailData.assignments?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Assigned Auditors</p>
                <div className="flex flex-wrap gap-2">
                  {detailData.assignments.map((a, i) => (
                    <Badge key={i} variant="purple">{a.auditor?.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[var(--text-main)]">Audit Items</p>
                {detailData.status !== 'Closed' && (
                  <button onClick={() => setShowAddItem(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-hover)] transition-colors">
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                )}
              </div>
              {detailData.items?.length > 0 ? (
                <div className="rounded-xl border border-[var(--border-light)] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border-light)] bg-[var(--bg-surface-hover)]/50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Asset</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Result</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Notes</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)]">
                      {detailData.items.map((item) => (
                        <tr key={item.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                          <td className="px-4 py-3 text-sm">{item.asset?.name || `Asset #${item.assetId}`}</td>
                          <td className="px-4 py-3 text-sm">{resultBadge(item.result)}</td>
                          <td className="px-4 py-3 text-sm text-[var(--text-muted)] max-w-[200px] truncate">{item.notes || '—'}</td>
                          <td className="px-4 py-3">
                            {detailData.status !== 'Closed' && (
                              <button onClick={() => openUpdateItem(item)} className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-sm text-[var(--text-muted)] py-6 rounded-xl bg-[var(--bg-surface-hover)]">No audit items yet</div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showAddItem} onClose={() => { setShowAddItem(false); setAddForm({ assetId: '', result: '', notes: '' }); }} title="Add Audit Item">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Asset</label>
            <select required value={addForm.assetId} onChange={(e) => setAddForm({ ...addForm, assetId: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="">Select asset</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Result</label>
            <select value={addForm.result} onChange={(e) => setAddForm({ ...addForm, result: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Missing">Missing</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Notes</label>
            <textarea rows={2} value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowAddItem(false); setAddForm({ assetId: '', result: '', notes: '' }); }} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 active:scale-95">Add Item</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showUpdateItem} onClose={() => { setShowUpdateItem(null); setUpdateItemForm({ result: '', notes: '' }); }} title="Update Audit Item">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Result</label>
            <select value={updateItemForm.result} onChange={(e) => setUpdateItemForm({ ...updateItemForm, result: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors">
              <option value="">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Missing">Missing</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Notes</label>
            <textarea rows={2} value={updateItemForm.notes} onChange={(e) => setUpdateItemForm({ ...updateItemForm, notes: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowUpdateItem(null); setUpdateItemForm({ result: '', notes: '' }); }} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button onClick={handleUpdateItem} className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 active:scale-95">Update Item</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerAudits;

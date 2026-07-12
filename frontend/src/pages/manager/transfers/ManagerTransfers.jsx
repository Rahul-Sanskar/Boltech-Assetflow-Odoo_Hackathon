import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Check, X } from 'lucide-react';

const statusBadge = (status) => {
  const map = { Requested: 'warning', Approved: 'success', Rejected: 'danger' };
  return <Badge variant={map[status] || 'default'}>{status}</Badge>;
};

const ManagerTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(null);
  const [rejectedReason, setRejectedReason] = useState('');

  const fetchTransfers = () => {
    setLoading(true);
    API.get('/transfers')
      .then((res) => setTransfers(res.data.data || []))
      .catch(() => setTransfers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransfers(); }, []);

  const handleApprove = async (id) => {
    try {
      await API.patch(`/transfers/${id}/approve`);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    try {
      await API.patch(`/transfers/${showReject.id}/reject`, { rejectedReason });
      setShowReject(null);
      setRejectedReason('');
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const columns = [
    { label: 'Asset', key: 'asset', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-xs">
          {row.asset?.name?.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{row.asset?.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{row.asset?.assetTag}</p>
        </div>
      </div>
    )},
    { label: 'Requested By', key: 'requestedBy', render: (row) => row.requestedBy?.name || '—' },
    { label: 'Date', key: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { label: 'Status', key: 'status', render: (row) => statusBadge(row.status) },
    { label: 'Reason', key: 'rejectedReason', render: (row) => row.rejectedReason || '—' },
    { label: '', key: 'actions', render: (row) => row.status === 'Requested' && (
      <div className="flex items-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); handleApprove(row.id); }} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Approve">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShowReject(row); }} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Reject">
          <X className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Transfer Requests" subtitle={`${transfers.filter(t => t.status === 'Requested').length} pending approvals`} />
      <DataTable columns={columns} data={transfers} emptyMessage="No transfer requests." />

      <Modal isOpen={!!showReject} onClose={() => { setShowReject(null); setRejectedReason(''); }} title="Reject Transfer">
        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--bg-surface-hover)] p-4">
            <p className="text-sm font-medium text-[var(--text-main)]">{showReject?.asset?.name}</p>
            <p className="text-xs text-[var(--text-muted)]">Requested by: {showReject?.requestedBy?.name}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Rejection Reason</label>
            <textarea rows={3} value={rejectedReason} onChange={(e) => setRejectedReason(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm focus:border-[var(--border-focus)] focus:outline-none transition-colors resize-none" placeholder="Provide a reason for rejection..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowReject(null); setRejectedReason(''); }} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">Cancel</button>
            <button onClick={handleReject} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg active:scale-95">Reject Transfer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerTransfers;

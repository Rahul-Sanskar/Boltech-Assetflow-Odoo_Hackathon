import React, { useState, useEffect } from 'react';
import API from '../../api/API';
import { useAuth } from '../../context/AuthContext';
import { 
  Package, 
  Calendar, 
  MapPin, 
  Tag, 
  ArrowRightLeft, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Loader2
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';

export default function MyAssets() {
  const { user } = useAuth();
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeModal, setActiveModal] = useState(null); // 'return' | 'transfer' | null
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalNotes, setModalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchAssignedAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/allocations');
      const data = response.data.data || [];
      
      const active = data.filter(a => !a.returnedDate);
      const mapped = active.map(alloc => ({
        id: alloc.asset.id,
        assetTag: alloc.asset.assetTag,
        name: alloc.asset.name,
        status: alloc.asset.status,
        condition: alloc.asset.condition,
        location: alloc.asset.location,
        category: alloc.asset.category,
        allocatedDate: alloc.allocatedDate,
        expectedReturn: alloc.expectedReturn,
        allocationId: alloc.id,
        isOverdue: alloc.expectedReturn ? (new Date(alloc.expectedReturn) < new Date()) : false
      }));

      setAssignedAssets(mapped);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedAssets();
  }, []);

  const handleOpenModal = (type, asset) => {
    setActiveModal(type);
    setSelectedAsset(asset);
    setModalNotes('');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedAsset(null);
    setModalNotes('');
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      setSubmitting(true);
      if (activeModal === 'return') {
        await API.patch(`/allocations/${selectedAsset.allocationId}/return`, { returnNotes: modalNotes });
      } else if (activeModal === 'transfer') {
        await API.post('/transfers', { assetId: selectedAsset.id, requestedById: user.employeeId });
      }

      setSuccessMessage(
        activeModal === 'return' 
          ? `Return request for ${selectedAsset.name} submitted successfully.` 
          : `Transfer request for ${selectedAsset.name} submitted for approval.`
      );

      handleCloseModal();
      fetchAssignedAssets();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to process ${activeModal} request.`);
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  if (loading) return <Loader2 className="w-8 h-8 animate-[spin_1s_linear_infinite] text-[var(--brand-primary)] mx-auto mt-20" />;

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <PageHeader title="My Assigned Assets" subtitle="View and manage equipment currently allocated to you." />

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-750 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assignedAssets.map((asset) => (
          <div 
            key={asset.id} 
            className={`flex flex-col justify-between rounded-2xl bg-[var(--bg-surface)] border ${asset.isOverdue ? 'border-red-500/50 shadow-sm' : 'border-[var(--border-light)]'} p-5 transition-all hover:border-[var(--border-focus)]`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-[var(--bg-base)] border border-[var(--border-light)] text-[var(--brand-primary)]">
                  <Tag className="w-3 h-3" />
                  {asset.assetTag}
                </span>
                {asset.isOverdue ? (
                  <Badge variant="danger">Overdue</Badge>
                ) : (
                  <Badge variant="success">{asset.status}</Badge>
                )}
              </div>

              <h2 className="text-base font-semibold mb-1 line-clamp-1">{asset.name}</h2>
              <p className="text-xs text-[var(--text-muted)] mb-4">{asset.category?.name || 'General'} • Condition: <span className="font-medium text-[var(--text-main)]">{asset.condition}</span></p>

              <div className="space-y-2 text-xs text-[var(--text-muted)] border-t border-[var(--border-light)] pt-3 mb-5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                  <span className="truncate">{asset.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                  <span>Allocated: {new Date(asset.allocatedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${asset.isOverdue ? 'text-red-500' : 'text-[var(--text-muted)]'}`} />
                  <span className={asset.isOverdue ? 'text-red-500 font-medium' : ''}>
                    Expected Return: {asset.expectedReturn ? new Date(asset.expectedReturn).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-light)]">
              <button
                onClick={() => handleOpenModal('return', asset)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[var(--bg-surface-hover)] hover:bg-[var(--border-light)] text-[var(--text-main)] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return
              </button>
              <button
                onClick={() => handleOpenModal('transfer', asset)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[var(--bg-surface-hover)] hover:bg-[var(--border-light)] text-[var(--text-main)] transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Transfer
              </button>
            </div>
          </div>
        ))}
      </div>

      {assignedAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl p-6">
          <Package className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-40" />
          <h2 className="text-sm font-semibold">No assets assigned</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">You currently do not hold any allocated inventory items.</p>
        </div>
      )}

      {activeModal && selectedAsset && (
        <Modal isOpen={!!activeModal} onClose={handleCloseModal} title={`${activeModal === 'return' ? 'Return' : 'Transfer'} Asset`}>
          <form onSubmit={handleSubmitAction} className="space-y-4">
            <div className="rounded-xl bg-[var(--bg-surface-hover)] p-4">
              <p className="text-sm font-medium text-[var(--text-main)]">{selectedAsset.name}</p>
              <p className="text-xs text-[var(--text-muted)]">Tag: {selectedAsset.assetTag}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                {activeModal === 'return' ? 'Condition Check-in & Return Notes' : 'Reason for Transfer Request'}
              </label>
              <textarea
                rows="3"
                required
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder={activeModal === 'return' ? 'Describe current condition or mention any wear/tear...' : 'State why you need to transfer this asset...'}
                className="w-full rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] p-3 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--border-focus)] transition-colors resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-[spin_1s_linear_infinite]" />}
                Confirm & Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
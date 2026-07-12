import React, { useState, useEffect } from 'react';
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
  Loader2,
  X
} from 'lucide-react';

export default function MyAssets() {
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeModal, setActiveModal] = useState(null); // 'return' | 'transfer' | null
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalNotes, setModalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch assigned assets from the backend API
  const fetchAssignedAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/allocations/my-assets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assigned assets from the server.');
      }

      const data = await response.json();
      setAssignedAssets(data);
    } catch (err) {
      setError(err.message);
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
      let endpoint = '';
      let payload = {};

      if (activeModal === 'return') {
        endpoint = `/api/allocations/${selectedAsset.allocationId}/return`;
        payload = { returnNotes: modalNotes, condition: selectedAsset.condition };
      } else if (activeModal === 'transfer') {
        endpoint = `/api/transfer-requests`;
        payload = { assetId: selectedAsset.id, reason: modalNotes };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to process ${activeModal} request.`);
      }

      setSuccessMessage(
        activeModal === 'return' 
          ? `Return request for ${selectedAsset.name} submitted successfully.` 
          : `Transfer request for ${selectedAsset.name} submitted for approval.`
      );

      handleCloseModal();
      fetchAssignedAssets(); // Refresh list after action
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-main)]">
        <Loader2 className="w-8 h-8 animate-[spin_1s_linear_infinite] text-[var(--brand-primary)]" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-base)] text-[var(--text-main)] overflow-y-auto custom-scrollbar p-6">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Assigned Assets</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            View and manage equipment, tech, and resources currently allocated to you.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-surface-hover)] border border-[var(--border-light)]">
            <Package className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            {assignedAssets.length} Active Allocations
          </span>
        </div>
      </div>

      {/* Notifications / Errors */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[var(--status-danger)] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[var(--status-success)] flex items-center gap-3 animate-[slideDown_0.2s_ease-out]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assignedAssets.map((asset) => (
          <div 
            key={asset.id} 
            className={`flex flex-col justify-between rounded-2xl bg-[var(--bg-surface)] border ${asset.isOverdue ? 'border-[var(--status-danger)]/50 shadow-sm shadow-[var(--status-danger)]/10' : 'border-[var(--border-light)]'} p-5 transition-all hover:border-[var(--border-focus)]`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-[var(--bg-base)] border border-[var(--border-light)] text-[var(--brand-primary)]">
                  <Tag className="w-3 h-3" />
                  {asset.assetTag}
                </span>
                {asset.isOverdue ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-[var(--status-danger)] border border-rose-500/20">
                    <AlertCircle className="w-3 h-3" /> Overdue
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-[var(--status-success)] border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> {asset.status}
                  </span>
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
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${asset.isOverdue ? 'text-[var(--status-danger)]' : 'text-[var(--text-muted)]'}`} />
                  <span className={asset.isOverdue ? 'text-[var(--status-danger)] font-medium' : ''}>
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

      {assignedAssets.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl p-6">
          <Package className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-40" />
          <h2 className="text-sm font-semibold">No assets assigned</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">You currently do not hold any allocated inventory items.</p>
        </div>
      )}

      {/* Return / Transfer Modal */}
      {activeModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-light)] shadow-2xl p-6 animate-[scaleIn_0.2s_ease-out]">
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-[var(--brand-primary)]">
                  {activeModal === 'return' ? <RotateCcw className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-semibold capitalize">{activeModal} Asset</h2>
                  <p className="text-xs text-[var(--text-muted)]">{selectedAsset.name} ({selectedAsset.assetTag})</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  {activeModal === 'return' ? 'Condition Check-in & Return Notes' : 'Reason for Transfer Request'}
                </label>
                <textarea
                  rows="3"
                  required
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder={activeModal === 'return' ? 'Describe current condition or mention any wear/tear...' : 'State why you need to transfer this asset...' }
                  className="w-full rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] p-3 text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--border-focus)] transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--bg-surface-hover)] hover:bg-[var(--border-light)] text-[var(--text-main)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[var(--text-inverse)] transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-[spin_1s_linear_infinite]" />}
                  Confirm & Submit
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import API from '../../api/API';
import { 
  Bell, 
  CheckCheck, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  Package, 
  ShieldAlert, 
  ArrowRightLeft, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/notifications');
      setNotifications(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await API.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'asset assigned':
      case 'transfer approved':
        return <Package className="w-4 h-4 text-[var(--brand-primary)]" />;
      case 'maintenance approved':
      case 'maintenance rejected':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'booking confirmed':
      case 'booking reminder':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'transfer requested':
        return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
      case 'overdue return alert':
        return <Clock className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  if (loading) return <Loader2 className="w-8 h-8 animate-[spin_1s_linear_infinite] text-[var(--brand-primary)] mx-auto mt-20" />;

  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Stay updated on your asset assignments, return dates, bookings, and requests.
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface-hover)] border border-[var(--border-light)] hover:bg-[var(--border-light)] text-[var(--text-main)] transition-colors disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-[spin_1s_linear_infinite]" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-750 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {unread.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">New Notifications</p>
          {unread.map((n) => (
            <div key={n.id} className="flex items-start gap-4 p-4 rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/15 flex items-center justify-center shrink-0">
                {getNotificationIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--text-main)]">{n.type || 'Alert'}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-1">{n.message}</p>
              </div>
              <button 
                onClick={() => handleMarkAsRead(n.id)} 
                className="p-1.5 rounded-lg text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-all active:scale-95 shrink-0" 
                title="Mark as read"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {read.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">Earlier Notifications</p>
          {read.map((n) => (
            <div key={n.id} className="flex items-start gap-4 p-4 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                {getNotificationIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--text-main)]">{n.type || 'Alert'}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-1">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {notifications.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-[var(--border-light)] rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)]">
            <Bell className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold">All caught up!</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">You have no active alerts or updates.</p>
        </div>
      )}
    </div>
  );
}
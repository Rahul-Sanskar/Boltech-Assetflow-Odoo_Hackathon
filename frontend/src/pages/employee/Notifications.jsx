import React, { useState, useEffect } from 'react';
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

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications from the server.');
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update notification status.');
      }

      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read.');
      }

      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    } catch (err) {
      setError(err.message);
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
        return <ShieldAlert className="w-4 h-4 text-[var(--status-warning)]" />;
      case 'booking confirmed':
      case 'booking reminder':
        return <Calendar className="w-4 h-4 text-[var(--status-success)]" />;
      case 'overdue return alert':
      case 'audit discrepancy flagged':
        return <AlertCircle className="w-4 h-4 text-[var(--status-danger)]" />;
      default:
        return <Bell className="w-4 h-4 text-[var(--brand-primary)]" />;
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-main)]">
        <Loader2 className="w-8 h-8 animate-[spin_1s_linear_infinite] text-[var(--brand-primary)]" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-base)] text-[var(--text-main)] overflow-y-auto custom-scrollbar p-6">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Stay updated with your resource bookings, asset transfers, and system alerts[cite: 1].
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-surface-hover)] border border-[var(--border-light)]">
            <Bell className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            {unreadCount} Unread
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-light)] text-[var(--text-main)] transition-colors shadow-2xs disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-[spin_1s_linear_infinite]" /> : <CheckCheck className="w-3.5 h-3.5" />}
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[var(--status-danger)] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((item) => (
          <div
            key={item.id}
            onClick={() => !item.isRead && handleMarkAsRead(item.id)}
            className={`flex items-start justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-surface)] border transition-all ${
              item.isRead 
                ? 'border-[var(--border-light)] opacity-75' 
                : 'border-[var(--border-focus)]/40 shadow-xs bg-[var(--bg-surface)]'
            } hover:border-[var(--border-focus)] cursor-pointer`}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 bg-[var(--bg-base)] border border-[var(--border-light)]`}>
                {getNotificationIcon(item.type)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary)] font-mono">
                    {item.type}
                  </span>
                  {!item.isRead && (
                    <span className="inline-block w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
                  {item.message}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {item.isRead ? (
              <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)] shrink-0 opacity-40 mt-1" />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead(item.id);
                }}
                className="shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-colors"
                title="Mark as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {notifications.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl p-6">
          <Bell className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-40" />
          <h2 className="text-sm font-semibold">No notifications</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">You're completely caught up with your updates.</p>
        </div>
      )}

    </div>
  );
}
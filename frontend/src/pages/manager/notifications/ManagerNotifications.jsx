import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Badge from '../../../components/ui/Badge';
import { Bell, Check } from 'lucide-react';

const ManagerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    API.get('/notifications')
      .then((res) => setNotifications(res.data.data || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as read');
    }
  };

  if (loading) return <LoadingSpinner />;

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <PageHeader title="Notifications" subtitle={`${unread.length} unread notifications`} />

      {unread.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">Unread</p>
          {unread.map((n) => (
            <div key={n.id} className="flex items-start gap-4 p-4 rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/15 flex items-center justify-center text-[var(--brand-primary)] shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-main)]">{n.title}</p>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">{n.message}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => handleMarkRead(n.id)} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shrink-0" title="Mark as read">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {read.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">Read</p>
          {read.map((n) => (
            <div key={n.id} className="flex items-start gap-4 p-4 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-main)]">{n.title}</p>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">{n.message}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <Badge variant="success">Read</Badge>
            </div>
          ))}
        </div>
      )}

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)]">
            <Bell className="w-8 h-8" />
          </div>
          <p className="text-sm text-[var(--text-muted)]">No notifications</p>
        </div>
      )}
    </div>
  );
};

export default ManagerNotifications;

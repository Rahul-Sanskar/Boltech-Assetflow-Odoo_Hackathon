import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import Badge from '../ui/Badge';
import { useNotifications } from '../../context/NotificationContext';
import { statusBadgeVariant } from '../../utils/apiError';

function formatRelative(dateStr) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const recent = notifications.slice(0, 6);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) fetchNotifications({ silent: true });
  };

  const handleMarkRead = async (e, id, isRead) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRead) return;
    await markAsRead(id);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative p-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-all duration-200 active:scale-90"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-xl z-50 overflow-hidden animate-[fadeIn_0.15s_ease-out]"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-[var(--border-light)] flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[var(--text-main)]">Notifications</p>
              <p className="text-xs text-[var(--text-muted)]">
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are up to date'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-primary)] hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-light)]">
            {recent.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                No notifications yet
              </p>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={(e) => handleMarkRead(e, n.id, n.isRead)}
                  className={`w-full text-left px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors ${
                    !n.isRead ? 'bg-[var(--brand-primary)]/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant={statusBadgeVariant(n.type) === 'default' ? 'info' : statusBadgeVariant(n.type)}>
                          {n.type}
                        </Badge>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-main)] line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        {formatRelative(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[var(--border-light)] bg-[var(--bg-surface-hover)]/40">
            <Link
              to="/admin/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
            >
              Open notification center
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

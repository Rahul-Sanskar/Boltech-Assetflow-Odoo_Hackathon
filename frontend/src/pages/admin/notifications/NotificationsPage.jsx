import React, { useMemo, useState } from 'react';
import { CheckCheck, RefreshCw, Search } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorState from '../../../components/ui/ErrorState';
import { useNotifications } from '../../../context/NotificationContext';
import { statusBadgeVariant } from '../../../utils/apiError';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const NotificationsPage = () => {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [markingId, setMarkingId] = useState(null);

  const types = useMemo(() => {
    const set = new Set(notifications.map((n) => n.type).filter(Boolean));
    return Array.from(set).sort();
  }, [notifications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter((n) => {
      if (readFilter === 'unread' && n.isRead) return false;
      if (readFilter === 'read' && !n.isRead) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (!q) return true;
      return (
        (n.type || '').toLowerCase().includes(q) ||
        (n.message || '').toLowerCase().includes(q)
      );
    });
  }, [notifications, search, readFilter, typeFilter]);

  const handleMarkRead = async (row) => {
    if (row.isRead) return;
    setMarkingId(row.id);
    try {
      await markAsRead(row.id);
    } finally {
      setMarkingId(null);
    }
  };

  const columns = [
    {
      label: 'Title',
      key: 'type',
      render: (row) => (
        <div className="flex items-center gap-2">
          {!row.isRead && (
            <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] shrink-0" aria-hidden />
          )}
          <span className="font-medium text-[var(--text-main)]">{row.type || 'Notification'}</span>
        </div>
      ),
    },
    {
      label: 'Message',
      key: 'message',
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)] line-clamp-2 max-w-md">{row.message}</span>
      ),
    },
    {
      label: 'Type',
      key: 'typeBadge',
      render: (row) => (
        <Badge variant={statusBadgeVariant(row.type) === 'default' ? 'info' : statusBadgeVariant(row.type)}>
          {row.type}
        </Badge>
      ),
    },
    {
      label: 'Created',
      key: 'createdAt',
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      label: 'Status',
      key: 'isRead',
      render: (row) => (
        <Badge variant={row.isRead ? 'default' : 'warning'}>{row.isRead ? 'Read' : 'Unread'}</Badge>
      ),
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (row) =>
        row.isRead ? (
          <span className="text-xs text-[var(--text-muted)]">—</span>
        ) : (
          <button
            type="button"
            disabled={markingId === row.id}
            onClick={() => handleMarkRead(row)}
            className="text-xs font-semibold text-[var(--brand-primary)] hover:underline disabled:opacity-50"
          >
            Mark read
          </button>
        ),
    },
  ];

  if (loading && notifications.length === 0) return <LoadingSpinner />;
  if (error && notifications.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchNotifications()} />;
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread · related entities are not stored by the API`
            : 'All caught up · related entities are not stored by the API'
        }
      >
        <button
          type="button"
          onClick={() => fetchNotifications()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          type="button"
          disabled={unreadCount === 0}
          onClick={() => markAllAsRead()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by type or message…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40"
          />
        </div>
        <select
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)]"
          aria-label="Filter by read status"
        >
          <option value="all">All statuses</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)]"
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage={
          notifications.length === 0
            ? 'No notifications yet.'
            : 'No notifications match your filters.'
        }
      />
    </div>
  );
};

export default NotificationsPage;

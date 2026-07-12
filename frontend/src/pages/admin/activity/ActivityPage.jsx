import React, { useCallback, useEffect, useMemo, useState } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorState from '../../../components/ui/ErrorState';
import { FormSelect, SearchInput } from '../../../components/ui/FormField';
import { getErrorMessage } from '../../../utils/apiError';
import { RefreshCw } from 'lucide-react';

const PAGE_SIZE = 20;

const ActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError(null);
    API.get('/notifications/activity-logs')
      .then((res) => setLogs(res.data.data || []))
      .catch((err) => {
        setLogs([]);
        setError(getErrorMessage(err, 'Failed to load activity logs'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const entities = useMemo(() => {
    const set = new Set(logs.map((l) => l.entity).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    let rows = logs;
    if (entityFilter) rows = rows.filter((l) => l.entity === entityFilter);
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (l) =>
        l.action?.toLowerCase().includes(q) ||
        l.entity?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q) ||
        l.user?.name?.toLowerCase().includes(q) ||
        String(l.entityId).includes(q)
    );
  }, [logs, search, entityFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, entityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    {
      label: 'User',
      key: 'user',
      render: (row) => row.user?.name || 'System',
    },
    {
      label: 'Action',
      key: 'action',
      render: (row) => <Badge variant="info">{row.action}</Badge>,
    },
    {
      label: 'Module',
      key: 'entity',
      render: (row) => row.entity || '—',
    },
    {
      label: 'Entity',
      key: 'entityId',
      render: (row) => (row.entityId != null ? `#${row.entityId}` : '—'),
    },
    {
      label: 'Description',
      key: 'details',
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)] max-w-md truncate block">{row.details || '—'}</span>
      ),
    },
    {
      label: 'Timestamp',
      key: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchLogs} />;

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <PageHeader title="Activity Logs" subtitle="Read-only audit trail of system actions">
        <button
          type="button"
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search action, user, details…"
          className="max-w-sm flex-1"
        />
        <FormSelect
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="max-w-[180px]"
        >
          <option value="">All modules</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </FormSelect>
      </div>

      <DataTable columns={columns} data={pageRows} emptyMessage="No activity recorded yet." />

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 py-1.5">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;

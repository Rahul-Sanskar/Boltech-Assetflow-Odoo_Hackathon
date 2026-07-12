import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorState from '../../../components/ui/ErrorState';
import { useToast } from '../../../context/ToastContext';
import { getErrorMessage, statusBadgeVariant } from '../../../utils/apiError';
import {
  Box,
  Building2,
  Wrench,
  Calendar,
  ArrowLeftRight,
  Download,
  RefreshCw,
  Tags,
} from 'lucide-react';

function countBy(items, keyFn) {
  const map = {};
  items.forEach((item) => {
    const key = keyFn(item);
    map[key] = (map[key] || 0) + 1;
  });
  return map;
}

const ReportsPage = () => {
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assetStatus, setAssetStatus] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [maintenanceSummary, setMaintenanceSummary] = useState([]);
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const fetchReports = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      API.get('/reports/assets-by-status'),
      API.get('/reports/assets-by-department'),
      API.get('/reports/assets-by-category'),
      API.get('/reports/maintenance-summary'),
      API.get('/assets'),
      API.get('/departments'),
      API.get('/bookings'),
      API.get('/transfers'),
      API.get('/maintenance'),
    ])
      .then(([statusRes, deptReportRes, catRes, maintSumRes, assetsRes, deptsRes, bookingsRes, transfersRes, maintRes]) => {
        setAssetStatus(statusRes.data.data || []);
        setByCategory(catRes.data.data || []);
        setMaintenanceSummary(maintSumRes.data.data || []);
        setAssets(assetsRes.data.data || []);
        // Prefer departments (employees + assets); fall back to report rows
        const depts = deptsRes.data.data || [];
        setDepartments(
          depts.length
            ? depts
            : (deptReportRes.data.data || []).map((d) => ({
                ...d,
                _count: { assets: d._count?.assets ?? 0, employees: 0 },
              }))
        );
        setBookings(bookingsRes.data.data || []);
        setTransfers(transfersRes.data.data || []);
        setMaintenance(maintRes.data.data || []);
      })
      .catch((err) => {
        setError(getErrorMessage(err, 'Failed to load reports'));
        toastError(getErrorMessage(err, 'Failed to load reports'));
      })
      .finally(() => setLoading(false));
  }, [toastError]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const statusMap = useMemo(() => {
    const map = Object.fromEntries(assetStatus.map((r) => [r.status, r.count]));
    // Disposed / Reserved not in report endpoint — compose from assets list
    map.Disposed = assets.filter((a) => a.status === 'Disposed').length;
    map.Reserved = assets.filter((a) => a.status === 'Reserved').length;
    map.Unavailable = assets.filter((a) => a.status === 'Unavailable').length;
    return map;
  }, [assetStatus, assets]);

  const statusTotal =
    (statusMap.Available || 0) +
    (statusMap.Allocated || 0) +
    (statusMap['Under Maintenance'] || 0) +
    (statusMap.Retired || 0) +
    (statusMap.Lost || 0) +
    (statusMap.Disposed || 0) +
    (statusMap.Reserved || 0) +
    (statusMap.Unavailable || 0);
  const totalAssets = assets.length || statusTotal;

  const deptRows = useMemo(() => {
    return departments.map((d) => {
      const deptAssets = assets.filter((a) => a.departmentId === d.id);
      return {
        id: d.id,
        name: d.name,
        employees: d._count?.employees ?? 0,
        assets: d._count?.assets ?? deptAssets.length,
        allocated: deptAssets.filter((a) => a.status === 'Allocated').length,
        available: deptAssets.filter((a) => a.status === 'Available').length,
      };
    });
  }, [departments, assets]);

  const maintenanceCounts = useMemo(() => {
    const fromReport = Object.fromEntries(maintenanceSummary.map((r) => [r.status, r.count]));
    const fromList = countBy(maintenance, (m) => m.status);
    return {
      Pending: fromReport.Pending ?? fromList.Pending ?? 0,
      Approved: fromList.Approved ?? 0,
      Rejected: fromList.Rejected ?? 0,
      'In Progress': fromReport['In Progress'] ?? fromList['In Progress'] ?? 0,
      Resolved: fromReport.Resolved ?? fromList.Resolved ?? 0,
    };
  }, [maintenanceSummary, maintenance]);

  const bookingCounts = useMemo(() => {
    const c = countBy(bookings, (b) => b.status);
    return {
      total: bookings.length,
      Upcoming: c.Upcoming || 0,
      Cancelled: c.Cancelled || 0,
    };
  }, [bookings]);

  const transferCounts = useMemo(() => {
    const c = countBy(transfers, (t) => t.status);
    return {
      Requested: c.Requested || 0,
      Approved: c.Approved || 0,
      Rejected: c.Rejected || 0,
    };
  }, [transfers]);

  const recentBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [bookings]
  );
  const recentTransfers = useMemo(
    () => [...transfers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [transfers]
  );
  const recentMaintenance = useMemo(
    () => [...maintenance].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [maintenance]
  );
  const recentAssets = useMemo(
    () => [...assets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [assets]
  );

  const deptColumns = [
    { label: 'Department', key: 'name' },
    { label: 'Employees', key: 'employees' },
    { label: 'Assets', key: 'assets' },
    { label: 'Allocated', key: 'allocated', render: (r) => <Badge variant="warning">{r.allocated}</Badge> },
    { label: 'Available', key: 'available', render: (r) => <Badge variant="success">{r.available}</Badge> },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchReports} />;

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <PageHeader title="Reports" subtitle="Operational summaries from live data">
        <button
          type="button"
          onClick={fetchReports}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          type="button"
          disabled
          title="Export is not available — backend has no export endpoints"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-surface-hover)] opacity-50 cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
        <button
          type="button"
          disabled
          title="Export is not available — backend has no export endpoints"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-surface-hover)] opacity-50 cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
      </PageHeader>

      {/* Asset Summary */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-[var(--brand-primary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Asset Summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Assets', value: totalAssets || assets.length, color: 'blue' },
            { label: 'Available', value: statusMap.Available || 0, color: 'green' },
            { label: 'Allocated', value: statusMap.Allocated || 0, color: 'amber' },
            { label: 'Maintenance', value: statusMap['Under Maintenance'] || 0, color: 'red' },
            { label: 'Lost', value: statusMap.Lost || 0, color: 'orange' },
            { label: 'Retired', value: statusMap.Retired || 0, color: 'indigo' },
            { label: 'Disposed', value: statusMap.Disposed || 0, color: 'purple' },
          ].map((card) => (
            <StatCard key={card.label} {...card} icon={<Box className="w-4 h-4" />} />
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Source: <code className="text-[11px]">/reports/assets-by-status</code>
          {' · '}Disposed counted from <code className="text-[11px]">/assets</code>
        </p>
      </section>

      {/* Department Summary */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--brand-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Department Summary</h2>
          </div>
          <Link to="/admin/departments" className="text-xs font-medium text-[var(--brand-primary)] hover:underline">
            Manage
          </Link>
        </div>
        <DataTable columns={deptColumns} data={deptRows} emptyMessage="No departments found." />
      </section>

      {/* Category breakdown from report API */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Tags className="w-5 h-5 text-[var(--brand-primary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Assets by Category</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {byCategory.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-4"
            >
              <p className="text-sm text-[var(--text-muted)] truncate">{c.name}</p>
              <p className="text-2xl font-bold text-[var(--text-main)] mt-1">{c._count?.assets ?? 0}</p>
            </div>
          ))}
          {byCategory.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] col-span-full">No category data</p>
          )}
        </div>
      </section>

      {/* Maintenance */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[var(--brand-primary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Maintenance Report</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(maintenanceCounts).map(([label, value]) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              color="orange"
              icon={<Wrench className="w-4 h-4" />}
            />
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Average resolution time is not provided by the backend and is hidden.
        </p>
      </section>

      {/* Bookings — composed */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--brand-primary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Booking Report</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total Bookings" value={bookingCounts.total} color="teal" icon={<Calendar className="w-4 h-4" />} />
          <StatCard label="Upcoming" value={bookingCounts.Upcoming} color="blue" icon={<Calendar className="w-4 h-4" />} />
          <StatCard label="Cancelled" value={bookingCounts.Cancelled} color="indigo" icon={<Calendar className="w-4 h-4" />} />
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          No dedicated booking report API — composed from <code className="text-[11px]">GET /bookings</code>.
          Active / Rejected booking statuses are not used by the backend.
        </p>
      </section>

      {/* Transfers — composed */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-[var(--brand-primary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Transfer Report</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Requested" value={transferCounts.Requested} color="amber" icon={<ArrowLeftRight className="w-4 h-4" />} />
          <StatCard label="Approved" value={transferCounts.Approved} color="green" icon={<ArrowLeftRight className="w-4 h-4" />} />
          <StatCard label="Rejected" value={transferCounts.Rejected} color="red" icon={<ArrowLeftRight className="w-4 h-4" />} />
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Composed from <code className="text-[11px]">GET /transfers</code>. &quot;Completed&quot; is not a backend status (Approved is terminal).
        </p>
      </section>

      {/* Quick statistics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-main)]">Quick Statistics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentPanel
            title="Recent Bookings"
            to="/admin/bookings"
            empty="No bookings"
            items={recentBookings.map((b) => ({
              id: b.id,
              primary: b.asset?.name,
              secondary: b.employee?.name,
              meta: new Date(b.startTime).toLocaleString(),
              badge: b.status,
            }))}
          />
          <RecentPanel
            title="Recent Transfers"
            to="/admin/transfers"
            empty="No transfers"
            items={recentTransfers.map((t) => ({
              id: t.id,
              primary: t.asset?.name,
              secondary: t.requestedBy?.name,
              meta: new Date(t.createdAt).toLocaleDateString(),
              badge: t.status,
            }))}
          />
          <RecentPanel
            title="Recent Maintenance"
            to="/admin/maintenance"
            empty="No maintenance"
            items={recentMaintenance.map((m) => ({
              id: m.id,
              primary: m.asset?.name,
              secondary: m.requestedBy?.name,
              meta: new Date(m.createdAt).toLocaleDateString(),
              badge: m.status,
            }))}
          />
          <RecentPanel
            title="Recent Assets"
            to="/admin/assets"
            empty="No assets"
            items={recentAssets.map((a) => ({
              id: a.id,
              primary: a.name,
              secondary: a.assetTag,
              meta: a.department?.name,
              badge: a.status,
            }))}
          />
        </div>
      </section>
    </div>
  );
};

function RecentPanel({ title, to, items, empty }) {
  return (
    <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border-light)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-main)]">{title}</h3>
        <Link to={to} className="text-xs font-medium text-[var(--brand-primary)] hover:underline">
          View all
        </Link>
      </div>
      <div className="divide-y divide-[var(--border-light)]">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">{empty}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-main)] truncate">{item.primary}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {item.secondary}
                  {item.meta ? ` · ${item.meta}` : ''}
                </p>
              </div>
              {item.badge && <Badge variant={statusBadgeVariant(item.badge)}>{item.badge}</Badge>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ReportsPage;

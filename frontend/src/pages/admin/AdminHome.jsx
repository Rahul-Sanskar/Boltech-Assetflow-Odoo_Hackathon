import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/API.js';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import ErrorState from '../../components/ui/ErrorState';
import { getErrorMessage, statusBadgeVariant } from '../../utils/apiError';
import {
  Box,
  CheckCircle,
  Clipboard,
  Wrench,
  Users,
  Building,
  RefreshCw,
  Bell,
  ArrowLeftRight,
  Calendar,
  FileBarChart,
  Package,
} from 'lucide-react';

const AdminHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useNotifications();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [pendingMaintenance, setPendingMaintenance] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      API.get('/dashboard'),
      API.get('/transfers').catch(() => ({ data: { data: [] } })),
      API.get('/maintenance').catch(() => ({ data: { data: [] } })),
      API.get('/bookings').catch(() => ({ data: { data: [] } })),
      API.get('/assets').catch(() => ({ data: { data: [] } })),
      API.get('/notifications/activity-logs').catch(() => ({ data: { data: [] } })),
    ])
      .then(([dashRes, transfersRes, maintRes, bookingsRes, assetsRes, logsRes]) => {
        setStats(dashRes.data.data || dashRes.data);
        const transfers = transfersRes.data.data || [];
        const maintenance = maintRes.data.data || [];
        const bookings = bookingsRes.data.data || [];
        const assets = assetsRes.data.data || [];
        setPendingTransfers(transfers.filter((t) => t.status === 'Requested').slice(0, 5));
        setPendingMaintenance(maintenance.filter((m) => m.status === 'Pending').slice(0, 5));
        setRecentBookings(
          [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
        );
        setRecentAssets(
          [...assets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
        );
        setActivityLogs((logsRes.data.data || []).slice(0, 8));
      })
      .catch((err) => {
        setStats(null);
        setError(getErrorMessage(err, 'Failed to load dashboard'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return <ErrorState title="Dashboard unavailable" message={error} onRetry={fetchDashboard} />;
  }

  const s = stats?.stats || {};
  const recentNotifications = notifications.slice(0, 5);
  const recentAllocations = stats?.recentAllocations || [];
  const recentMaintenanceDash = stats?.recentMaintenance || [];

  const statCards = [
    { label: 'Total Assets', value: s.totalAssets ?? 0, color: 'blue', icon: <Box className="w-5 h-5" />, to: '/admin/assets' },
    { label: 'Available', value: s.availableAssets ?? 0, color: 'green', icon: <CheckCircle className="w-5 h-5" />, to: '/admin/assets' },
    { label: 'Allocated', value: s.allocatedAssets ?? 0, color: 'amber', icon: <Clipboard className="w-5 h-5" />, to: '/admin/allocations' },
    { label: 'Under Maintenance', value: s.underMaintenance ?? 0, color: 'red', icon: <Wrench className="w-5 h-5" />, to: '/admin/maintenance' },
    { label: 'Employees', value: s.totalEmployees ?? 0, color: 'purple', icon: <Users className="w-5 h-5" />, to: '/admin/employees' },
    { label: 'Departments', value: s.totalDepartments ?? 0, color: 'indigo', icon: <Building className="w-5 h-5" />, to: '/admin/departments' },
    { label: 'Pending Requests', value: s.pendingMaintenance ?? 0, color: 'orange', icon: <Wrench className="w-5 h-5" />, to: '/admin/maintenance' },
    { label: 'Active Bookings', value: s.activeBookings ?? 0, color: 'teal', icon: <Calendar className="w-5 h-5" />, to: '/admin/bookings' },
  ];

  const quickActions = [
    { label: 'Add Asset', to: '/admin/assets', icon: Package },
    { label: 'New Allocation', to: '/admin/allocations', icon: Clipboard },
    { label: 'Transfers', to: '/admin/transfers', icon: ArrowLeftRight },
    { label: 'Audits', to: '/admin/audits', icon: FileBarChart },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Reports', to: '/admin/reports', icon: FileBarChart },
  ];

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Here&apos;s what&apos;s happening with your assets today.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <button
            key={card.label}
            type="button"
            onClick={() => navigate(card.to)}
            style={{ animationDelay: `${i * 60}ms` }}
            className="text-left animate-[slideUp_0.5s_ease-out_both] rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            <StatCard {...card} />
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text-main)]">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-4 text-center hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <span className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold text-[var(--text-main)]">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <Panel
          title="Recent Notifications"
          badge={unreadCount}
          badgeVariant="warning"
          to="/admin/notifications"
          empty="No notifications"
          icon={<Bell className="w-4 h-4" />}
          iconClass="bg-violet-500/10 text-violet-600"
        >
          {recentNotifications.map((n) => (
            <Row
              key={n.id}
              onClick={() => navigate('/admin/notifications')}
              primary={n.type}
              secondary={n.message}
              meta={new Date(n.createdAt).toLocaleDateString()}
              badge={n.isRead ? 'Read' : 'Unread'}
              badgeVariant={n.isRead ? 'default' : 'warning'}
            />
          ))}
        </Panel>

<<<<<<< HEAD
      {!stats && (
        <div className="text-center text-gray-500 py-12">
          <p>Unable to load dashboard data.</p>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">✨ AI Business Insights</h2>
        <p className="text-sm text-gray-500 mb-2">Get an AI-generated summary of your organization's asset health.</p>
        <AiAction
          label="Generate Business Insights"
          endpoint="/ai/dashboard"
          payload={{
            available: stats?.stats?.availableAssets || 0,
            allocated: stats?.stats?.allocatedAssets || 0,
            maintenance: stats?.stats?.underMaintenance || 0,
            overdue: stats?.stats?.pendingMaintenance || 0,
          }}
          render={(d) => (
            <div className="space-y-1">
              <p><strong>Summary:</strong> {d.summary}</p>
              <p><strong>Top Insight:</strong> {d.topInsight}</p>
              <p><strong>Biggest Risk:</strong> {d.biggestRisk}</p>
              <p><strong>Recommendation:</strong> {d.recommendation}</p>
            </div>
          )}
        />
=======
        {/* Pending Transfers */}
        <Panel
          title="Pending Transfers"
          badge={pendingTransfers.length}
          to="/admin/transfers"
          empty="No pending transfers"
          icon={<ArrowLeftRight className="w-4 h-4" />}
          iconClass="bg-amber-500/10 text-amber-600"
        >
          {pendingTransfers.map((t) => (
            <Row
              key={t.id}
              onClick={() => navigate('/admin/transfers')}
              primary={t.asset?.name}
              secondary={t.asset?.assetTag || '—'}
              meta={t.requestedBy?.name}
              badge={t.status}
              badgeVariant={statusBadgeVariant(t.status)}
            />
          ))}
        </Panel>

        {/* Pending Maintenance */}
        <Panel
          title="Pending Maintenance"
          badge={pendingMaintenance.length}
          to="/admin/maintenance"
          empty="No pending maintenance"
          icon={<Wrench className="w-4 h-4" />}
          iconClass="bg-orange-500/10 text-orange-600"
        >
          {pendingMaintenance.map((m) => (
            <Row
              key={m.id}
              onClick={() => navigate('/admin/maintenance')}
              primary={m.asset?.name}
              secondary={`By ${m.requestedBy?.name || '—'}`}
              meta={new Date(m.createdAt).toLocaleDateString()}
              badge={m.status}
              badgeVariant="warning"
            />
          ))}
        </Panel>

        {/* Recent Bookings */}
        <Panel
          title="Recent Bookings"
          badge={recentBookings.length}
          to="/admin/bookings"
          empty="No bookings"
          icon={<Calendar className="w-4 h-4" />}
          iconClass="bg-teal-500/10 text-teal-600"
        >
          {recentBookings.map((b) => (
            <Row
              key={b.id}
              onClick={() => navigate('/admin/bookings')}
              primary={b.asset?.name}
              secondary={b.employee?.name}
              meta={new Date(b.startTime).toLocaleDateString()}
              badge={b.status}
              badgeVariant={statusBadgeVariant(b.status)}
            />
          ))}
        </Panel>

        {/* Recent Assets */}
        <Panel
          title="Recent Assets"
          badge={recentAssets.length}
          to="/admin/assets"
          empty="No assets"
          icon={<Package className="w-4 h-4" />}
          iconClass="bg-blue-500/10 text-blue-600"
        >
          {recentAssets.map((a) => (
            <Row
              key={a.id}
              onClick={() => navigate('/admin/assets')}
              primary={a.name}
              secondary={a.assetTag}
              meta={a.department?.name}
              badge={a.status}
              badgeVariant={statusBadgeVariant(a.status)}
            />
          ))}
        </Panel>

        {/* Recent Allocations (from dashboard API) */}
        <Panel
          title="Recent Allocations"
          badge={recentAllocations.length}
          to="/admin/allocations"
          empty="No recent allocations"
          icon={<Box className="w-4 h-4" />}
          iconClass="bg-blue-500/10 text-blue-600"
        >
          {recentAllocations.slice(0, 5).map((a) => (
            <Row
              key={a.id}
              onClick={() => navigate('/admin/allocations')}
              primary={a.asset?.name}
              secondary={a.asset?.assetTag}
              meta={a.employee?.name}
              badge={new Date(a.allocatedDate || a.createdAt).toLocaleDateString()}
              badgeVariant="info"
            />
          ))}
        </Panel>
      </div>

      {/* Recent Activity + Maintenance from dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Recent Activity"
          badge={activityLogs.length}
          to="/admin/reports"
          empty="No activity logs"
          icon={<FileBarChart className="w-4 h-4" />}
          iconClass="bg-indigo-500/10 text-indigo-600"
        >
          {activityLogs.map((log) => (
            <div
              key={log.id}
              className="px-6 py-3.5 flex items-start justify-between gap-3 hover:bg-[var(--bg-surface-hover)]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-main)] truncate">
                  {log.action} · {log.entity}
                  {log.entityId != null ? ` #${log.entityId}` : ''}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {log.user?.name || 'System'}
                  {log.details ? ` — ${log.details}` : ''}
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)] shrink-0">
                {new Date(log.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </Panel>

        <Panel
          title="Recent Maintenance"
          badge={recentMaintenanceDash.length}
          to="/admin/maintenance"
          empty="No recent maintenance"
          icon={<Wrench className="w-4 h-4" />}
          iconClass="bg-amber-500/10 text-amber-600"
        >
          {recentMaintenanceDash.slice(0, 5).map((m) => (
            <Row
              key={m.id}
              onClick={() => navigate('/admin/maintenance')}
              primary={m.asset?.name}
              secondary={`Requested by ${m.requestedBy?.name || '—'}`}
              meta={new Date(m.createdAt).toLocaleDateString()}
              badge={m.status}
              badgeVariant={statusBadgeVariant(m.status)}
            />
          ))}
        </Panel>
>>>>>>> main
      </div>
    </div>
  );
};

function Panel({ title, badge, badgeVariant = 'info', to, empty, children, icon, iconClass }) {
  const items = React.Children.toArray(children);
  return (
    <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border-light)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconClass}`}>
              {icon}
            </span>
          )}
          <h2 className="text-base font-semibold text-[var(--text-main)]">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {badge != null && <Badge variant={badgeVariant}>{badge}</Badge>}
          <Link to={to} className="text-xs font-medium text-[var(--brand-primary)] hover:underline">
            View all
          </Link>
        </div>
      </div>
      <div className="divide-y divide-[var(--border-light)]">
        {items.length > 0 ? items : (
          <div className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">{empty}</div>
        )}
      </div>
    </div>
  );
}

function Row({ onClick, primary, secondary, meta, badge, badgeVariant }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-[var(--bg-surface-hover)] transition-colors text-left"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text-main)] truncate">{primary}</p>
        <p className="text-xs text-[var(--text-muted)] truncate">{secondary}</p>
      </div>
      <div className="text-right shrink-0 ml-3 space-y-1">
        {badge != null && <Badge variant={badgeVariant || 'default'}>{badge}</Badge>}
        {meta && <p className="text-xs text-[var(--text-muted)]">{meta}</p>}
      </div>
    </button>
  );
}

export default AdminHome;

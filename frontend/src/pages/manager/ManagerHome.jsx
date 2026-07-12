import React, { useState, useEffect } from 'react';
import API from '../../api/API.js';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { Box, CheckCircle, Clipboard, Wrench, Users, Building, AlertCircle, CalendarClock } from 'lucide-react';

const ManagerHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard')
      .then((res) => setStats(res.data.data || res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const statCards = stats?.stats ? [
    { label: 'Total Assets', value: stats.stats.totalAssets, color: 'blue', icon: <Box className="w-5 h-5" /> },
    { label: 'Available', value: stats.stats.availableAssets, color: 'green', icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'Allocated', value: stats.stats.allocatedAssets, color: 'amber', icon: <Clipboard className="w-5 h-5" /> },
    { label: 'Under Maintenance', value: stats.stats.underMaintenance, color: 'red', icon: <Wrench className="w-5 h-5" /> },
    { label: 'Employees', value: stats.stats.totalEmployees, color: 'purple', icon: <Users className="w-5 h-5" /> },
    { label: 'Departments', value: stats.stats.totalDepartments, color: 'indigo', icon: <Building className="w-5 h-5" /> },
    { label: 'Pending Requests', value: stats.stats.pendingMaintenance, color: 'orange', icon: <AlertCircle className="w-5 h-5" /> },
    { label: 'Active Bookings', value: stats.stats.activeBookings, color: 'teal', icon: <CalendarClock className="w-5 h-5" /> },
  ] : [];

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">
          Welcome back, {user?.name?.split(' ')[0] || 'Manager'}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Your department overview at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={card.label} style={{ animationDelay: `${i * 60}ms` }} className="animate-[slideUp_0.5s_ease-out_both]">
            <StatCard {...card} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden animate-[slideUp_0.5s_ease-out_0.3s_both]">
          <div className="px-6 py-4 border-b border-[var(--border-light)] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text-main)]">Recent Allocations</h2>
            <Badge variant="info">{stats?.recentAllocations?.length || 0} total</Badge>
          </div>
          <div className="divide-y divide-[var(--border-light)]">
            {stats?.recentAllocations?.length > 0 ? (
              stats.recentAllocations.slice(0, 5).map((a, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <Box className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-main)]">{a.asset?.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{a.asset?.assetTag}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--text-main)]">{a.employee?.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">No recent allocations</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden animate-[slideUp_0.5s_ease-out_0.4s_both]">
          <div className="px-6 py-4 border-b border-[var(--border-light)] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text-main)]">Maintenance Requests</h2>
            <Badge variant="warning">{stats?.recentMaintenance?.length || 0} recent</Badge>
          </div>
          <div className="divide-y divide-[var(--border-light)]">
            {stats?.recentMaintenance?.length > 0 ? (
              stats.recentMaintenance.slice(0, 5).map((m, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-main)]">{m.asset?.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">Requested by {m.requestedBy?.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">No pending maintenance</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerHome;
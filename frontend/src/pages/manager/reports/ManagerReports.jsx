import React, { useState, useEffect } from 'react';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Badge from '../../../components/ui/Badge';
import { BarChart3, PieChart, Wrench } from 'lucide-react';

const ManagerReports = () => {
  const [byStatus, setByStatus] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byDepartment, setByDepartment] = useState([]);
  const [maintenanceSummary, setMaintenanceSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    Promise.all([
      API.get('/reports/assets-by-status').then((res) => setByStatus(res.data.data || [])).catch(() => {}),
      API.get('/reports/assets-by-category').then((res) => setByCategory(res.data.data || [])).catch(() => {}),
      API.get('/reports/assets-by-department').then((res) => setByDepartment(res.data.data || [])).catch(() => {}),
      API.get('/reports/maintenance-summary').then((res) => setMaintenanceSummary(res.data.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const tabs = [
    { key: 'status', label: 'By Status', icon: BarChart3 },
    { key: 'category', label: 'By Category', icon: PieChart },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
  ];

  const statusColors = {
    Available: 'bg-emerald-500',
    Allocated: 'bg-amber-500',
    'Under Maintenance': 'bg-red-500',
    Retired: 'bg-gray-400',
    Lost: 'bg-purple-500',
  };

  const maintenanceColors = {
    Pending: 'bg-amber-500',
    'In Progress': 'bg-blue-500',
    Resolved: 'bg-emerald-500',
  };

  const totalAssets = byStatus.reduce((sum, s) => sum + s.count, 0) || 1;
  const totalMaintenance = maintenanceSummary.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <PageHeader title="Reports & Analytics" subtitle="Department-scoped insights" />

      <div className="flex gap-2 border-b border-[var(--border-light)] pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 -mb-px
                ${activeTab === tab.key
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-light)]'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
            <h3 className="text-base font-semibold text-[var(--text-main)] mb-4">Assets by Status</h3>
            <div className="space-y-4">
              {byStatus.map((item) => (
                <div key={item.status}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-[var(--text-main)] font-medium">{item.status}</span>
                    <span className="text-[var(--text-muted)]">{item.count}</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${statusColors[item.status] || 'bg-gray-400'}`}
                      style={{ width: `${(item.count / totalAssets) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
            <h3 className="text-base font-semibold text-[var(--text-main)] mb-4">Assets by Category</h3>
            <div className="space-y-3">
              {byCategory.filter(c => c._count?.assets > 0).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-surface-hover)]/80 transition-colors">
                  <span className="text-sm font-medium text-[var(--text-main)]">{item.name}</span>
                  <Badge variant="info">{item._count?.assets} assets</Badge>
                </div>
              ))}
              {byCategory.filter(c => c._count?.assets > 0).length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">No categorized assets</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'category' && (
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
          <h3 className="text-base font-semibold text-[var(--text-main)] mb-4">Department Summary</h3>
          <div className="space-y-3">
            {byDepartment.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-surface-hover)]/80 transition-colors">
                <div>
                  <p className="text-sm font-medium text-[var(--text-main)]">{dept.name}</p>
                </div>
                <Badge variant="info">{dept._count?.assets} assets</Badge>
              </div>
            ))}
            {byDepartment.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No department data</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
          <h3 className="text-base font-semibold text-[var(--text-main)] mb-4">Maintenance Summary</h3>
          <div className="space-y-4">
            {maintenanceSummary.map((item) => (
              <div key={item.status}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[var(--text-main)] font-medium">{item.status}</span>
                  <span className="text-[var(--text-muted)]">{item.count}</span>
                </div>
                <div className="w-full h-3 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${maintenanceColors[item.status] || 'bg-gray-400'}`}
                    style={{ width: `${(item.count / totalMaintenance) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {maintenanceSummary.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No maintenance data</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerReports;

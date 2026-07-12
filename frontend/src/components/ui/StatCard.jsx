import React from 'react';

const StatCard = ({ label, value, icon, color, trend, trendValue }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', iconBg: 'bg-blue-500/15' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/15' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', iconBg: 'bg-amber-500/15' },
    red: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', iconBg: 'bg-red-500/15' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20', iconBg: 'bg-purple-500/15' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/20', iconBg: 'bg-indigo-500/15' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-500/20', iconBg: 'bg-teal-500/15' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20', iconBg: 'bg-orange-500/15' },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border ${c.border} ${c.bg} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-default`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
          <p className={`text-3xl font-bold tracking-tight ${c.text}`}>{value}</p>
          {trend && (
            <div className={`inline-flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`${c.iconBg} ${c.text} rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
      </div>
      <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full ${c.iconBg} opacity-30 transition-transform duration-500 group-hover:scale-150`} />
    </div>
  );
};

export default StatCard;

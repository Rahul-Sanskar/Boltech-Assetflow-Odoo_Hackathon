import React from 'react';
import { Plus } from 'lucide-react';

const PageHeader = ({ title, subtitle, actionLabel, onAction, children }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {actionLabel && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

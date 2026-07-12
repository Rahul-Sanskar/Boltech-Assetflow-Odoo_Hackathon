import React from 'react';
import { Box } from 'lucide-react';

const DataTable = ({ columns, data, onRowClick, emptyMessage = 'No data found' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-12 text-center animate-[fadeIn_0.3s_ease-out]">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--bg-surface-hover)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
          <Box className="w-8 h-8" />
        </div>
        <p className="text-[var(--text-muted)] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden animate-[fadeIn_0.4s_ease-out]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-light)] bg-[var(--bg-surface-hover)]/50">
              {columns.map((col, i) => (
                <th key={i} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-[var(--bg-surface-hover)]' : ''}`}
                style={{ animationDelay: `${rowIndex * 30}ms` }}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-5 py-4 text-sm text-[var(--text-main)] whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;

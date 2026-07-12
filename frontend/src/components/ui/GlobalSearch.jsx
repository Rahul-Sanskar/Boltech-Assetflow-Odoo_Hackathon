import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import API from '../../api/API';

const MODULES = [
  { key: 'assets', path: '/admin/assets', label: 'Asset', endpoint: '/assets', fields: ['name', 'assetTag'] },
  { key: 'employees', path: '/admin/employees', label: 'Employee', endpoint: '/employees', fields: ['name', 'email'] },
  { key: 'departments', path: '/admin/departments', label: 'Department', endpoint: '/departments', fields: ['name'] },
  { key: 'categories', path: '/admin/categories', label: 'Category', endpoint: '/categories', fields: ['name'] },
  { key: 'transfers', path: '/admin/transfers', label: 'Transfer', endpoint: '/transfers', fields: ['status'], nameFn: (r) => r.asset?.name },
  { key: 'bookings', path: '/admin/bookings', label: 'Booking', endpoint: '/bookings', fields: ['status'], nameFn: (r) => r.asset?.name },
  { key: 'maintenance', path: '/admin/maintenance', label: 'Maintenance', endpoint: '/maintenance', fields: ['status', 'priority'], nameFn: (r) => r.asset?.name },
];

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(null);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const loadingRef = useRef(false);
  const indexRef = useRef(null);

  const loadIndex = useCallback(() => {
    if (indexRef.current || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    Promise.all(
      MODULES.map((m) =>
        API.get(m.endpoint)
          .then((res) => ({ key: m.key, data: res.data.data || [] }))
          .catch(() => ({ key: m.key, data: [] }))
      )
    )
      .then((results) => {
        const map = {};
        results.forEach((r) => {
          map[r.key] = r.data;
        });
        indexRef.current = map;
        setIndex(map);
      })
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });
  }, []);

  const openSearch = useCallback(() => {
    setOpen(true);
    loadIndex();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [loadIndex]);

  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [openSearch]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !index) return [];
    const hits = [];
    MODULES.forEach((mod) => {
      const rows = index[mod.key] || [];
      rows.forEach((row) => {
        const primary = mod.nameFn ? mod.nameFn(row) : row[mod.fields[0]];
        const hay = [primary, ...mod.fields.map((f) => row[f]), row.assetTag, row.email, row.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (hay.includes(q)) {
          hits.push({
            id: `${mod.key}-${row.id}`,
            module: mod.label,
            path: mod.path,
            title: primary || `${mod.label} #${row.id}`,
            subtitle: row.assetTag || row.email || row.status || `#${row.id}`,
          });
        }
      });
    });
    return hits.slice(0, 12);
  }, [query, index]);

  return (
    <div className="relative flex-1 max-w-md hidden md:block" ref={rootRef}>
      <button
        type="button"
        onClick={openSearch}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] text-sm text-[var(--text-muted)] hover:border-[var(--border-focus)] transition-colors"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Search assets, people, workflows…</span>
        <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-light)]">Ctrl K</kbd>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-xl z-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border-light)]">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="flex-1 bg-transparent text-sm text-[var(--text-main)] outline-none"
            />
            {loading && <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!query.trim() && (
              <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                No dedicated search API — results are filtered from loaded module lists.
              </p>
            )}
            {query.trim() && !loading && results.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No matches</p>
            )}
            {results.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  setQuery('');
                  navigate(hit.path);
                }}
                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-surface-hover)] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-main)] truncate">{hit.title}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{hit.subtitle}</p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] shrink-0">
                  {hit.module}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const LABELS = {
  admin: 'Admin',
  home: 'Dashboard',
  assets: 'Assets',
  categories: 'Categories',
  departments: 'Departments',
  employees: 'Employees',
  allocations: 'Allocations',
  transfers: 'Transfers',
  bookings: 'Bookings',
  maintenance: 'Maintenance',
  reports: 'Reports',
  notifications: 'Notifications',
  users: 'Users',
  audits: 'Audits',
  activity: 'Activity',
  settings: 'Settings',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const crumbs = parts.map((part, index) => {
    const path = '/' + parts.slice(0, index + 1).join('/');
    return {
      path,
      label: LABELS[part] || part.charAt(0).toUpperCase() + part.slice(1),
      isLast: index === parts.length - 1,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
        <li>
          <Link
            to="/admin/home"
            className="inline-flex items-center gap-1 hover:text-[var(--text-main)] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} className="inline-flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 opacity-50" aria-hidden />
            {crumb.isLast ? (
              <span className="font-semibold text-[var(--text-main)]" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.path} className="hover:text-[var(--text-main)] transition-colors">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, FileQuestion, Lock } from 'lucide-react';

export function NotFoundPage() {
  return (
    <ErrorShell
      icon={<FileQuestion className="w-8 h-8" />}
      code="404"
      title="Page not found"
      message="The page you requested does not exist or has been moved."
      primaryTo="/admin/home"
      primaryLabel="Go to Dashboard"
    />
  );
}

export function ForbiddenPage() {
  return (
    <ErrorShell
      icon={<ShieldAlert className="w-8 h-8" />}
      code="403"
      title="Access denied"
      message="You do not have permission to view this resource."
      primaryTo="/admin/home"
      primaryLabel="Go to Dashboard"
    />
  );
}

export function UnauthorizedPage() {
  return (
    <ErrorShell
      icon={<Lock className="w-8 h-8" />}
      code="401"
      title="Unauthorized"
      message="Please sign in to continue."
      primaryTo="/login"
      primaryLabel="Sign in"
    />
  );
}

function ErrorShell({ icon, code, title, message, primaryTo, primaryLabel }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-6">
      <div className="max-w-md w-full text-center space-y-5 animate-[fadeIn_0.4s_ease-out]">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
          {icon}
        </div>
        <p className="text-sm font-bold tracking-widest text-[var(--brand-primary)]">{code}</p>
        <h1 className="text-2xl font-bold text-[var(--text-main)]">{title}</h1>
        <p className="text-sm text-[var(--text-muted)]">{message}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to={primaryTo}
            className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold hover:bg-[var(--brand-hover)]"
          >
            {primaryLabel}
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

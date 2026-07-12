import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => (
  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center animate-[fadeIn_0.3s_ease-out]">
    <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
      <AlertCircle className="w-7 h-7" />
    </div>
    <h3 className="text-base font-semibold text-[var(--text-main)] mb-1">{title}</h3>
    {message && <p className="text-sm text-[var(--text-muted)] mb-5 max-w-md mx-auto">{message}</p>}
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold transition-all active:scale-95"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    )}
  </div>
);

export default ErrorState;

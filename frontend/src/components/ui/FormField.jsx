import React from 'react';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-light)] text-sm text-[var(--text-main)] focus:border-[var(--border-focus)] focus:outline-none transition-colors';

export function FormField({ label, children, error, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">{label}</label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function FormInput({ className = '', ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

/** @deprecated use FormInput */
export const TextInput = FormInput;

export function FormSelect({ className = '', children, ...props }) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function FormTextarea({ className = '', ...props }) {
  return <textarea className={`${inputClass} resize-none ${className}`} {...props} />;
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputClass} max-w-xs ${className}`}
    />
  );
}

export { inputClass };

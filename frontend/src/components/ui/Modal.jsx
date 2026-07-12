import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose} />
      <div className={`relative ${sizeMap[size]} w-full bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-light)] shadow-2xl animate-[slideUp_0.3s_ease-out]`}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)]">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info', duration = 3500) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      toast: push,
      success: (msg) => push(msg, 'success'),
      error: (msg) => push(msg, 'error', 5000),
      info: (msg) => push(msg, 'info'),
    }),
    [push]
  );

  const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const styleMap = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[min(100%-2rem,24rem)] pointer-events-none">
        {toasts.map((t) => {
          const Icon = iconMap[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md animate-[slideDown_0.25s_ease-out] ${styleMap[t.type] || styleMap.info}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}

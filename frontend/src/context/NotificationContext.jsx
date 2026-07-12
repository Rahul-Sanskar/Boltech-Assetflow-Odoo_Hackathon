import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import API from '../api/API';
import { getErrorMessage } from '../utils/apiError';
import { useToast } from './ToastContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (opts = { silent: false }) => {
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load notifications');
      setError(msg);
      if (!opts.silent) toastError(msg);
    } finally {
      if (!opts.silent) setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markAsRead = useCallback(
    async (id) => {
      try {
        await API.patch(`/notifications/${id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        toastError(getErrorMessage(err, 'Failed to mark as read'));
        throw err;
      }
    },
    [toastError]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await API.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toastSuccess('All notifications marked as read');
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to mark all as read'));
      throw err;
    }
  }, [toastError, toastSuccess]);

  const value = useMemo(
    () => ({
      notifications,
      loading,
      error,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, loading, error, unreadCount, fetchNotifications, markAsRead, markAllAsRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}

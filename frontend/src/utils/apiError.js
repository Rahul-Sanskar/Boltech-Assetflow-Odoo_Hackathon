/**
 * Extract a user-facing message from an Axios / API error.
 */
export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;
  const data = err.response?.data;
  if (data?.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    return typeof first === 'string' ? first : first?.message || fallback;
  }
  if (err.message === 'Network Error') return 'Unable to reach the server. Check your connection.';
  return err.message || fallback;
}

export function isActiveAllocation(allocation) {
  if (!allocation) return false;
  if (allocation.status === 'Returned') return false;
  if (allocation.status === 'Allocated') return true;
  return !allocation.returnedDate;
}

export function statusBadgeVariant(status) {
  const map = {
    Available: 'success',
    Allocated: 'warning',
    Reserved: 'info',
    'Under Maintenance': 'danger',
    Lost: 'danger',
    Retired: 'default',
    Disposed: 'default',
    Unavailable: 'default',
    Active: 'success',
    Inactive: 'default',
    Pending: 'warning',
    Approved: 'info',
    'In Progress': 'purple',
    Resolved: 'success',
    Rejected: 'danger',
    Requested: 'warning',
    Upcoming: 'info',
    Cancelled: 'default',
    Open: 'info',
    Closed: 'success',
    Found: 'success',
    Missing: 'danger',
    Damaged: 'warning',
    ADMIN: 'danger',
    MANAGER: 'warning',
    EMPLOYEE: 'info',
    New: 'success',
    Good: 'info',
    Fair: 'warning',
    Poor: 'danger',
  };
  return map[status] || 'default';
}

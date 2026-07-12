import React from 'react';

const LoadingSpinner = ({ size = 'md' }) => {
  const sizeMap = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center h-64">
      <div className={`${sizeMap[size]} animate-spin rounded-full border-[3px] border-[var(--border-light)] border-t-[var(--brand-primary)]`} />
    </div>
  );
};

export default LoadingSpinner;

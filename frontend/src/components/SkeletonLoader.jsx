import React from 'react';

export const SkeletonBox = ({ width = '100%', height = 20, className = '' }) => (
  <div
    className={`ox-skeleton-item ${className}`}
    style={{
      width,
      height,
      backgroundColor: '#E4E4E7',
      borderRadius: '2px',
      opacity: 0.7,
      animation: 'oxPulse 1.5s ease-in-out infinite'
    }}
  />
);

export const SkeletonCard = () => (
  <div className="p-4 border border-dark bg-white rounded-1 mb-3">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <SkeletonBox width="40%" height={24} />
      <SkeletonBox width="20%" height={20} />
    </div>
    <SkeletonBox width="80%" height={16} className="mb-2" />
    <SkeletonBox width="60%" height={16} className="mb-3" />
    <div className="d-flex gap-2">
      <SkeletonBox width={100} height={32} />
      <SkeletonBox width={100} height={32} />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 4 }) => (
  <div className="border border-dark bg-white rounded-1 overflow-hidden">
    <div className="p-3 border-bottom border-dark bg-light d-flex gap-4">
      <SkeletonBox width="20%" height={16} />
      <SkeletonBox width="30%" height={16} />
      <SkeletonBox width="20%" height={16} />
      <SkeletonBox width="15%" height={16} />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-3 border-bottom border-subtle d-flex gap-4 align-items-center">
        <SkeletonBox width="20%" height={18} />
        <SkeletonBox width="30%" height={18} />
        <SkeletonBox width="20%" height={18} />
        <SkeletonBox width="15%" height={28} />
      </div>
    ))}
  </div>
);

export default SkeletonBox;

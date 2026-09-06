import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeStyle = (statusKey) => {
    switch (statusKey) {
      case 'APPROVED':
      case 'VERIFIED':
        return {
          symbol: '●',
          label: 'VERIFIED',
          bg: '#000000',
          text: '#FFFFFF',
          border: '#000000'
        };
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'IN_REVIEW':
        return {
          symbol: '◐',
          label: 'IN REVIEW',
          bg: '#FFFFFF',
          text: '#000000',
          border: '#000000'
        };
      case 'CORRECTION_REQUIRED':
      case 'REJECTED':
      case 'NEEDS_ATTENTION':
        return {
          symbol: '!',
          label: 'NEEDS ATTENTION',
          bg: '#1E1E22',
          text: '#FFFFFF',
          border: '#000000'
        };
      case 'PENDING_APPROVAL':
        return {
          symbol: '⏱',
          label: 'AWAITING SIGN-OFF',
          bg: '#000000',
          text: '#FFFFFF',
          border: '#000000'
        };
      case 'DRAFT':
      default:
        return {
          symbol: '○',
          label: 'WAITING',
          bg: '#F4F4F5',
          text: '#64646E',
          border: '#E4E4E7'
        };
    }
  };

  const style = getBadgeStyle(status);

  return (
    <span
      className="d-inline-flex align-items-center gap-1.5 px-2 py-0.5 font-mono flex-shrink-0"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        borderRadius: '2px',
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        lineHeight: 1.2
      }}
    >
      <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{style.symbol}</span>
      <span>{style.label}</span>
    </span>
  );
};

export default StatusBadge;

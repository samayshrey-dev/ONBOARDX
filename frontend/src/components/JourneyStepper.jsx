import React from 'react';

const JourneyStepper = ({ status, currentStageOverride }) => {
  const getActiveStageIndex = (appStatus) => {
    if (currentStageOverride !== undefined) return currentStageOverride;
    switch (appStatus) {
      case 'DRAFT':
      case 'CORRECTION_REQUIRED':
        return 1; // Documents stage
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 2; // Verification stage
      case 'PENDING_APPROVAL':
      case 'APPROVED':
      case 'REJECTED':
        return 3; // Approval stage
      default:
        return 0; // Registration
    }
  };

  const activeIndex = getActiveStageIndex(status);

  const stages = [
    { label: 'REGISTRATION', desc: 'Account & Profile Setup' },
    { label: 'DOCUMENTS', desc: 'Upload Compliance Files' },
    { label: 'VERIFICATION', desc: 'Reviewer Document Check' },
    { label: 'APPROVAL', desc: 'Executive Sign-off' },
  ];

  return (
    <div className="w-100 py-2">
      {/* Editorial Stepper Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 border-dark">
        <span className="font-mono text-uppercase small fw-bold tracking-wider">
          ONBOARDING JOURNEY
        </span>
        <span className="font-mono text-uppercase small text-muted">
          STAGE 0{activeIndex + 1} OF 04
        </span>
      </div>

      <div className="row g-3">
        {stages.map((stage, idx) => {
          const isPast = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          let cardBg = '#FFFFFF';
          let textColor = '#0F0F11';
          let borderStyle = '1px solid #E4E4E7';
          let tagText = '○ UPCOMING';
          let tagClass = 'text-muted';

          if (isPast) {
            cardBg = '#F4F4F5';
            borderStyle = '1px solid #000000';
            tagText = '● COMPLETED';
            tagClass = 'fw-bold text-dark';
          } else if (isCurrent) {
            cardBg = '#000000';
            textColor = '#FFFFFF';
            borderStyle = '1px solid #000000';
            tagText = '● ACTIVE STAGE';
            tagClass = 'fw-bold text-white';
          }

          return (
            <div key={idx} className="col-12 col-sm-6 col-lg-3">
              <div
                className="p-3 h-100 d-flex flex-column justify-content-between transition-all"
                style={{
                  backgroundColor: cardBg,
                  color: textColor,
                  border: borderStyle,
                  borderRadius: '4px',
                  transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isCurrent ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: isCurrent ? '0 8px 24px rgba(0,0,0,0.18)' : 'none'
                }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2 font-mono">
                    <span className="small opacity-75 fw-bold">0{idx + 1}</span>
                    <span className={tagClass} style={{ fontSize: '0.65rem' }}>
                      {tagText}
                    </span>
                  </div>

                  <div className="fw-bold font-mono text-uppercase small tracking-tight mb-1">
                    {stage.label}
                  </div>
                  <div className="small opacity-75" style={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                    {stage.desc}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JourneyStepper;

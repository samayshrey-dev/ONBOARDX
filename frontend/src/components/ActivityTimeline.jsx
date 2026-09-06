import React from 'react';

const ActivityTimeline = ({ activities = [], emptyMessage = "No activity logged yet." }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-3 text-center border bg-light font-mono text-muted small">
        NO RECORDED ACTIVITY
      </div>
    );
  }

  return (
    <div className="position-relative ps-3 py-1">
      {/* Vertical Connecting Line */}
      <div
        className="position-absolute"
        style={{
          top: 10,
          bottom: 10,
          left: 7,
          width: 1,
          backgroundColor: '#000000',
          zIndex: 1,
        }}
      ></div>

      <div className="d-flex flex-column gap-3 position-relative" style={{ zIndex: 2 }}>
        {activities.map((act) => {
          const timeStr = act.created_at
            ? new Date(act.created_at).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
            : '--:--';

          const dateStr = act.created_at
            ? new Date(act.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              })
            : '';

          return (
            <div key={act.id} className="d-flex align-items-start gap-2.5">
              {/* Bullet Node */}
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 15,
                  height: 15,
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  borderRadius: '2px',
                  marginLeft: '-15px',
                  fontSize: '0.55rem'
                }}
              >
                ●
              </div>

              {/* Event Body */}
              <div
                className="flex-grow-1 p-2.5 border transition-all"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E4E4E7',
                  borderRadius: '3px'
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <div className="font-mono fw-bold text-uppercase small text-dark">
                    {act.action}
                  </div>
                  <div className="font-mono text-muted" style={{ fontSize: '0.6875rem' }}>
                    {timeStr} • {dateStr}
                  </div>
                </div>

                {act.description && (
                  <p className="small text-secondary mb-1" style={{ fontSize: '0.8rem', lineHeight: 1.35 }}>
                    {act.description}
                  </p>
                )}

                <div className="font-mono text-muted" style={{ fontSize: '0.6875rem' }}>
                  ACTOR: <strong className="text-dark">{act.actor_username || 'SYSTEM'}</strong>
                  {act.actor_role && (
                    <span className="border border-dark px-1 py-0.2 ms-1 text-dark" style={{ fontSize: '0.625rem' }}>
                      {act.actor_role}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;

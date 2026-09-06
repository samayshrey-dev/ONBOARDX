import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Fixed Toast Container */}
      <div
        className="position-fixed bottom-0 end-0 p-3"
        style={{ zIndex: 9999, pointerEvents: 'none', maxWidth: 420 }}
      >
        <div className="d-flex flex-column gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="p-3 border border-dark bg-dark text-white font-mono shadow-sm d-flex align-items-center justify-content-between gap-3"
              style={{
                pointerEvents: 'auto',
                fontSize: '0.8125rem',
                borderRadius: '3px',
                animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold">{toast.type === 'error' ? '!' : '●'}</span>
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="btn text-white p-0 opacity-75 opacity-100-hover"
                style={{ background: 'none', border: 'none', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

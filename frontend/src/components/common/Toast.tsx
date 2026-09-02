'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from 'react';

type ToastVariant = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

type ShowToast = (message: string, variant?: ToastVariant) => void;

const ToastContext = createContext<ShowToast | null>(null);

const TOAST_DELAY_MS = 4000;

const STYLE_BY_VARIANT: Record<ToastVariant, { icon: string; text: string }> = {
  success: { icon: 'fas fa-check-circle', text: 'text-success' },
  error: { icon: 'fas fa-exclamation-circle', text: 'text-danger' }
};

function ToastView({
  toast,
  onDismiss
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const variantStyle = STYLE_BY_VARIANT[toast.variant];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;

    import('bootstrap').then(({ Toast }) => {
      if (cancelled || !el) return;
      const instance = Toast.getOrCreateInstance(el, { delay: TOAST_DELAY_MS });
      el.addEventListener('hidden.bs.toast', () => onDismiss(toast.id));
      instance.show();
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className="toast mb-2 bg-surface border shadow-sm"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ opacity: 1, width: 'auto', maxWidth: 320 }}
    >
      <div className="toast-body d-flex align-items-center py-2">
        <span
          className={`${variantStyle.icon} ${variantStyle.text} me-2`}
          aria-hidden="true"
        />
        <span className="me-2 small">{toast.message}</span>
        <button
          className="btn-close ms-auto"
          type="button"
          data-bs-dismiss="toast"
          aria-label="Close"
          style={{ fontSize: '0.65rem' }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback<ShowToast>((message, variant = 'success') => {
    const id = nextId.current++;
    setToasts(current => [...current, { id, message, variant }]);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className="toast-container position-fixed top-0 end-0 p-3"
        style={{ zIndex: 2000 }}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(toast => (
          <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Responsive modal — bottom sheet on mobile, centered dialog on desktop.
 * Replaces the 4 hand-rolled modal implementations across the app.
 */
export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-md' }) {
  const onKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose?.(); },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      {/* Overlay */}
      <div
        className="absolute inset-0 animate-fade-in bg-navy-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92dvh] w-full ${maxWidth} flex-col overflow-hidden
          rounded-t-3xl bg-card shadow-float animate-slide-up
          sm:rounded-3xl sm:animate-scale-in`}
      >
        {/* Drag handle (mobile affordance) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 pb-3 pt-4 sm:px-6">
            <h3 className="text-lg font-bold tracking-tight text-ink">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-card-muted text-ink-soft transition-colors hover:bg-line hover:text-ink"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>

        {footer && (
          <div className="border-t border-line bg-card px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

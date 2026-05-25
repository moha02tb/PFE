import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';

const Dialog = ({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  className,
  size = 'max-w-lg',
  closeLabel = 'Close dialog',
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
    } else if (rendered) {
      setClosing(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => { if (event.key === 'Escape') onClose?.(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!rendered || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4',
        closing ? 'dialog-backdrop-out' : 'dialog-backdrop-in'
      )}
    >
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        onAnimationEnd={() => { if (closing) setRendered(false); }}
        className={cn(
          'relative w-full overflow-hidden rounded-[12px] border border-border bg-surface-elevated shadow-elevated',
          closing ? 'dialog-panel-out' : 'dialog-panel-in',
          size,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title ? <h2 id={titleId} className="font-display text-lg font-bold text-foreground">{title}</h2> : null}
            {description ? <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={closeLabel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {actions ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
            {actions}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
};

export default Dialog;

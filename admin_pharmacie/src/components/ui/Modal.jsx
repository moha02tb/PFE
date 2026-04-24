import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';
import '../styles/modal.css';

const Modal = ({ open, onClose, title, description, children, className }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
      <div className={cn('modal-content w-full max-w-lg rounded-[12px] border border-border bg-surface-elevated shadow-elevated', className)}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

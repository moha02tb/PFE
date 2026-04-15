import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';

const Drawer = ({ open, onClose, title, children, side = 'right', className }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-sm">
      <div
        className={cn(
          'absolute top-0 h-full w-full max-w-md border-border bg-surface-elevated shadow-panel',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[calc(100%-73px)] overflow-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Drawer;

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';
import '../styles/drawer.css';

const Drawer = ({ open, onClose, title, children, side = 'right', className }) => {
  if (!open) return null;

  return (
    <div className="drawer-backdrop fixed inset-0 z-[90] bg-slate-950/40">
      <div
        className={cn(
          'drawer-content absolute top-0 h-full w-full max-w-md border-border bg-surface-elevated',
          side === 'left' ? 'drawer-left left-0 border-r' : 'drawer-right right-0 border-l',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[calc(100%-57px)] overflow-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
};

export default Drawer;

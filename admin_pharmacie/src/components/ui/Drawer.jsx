import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';
import '../styles/drawer.css';

const Drawer = ({ open, onClose, title, children, side = 'right', className }) => {
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

  if (!rendered) return null;

  const handlePanelAnimationEnd = () => {
    if (closing) setRendered(false);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[90]',
        closing ? 'drawer-backdrop-out' : 'drawer-backdrop-in'
      )}
    >
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 cursor-default bg-slate-950/40"
        onClick={onClose}
      />
      <div
        onAnimationEnd={handlePanelAnimationEnd}
        className={cn(
          'drawer-content absolute top-0 h-full w-full max-w-md border-border bg-surface-elevated',
          side === 'left'
            ? cn('left-0 border-r', closing ? 'drawer-left-out' : 'drawer-left-in')
            : cn('right-0 border-l', closing ? 'drawer-right-out' : 'drawer-right-in'),
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

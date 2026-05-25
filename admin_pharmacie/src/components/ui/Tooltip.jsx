import React, { useId, useState } from 'react';
import { cn } from '../../lib/utils';

const sideClasses = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

const originClasses = {
  top: 'origin-bottom',
  bottom: 'origin-top',
  left: 'origin-right',
  right: 'origin-left',
};

const Tooltip = ({ content, children, side = 'top', className, contentClassName, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => { if (!disabled) setOpen(true); }}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => { if (!disabled) setOpen(true); }}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      {open && !disabled ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-[8px] border border-border bg-surface-elevated px-2.5 py-1.5 text-[11px] font-semibold text-foreground shadow-panel',
            'animate-tooltip-in',
            originClasses[side] || originClasses.top,
            sideClasses[side] || sideClasses.top,
            contentClassName
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
};

export default Tooltip;

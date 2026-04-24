import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const Dropdown = ({ trigger, align = 'right', children, className }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (!ref.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {trigger ? (
        <div onClick={() => setOpen((value) => !value)}>
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-[6px] border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
        >
          Menu
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      {open ? (
        <div
          className={cn(
            'dropdown-panel absolute top-[calc(100%+0.375rem)] z-50 min-w-48 rounded-[6px] border border-border bg-surface-elevated p-1',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      ) : null}
    </div>
  );
};

export const DropdownItem = ({ className, ...props }) => (
  <button
    type="button"
    className={cn(
      'flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-linear hover:bg-surface-muted hover:text-foreground',
      className
    )}
    {...props}
  />
);

export default Dropdown;

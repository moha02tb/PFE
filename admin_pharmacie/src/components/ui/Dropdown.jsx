import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const Dropdown = ({ trigger, align = 'right', children, className }) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef(null);

  const openDropdown = () => {
    setMounted(true);
    setOpen(true);
  };

  const closeDropdown = () => {
    setOpen(false);
  };

  const handleAnimationEnd = () => {
    if (!open) setMounted(false);
  };

  const toggle = () => (open ? closeDropdown() : openDropdown());

  useEffect(() => {
    const onMouseDown = (event) => {
      if (!ref.current?.contains(event.target)) closeDropdown();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      {trigger ? (
        <div onClick={toggle}>{trigger}</div>
      ) : (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-[6px] border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
        >
          Menu
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
        </button>
      )}

      {mounted && (
        <div
          onAnimationEnd={handleAnimationEnd}
          className={cn(
            'dropdown-panel absolute top-[calc(100%+0.5rem)] z-50 min-w-48 rounded-[10px] border border-border bg-surface-elevated p-1 shadow-[0_8px_32px_rgba(15,23,42,0.12),0_1px_0_rgba(255,255,255,0.06)_inset]',
            open ? 'dropdown-enter' : 'dropdown-exit',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {typeof children === 'function' ? children({ close: closeDropdown }) : children}
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({ className, ...props }) => (
  <button
    type="button"
    className={cn(
      'dropdown-item flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-sm text-muted-foreground transition-all duration-150 ease-out hover:bg-surface-muted hover:text-foreground hover:translate-x-0.5 active:scale-[0.98]',
      className
    )}
    {...props}
  />
);

export default Dropdown;

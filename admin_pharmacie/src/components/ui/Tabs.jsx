import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export const Tabs = ({ value, onChange, items, className }) => {
  const containerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector('[aria-selected="true"]');
    if (!activeBtn) return;
    const { offsetLeft, offsetWidth } = activeBtn;
    setIndicator({ left: offsetLeft, width: offsetWidth, ready: true });
  }, [value]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={cn(
        'relative inline-flex overflow-hidden rounded-[8px] border border-border bg-surface-elevated shadow-soft',
        className
      )}
    >
      {indicator.ready && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 rounded-[6px] bg-primary transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'relative z-10 border-r border-border px-4 py-2 text-sm font-semibold transition-colors duration-150 last:border-r-0',
            value === item.value
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

import React from 'react';
import { cn } from '../../lib/utils';

export const Tabs = ({ value, onChange, items, className }) => (
  <div className={cn('inline-flex overflow-hidden rounded-[8px] border border-border bg-surface-elevated shadow-soft', className)}>
    {items.map((item) => (
      <button
        key={item.value}
        type="button"
        onClick={() => onChange(item.value)}
        className={cn(
          'border-r border-border px-4 py-2 text-sm font-semibold transition-colors duration-[var(--duration-fast)] ease-linear last:border-r-0',
          value === item.value
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {item.label}
      </button>
    ))}
  </div>
);

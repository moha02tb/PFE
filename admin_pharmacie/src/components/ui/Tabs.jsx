import React from 'react';
import { cn } from '../../lib/utils';

export const Tabs = ({ value, onChange, items, className }) => (
  <div className={cn('inline-flex rounded-xl border border-border bg-surface p-1', className)}>
    {items.map((item) => (
      <button
        key={item.value}
        type="button"
        onClick={() => onChange(item.value)}
        className={cn(
          'rounded-lg px-3.5 py-2 text-sm font-medium transition',
          value === item.value
            ? 'bg-surface-elevated text-foreground shadow-soft'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {item.label}
      </button>
    ))}
  </div>
);

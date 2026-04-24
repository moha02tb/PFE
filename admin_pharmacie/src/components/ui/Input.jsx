import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-[8px] border border-input bg-surface/85 px-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.30),0_1px_0_rgba(255,255,255,0.18)] placeholder:text-muted-foreground transition-smooth hover:border-primary/25 hover:bg-surface-elevated focus:border-primary focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary/12 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50',
      className
    )}
    {...props}
  />
));

Input.displayName = 'Input';

export const Field = ({ className, ...props }) => (
  <label className={cn('grid gap-1.5', className)} {...props} />
);

export const FieldLabel = ({ className, ...props }) => (
  <span className={cn('text-xs font-semibold text-foreground', className)} {...props} />
);

export const FieldHint = ({ className, ...props }) => (
  <span className={cn('text-xs text-muted-foreground leading-relaxed', className)} {...props} />
);

export const FieldError = ({ className, ...props }) => (
  <span className={cn('text-xs font-medium text-foreground', className)} {...props} />
);

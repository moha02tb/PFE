import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-xl border border-input bg-surface px-3.5 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));

Input.displayName = 'Input';

export const Field = ({ className, ...props }) => (
  <label className={cn('grid gap-2.5', className)} {...props} />
);

export const FieldLabel = ({ className, ...props }) => (
  <span className={cn('text-sm font-medium text-foreground', className)} {...props} />
);

export const FieldHint = ({ className, ...props }) => (
  <span className={cn('text-xs text-muted-foreground', className)} {...props} />
);

export const FieldError = ({ className, ...props }) => (
  <span className={cn('text-xs text-danger', className)} {...props} />
);

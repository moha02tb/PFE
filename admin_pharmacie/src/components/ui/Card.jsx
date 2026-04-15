import React from 'react';
import { cn } from '../../lib/utils';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border border-border bg-surface-elevated shadow-soft transition-colors',
      className
    )}
    {...props}
  />
));

export const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex items-start justify-between gap-4 px-6 py-5', className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('font-display text-lg font-semibold tracking-tight text-foreground', className)} {...props} />
);

export const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn('px-6 pb-6', className)} {...props} />
);

export const CardFooter = ({ className, ...props }) => (
  <div className={cn('flex items-center gap-3 border-t border-border px-6 py-4', className)} {...props} />
);

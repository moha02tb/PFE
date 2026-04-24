import React from 'react';
import { cn } from '../../lib/utils';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'admin-card',
      className
    )}
    {...props}
  />
));

export const CardHeader = ({ className, ...props }) => (
  <div className={cn('admin-card__header flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4', className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('font-display text-sm font-bold leading-snug text-foreground', className)} {...props} />
);

export const CardDescription = ({ className, ...props }) => (
  <p className={cn('mt-1.5 text-xs leading-5 text-muted-foreground', className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn('relative px-5 py-4', className)} {...props} />
);

export const CardFooter = ({ className, ...props }) => (
  <div className={cn('relative flex items-center gap-2 border-t border-border/70 bg-surface-muted/40 px-5 py-4', className)} {...props} />
);

import React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = {
  neutral: 'bg-surface-muted text-muted-foreground',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

const Badge = ({ className, variant = 'neutral', ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
      badgeVariants[variant],
      className
    )}
    {...props}
  />
);

export default Badge;

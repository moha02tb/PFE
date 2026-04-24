import React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = {
  neutral: 'border-border/70 bg-surface-muted/80 text-muted-foreground',
  primary: 'border-primary/25 bg-primary-soft text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]',
  secondary: 'border-border/60 bg-surface-muted text-muted-foreground',
  success: 'border-emerald-600/20 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200',
  warning: 'border-amber-600/22 bg-amber-50 text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200',
  danger: 'border-red-600/20 bg-red-50 text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-200',
};

const Badge = ({ className, variant = 'neutral', ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em]',
      badgeVariants[variant],
      className
    )}
    {...props}
  />
);

export default Badge;

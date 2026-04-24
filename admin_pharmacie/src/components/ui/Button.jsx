import React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = {
  variant: {
    primary:
      'border border-primary bg-primary text-primary-foreground shadow-[0_12px_24px_oklch(var(--primary)/0.20)] hover:bg-primary/95 hover:shadow-[0_18px_32px_oklch(var(--primary)/0.24)] active:bg-primary/90 focus-visible:ring-primary/25',
    secondary:
      'border border-border/85 bg-surface-elevated/90 text-foreground shadow-[0_1px_0_rgba(255,255,255,0.38),0_8px_18px_rgba(15,23,42,0.05)] hover:border-primary/30 hover:bg-surface-muted hover:text-foreground hover:shadow-[0_14px_26px_rgba(15,23,42,0.08)] focus-visible:ring-ring/20',
    ghost:
      'text-muted-foreground hover:bg-surface-muted hover:text-foreground active:bg-surface-strong/70 focus-visible:ring-ring/20',
    danger:
      'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500/20 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/15',
    soft:
      'border border-border bg-surface-muted text-foreground hover:border-primary/20 hover:bg-surface-strong focus-visible:ring-ring/20',
  },
  size: {
    sm: 'h-8 px-3 text-xs font-semibold',
    md: 'h-9 px-3.5 text-sm font-semibold',
    lg: 'h-10 px-4 text-sm font-semibold',
    icon: 'h-9 w-9 p-0',
  },
};

const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', type = 'button', asChild = false, ...props }, ref) => {
    const classes = cn(
      'inline-flex items-center justify-center gap-2 rounded-[8px] leading-tight focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 transition-smooth active:translate-y-0.5 whitespace-nowrap',
      buttonVariants.variant[variant],
      buttonVariants.size[size],
      className
    );

    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children, {
        className: cn(classes, props.children.props.className),
      });
    }

    return <button ref={ref} type={type} className={classes} {...props} />;
  }
);

Button.displayName = 'Button';

export default Button;

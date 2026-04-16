import React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = {
  variant: {
    primary:
      'bg-primary text-primary-foreground hover:bg-[#155eef] focus-visible:ring-primary/30',
    secondary:
      'bg-surface-elevated text-foreground border border-border hover:bg-surface-muted focus-visible:ring-ring/30',
    ghost:
      'text-muted-foreground hover:bg-surface-muted hover:text-foreground focus-visible:ring-ring/20',
    danger:
      'bg-danger text-danger-foreground hover:brightness-95 focus-visible:ring-danger/30',
    soft:
      'bg-primary-soft text-primary hover:bg-primary-soft/80 focus-visible:ring-primary/20',
  },
  size: {
    sm: 'h-9 px-3.5 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
    icon: 'h-10 w-10',
  },
};

const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', type = 'button', asChild = false, ...props }, ref) => {
    const classes = cn(
      'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50',
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

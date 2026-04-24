import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        'h-10 w-full appearance-none rounded-[8px] border border-input bg-surface/85 px-3 pr-9 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.30)] transition-smooth hover:border-primary/25 hover:bg-surface-elevated focus:border-primary focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary/12',
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-smooth" />
  </div>
));

Select.displayName = 'Select';

export default Select;

import React from 'react';
import { cn } from '../../lib/utils';

export const Table = ({ className, ...props }) => (
  <div className="table-shell overflow-x-auto border border-border/70">
    <table className={cn('min-w-full text-left text-sm tabular-nums', className)} {...props} />
  </div>
);

export const TableHead = ({ className, ...props }) => (
  <thead className={cn('border-b border-border/60 bg-surface-muted/80', className)} {...props} />
);

export const TableHeaderCell = ({ className, ...props }) => (
  <th
    className={cn(
      'bg-surface-muted/80 px-4 py-3 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-muted-foreground',
      className
    )}
    {...props}
  />
);

export const TableBody = ({ className, ...props }) => (
  <tbody className={cn('divide-y divide-border/45', className)} {...props} />
);

export const TableRow = ({ className, ...props }) => (
  <tr className={cn('table-row-motion hover:bg-surface-muted/60', className)} {...props} />
);

export const TableCell = ({ className, ...props }) => (
  <td className={cn('px-4 py-3 align-middle text-[0.8125rem] leading-5 text-foreground', className)} {...props} />
);

import React from 'react';
import { cn } from '../../lib/utils';

export const Table = ({ className, ...props }) => (
  <div className="overflow-x-auto">
    <table className={cn('min-w-full text-left text-sm', className)} {...props} />
  </div>
);

export const TableHead = ({ className, ...props }) => (
  <thead className={cn('bg-surface-muted/80', className)} {...props} />
);

export const TableHeaderCell = ({ className, ...props }) => (
  <th
    className={cn(
      'px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground',
      className
    )}
    {...props}
  />
);

export const TableBody = ({ className, ...props }) => (
  <tbody className={cn('divide-y divide-border', className)} {...props} />
);

export const TableRow = ({ className, ...props }) => (
  <tr className={cn('transition hover:bg-surface-muted/70', className)} {...props} />
);

export const TableCell = ({ className, ...props }) => (
  <td className={cn('px-5 py-4 align-middle text-sm text-muted-foreground', className)} {...props} />
);

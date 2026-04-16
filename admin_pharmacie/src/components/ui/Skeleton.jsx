import React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = ({ className, ...props }) => (
  <div className={cn('animate-pulse rounded-xl bg-surface-muted', className)} {...props} />
);

export default Skeleton;

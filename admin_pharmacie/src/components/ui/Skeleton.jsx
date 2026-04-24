import React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = ({ className, ...props }) => (
  <div className={cn('skeleton-shimmer rounded-[6px]', className)} {...props} />
);

export default Skeleton;

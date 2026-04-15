import React from 'react';
import { cn } from '../../lib/utils';

const SectionHeader = ({ eyebrow, title, description, actions, className }) => (
  <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
    <div>
      {eyebrow ? (
        <div className="mb-3 inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
          {eyebrow}
        </div>
      ) : null}
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
        {title}
      </h1>
      {description ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
  </div>
);

export default SectionHeader;

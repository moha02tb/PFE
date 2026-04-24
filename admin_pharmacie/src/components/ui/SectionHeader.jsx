import React from 'react';
import { cn } from '../../lib/utils';

const SectionHeader = ({ eyebrow, title, description, actions, className }) => (
  <div className={cn('page-heading-row', className)}>
    <div className="min-w-0">
      {eyebrow ? (
        <div className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {eyebrow}
        </div>
      ) : null}
      <h1 className="font-display text-2xl font-bold leading-tight text-foreground">
        {title}
      </h1>
      {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

export default SectionHeader;

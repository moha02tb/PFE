import React from 'react';
import Button from './Button';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="empty-state flex flex-col items-center justify-center rounded-[8px] border border-dashed border-border bg-surface/80 p-8 text-center">
    {Icon ? (
      <div className="empty-state__icon mb-3 rounded-[8px] border border-border bg-surface-muted p-3 text-primary">
        <Icon className="h-6 w-6" />
      </div>
    ) : null}
    <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
    <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{description}</p>
    {actionLabel && onAction ? (
      <Button className="mt-3" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);

export default EmptyState;

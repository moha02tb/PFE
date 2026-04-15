import React from 'react';
import Button from './Button';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
    {Icon ? (
      <div className="mb-4 rounded-2xl bg-surface-muted p-4 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
    ) : null}
    <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
    <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    {actionLabel && onAction ? (
      <Button className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);

export default EmptyState;

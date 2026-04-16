import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

const Pagination = ({ page, totalPages, onPrevious, onNext }) => (
  <div className="flex items-center gap-2">
    <Button variant="secondary" size="sm" onClick={onPrevious} disabled={page <= 1}>
      <ChevronLeft className="h-4 w-4" />
      Previous
    </Button>
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
      Page <span className="font-semibold text-foreground">{page}</span> of{' '}
      <span className="font-semibold text-foreground">{totalPages}</span>
    </div>
    <Button variant="secondary" size="sm" onClick={onNext} disabled={page >= totalPages}>
      Next
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);

export default Pagination;

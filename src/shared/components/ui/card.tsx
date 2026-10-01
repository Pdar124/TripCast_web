import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      ref={ref}
      {...props}
    />
  ),
);

Card.displayName = 'Card';

import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('tc-skeleton rounded-md', className)} {...props} />;
}

import { MapPinned } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

type SpotMapPlaceholderProps = {
  description: string;
  title?: string;
  action?: ReactNode;
  footer?: string;
  className?: string;
};

export function SpotMapPlaceholder({
  description,
  title = '지도 영역',
  action,
  footer,
  className,
}: SpotMapPlaceholderProps) {
  return (
    <section
      className={cn(
        'tc-route-visual relative grid min-h-80 place-items-center rounded-lg p-6 text-center lg:min-h-[640px]',
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent"
        aria-hidden="true"
      />
      <div className="relative max-w-sm space-y-4">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-background/90 text-primary shadow-sm">
          <MapPinned className="h-8 w-8" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action}
        {footer && (
          <p className="rounded-full bg-background/90 px-4 py-2 text-xs font-bold text-muted-foreground shadow-sm">
            {footer}
          </p>
        )}
      </div>
    </section>
  );
}

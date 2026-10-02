import { Building2, Trees } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

type IndoorTypeBadgeProps = {
  indoorType: string | null | undefined;
};

const indoorTypeMap = {
  실내: {
    icon: Building2,
    className: 'border-violet-200 bg-violet-50 text-violet-800',
  },
  실외: {
    icon: Trees,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
} as const;

export function IndoorTypeBadge({ indoorType }: IndoorTypeBadgeProps) {
  const type = indoorTypeMap[indoorType as keyof typeof indoorTypeMap];
  const Icon = type?.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        type?.className ?? 'border-border bg-muted text-muted-foreground',
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {type ? indoorType : '구분 없음'}
    </span>
  );
}

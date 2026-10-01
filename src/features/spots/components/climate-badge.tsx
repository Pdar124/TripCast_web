import { cn } from '@/shared/lib/utils';
import type { ClimateIndex } from '@/features/spots/types';

type ClimateBadgeProps = {
  climateIndex?: ClimateIndex | null;
};

const gradeStyles: Record<string, string> = {
  매우좋음: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  좋음: 'border-green-300 bg-green-50 text-green-800',
  보통: 'border-amber-300 bg-amber-50 text-amber-800',
  나쁨: 'border-orange-300 bg-orange-50 text-orange-800',
  매우나쁨: 'border-red-300 bg-red-50 text-red-800',
};

export function ClimateBadge({ climateIndex }: ClimateBadgeProps) {
  if (climateIndex == null) {
    return (
      <span className="inline-flex rounded-full border bg-muted px-3 py-1.5 text-sm font-semibold text-muted-foreground">
        지수 없음
      </span>
    );
  }

  const grade = climateIndex.grade?.trim() ?? '';
  const isKnownGrade = Boolean(gradeStyles[grade]);
  const score =
    typeof climateIndex.score === 'number' && Number.isFinite(climateIndex.score)
      ? `${climateIndex.score}점`
      : null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold',
        isKnownGrade ? gradeStyles[grade] : 'border-border bg-muted text-muted-foreground',
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {score && <span>{score}</span>}
      <span>{isKnownGrade ? grade : '정보 없음'}</span>
    </span>
  );
}

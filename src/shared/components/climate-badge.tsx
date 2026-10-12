import type { CSSProperties } from 'react';

type ClimateBadgeProps = {
  climateIndex?: {
    score?: number | null;
    grade?: string | null;
  } | null;
  size?: 'default' | 'large';
};

function climateColor(grade: string) {
  const normalizedGrade = grade.replaceAll(' ', '');
  if (normalizedGrade === '매우좋음') return 'var(--tc-climate-excellent)';
  if (normalizedGrade === '좋음') return 'var(--tc-climate-good)';
  if (normalizedGrade === '보통') return 'var(--tc-climate-normal)';
  if (normalizedGrade === '나쁨') return 'var(--tc-climate-caution)';
  if (normalizedGrade === '매우나쁨') return 'var(--tc-climate-bad)';
  if (normalizedGrade === '특보발령주의') return 'var(--tc-climate-bad)';
  return 'var(--tc-climate-normal)';
}

function formatScore(score: number) {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(score);
}

export function ClimateBadge({ climateIndex, size = 'default' }: ClimateBadgeProps) {
  if (climateIndex == null) {
    return (
      <span className="inline-flex h-8 items-center rounded-full border border-border/50 bg-secondary px-4 text-xs font-bold text-muted-foreground">
        지수 없음
      </span>
    );
  }

  const score =
    typeof climateIndex.score === 'number' && Number.isFinite(climateIndex.score)
      ? climateIndex.score
      : null;
  const knownGrades = new Set([
    '매우좋음',
    '매우 좋음',
    '좋음',
    '보통',
    '나쁨',
    '매우나쁨',
    '매우 나쁨',
    '특보발령주의',
    '특보발령 주의',
  ]);
  const rawGrade = climateIndex.grade?.trim() ?? '';
  const grade = knownGrades.has(rawGrade) ? rawGrade : '정보 없음';
  const style = { '--climate-color': climateColor(grade) } as CSSProperties;

  return (
    <span
      className={
        size === 'large'
          ? 'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--climate-color)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--climate-color)_16%,transparent)] px-5 text-sm font-bold text-[var(--climate-color)]'
          : 'inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--climate-color)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--climate-color)_16%,transparent)] px-4 text-xs font-bold text-[var(--climate-color)]'
      }
      style={style}
    >
      <span className="h-2 w-2 rounded-full bg-[var(--climate-color)]" aria-hidden="true" />
      {score != null && (
        <span className={size === 'large' ? 'text-[22px]' : 'text-[15px]'}>
          지수 {formatScore(score)}
        </span>
      )}
      <span className="opacity-90">{grade}</span>
    </span>
  );
}

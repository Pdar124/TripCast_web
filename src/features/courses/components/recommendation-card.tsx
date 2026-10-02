import { ArrowRight, Signpost } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { CourseRecommendation } from '@/features/courses/types';
import { ClimateBadge } from '@/shared/components/climate-badge';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

type RecommendationCardProps = {
  course: CourseRecommendation;
  rank: number;
};

const rankStyles: Record<number, string> = {
  1: 'bg-amber-400 text-amber-950',
  2: 'bg-slate-300 text-slate-900',
  3: 'bg-orange-300 text-orange-950',
};

export function RecommendationCard({ course, rank }: RecommendationCardProps) {
  return (
    <li>
      <Card className="group transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md motion-reduce:transform-none">
        <Link
          className="grid gap-5 rounded-lg p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6"
          to={`/courses/${course.courseId}`}
        >
          <span
            className={cn(
              'grid h-11 w-11 place-items-center rounded-full text-sm font-extrabold tabular-nums',
              rankStyles[rank] ?? 'bg-accent text-accent-foreground',
            )}
            aria-label={`${rank}위`}
          >
            {rank}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {course.representativeThemeName}
              </span>
              <ClimateBadge climateIndex={course.climateIndex} />
            </div>
            <h2 className="mt-3 break-keep text-xl font-bold tracking-tight">
              {course.representativeSpotName}에서 시작하는 코스
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Signpost className="h-4 w-4" aria-hidden="true" />
              정류지 {course.stopCount}곳 · 코스 {course.sourceCourseId}
            </p>
          </div>

          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary sm:justify-self-end">
            상세 보기
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </span>
        </Link>
      </Card>
    </li>
  );
}

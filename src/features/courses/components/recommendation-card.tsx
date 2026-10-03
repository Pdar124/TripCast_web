import { ArrowRight, Signpost } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { CourseRecommendation } from '@/features/courses/types';
import { ClimateBadge } from '@/shared/components/climate-badge';
import { getSpotImage } from '@/shared/lib/spot-image';

type RecommendationCardProps = {
  course: CourseRecommendation;
  rank: number;
};

export function RecommendationCard({ course, rank }: RecommendationCardProps) {
  const image = getSpotImage(course.representativeSpotName);

  return (
    <li>
      <article className="group tc-interactive-card">
        <Link
          className="grid gap-4 p-4 sm:grid-cols-[56px_96px_minmax(0,1fr)_auto] sm:items-center sm:gap-5"
          to={`/courses/${course.courseId}`}
        >
          <span
            className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-lg font-black tabular-nums"
            aria-label={`${rank}위`}
          >
            {String(rank).padStart(2, '0')}
          </span>

          <div
            className={
              image
                ? 'aspect-square w-24 overflow-hidden rounded-md'
                : 'tc-route-visual aspect-square w-24 rounded-md'
            }
            aria-hidden="true"
          >
            {image && (
              <img alt="" className="h-full w-full object-cover" loading="lazy" src={image} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tc-tag">{course.representativeThemeName}</span>
            </div>
            <h2 className="mt-2 break-keep text-lg font-bold tracking-tight">
              {course.representativeSpotName}에서 시작하는 코스
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Signpost className="h-4 w-4" aria-hidden="true" />
              정류지 {course.stopCount}곳 · 코스 {course.sourceCourseId}
            </p>
          </div>

          <span className="flex items-center gap-3 sm:justify-self-end">
            <ClimateBadge climateIndex={course.climateIndex} />
            <ArrowRight
              className="h-5 w-5 text-[var(--tc-accent-ink)] transition-transform group-hover:translate-x-1"
              aria-label="상세 보기"
            />
          </span>
        </Link>
      </article>
    </li>
  );
}

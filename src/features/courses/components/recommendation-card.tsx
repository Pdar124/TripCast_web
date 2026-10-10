import { ArrowRight, Signpost } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CourseRoadviewThumbnail } from '@/features/courses/components/course-roadview-thumbnail';
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
    <li className="h-full">
      <article className="group tc-interactive-card h-full">
        <Link className="flex h-full flex-col" to={`/courses/${course.courseId}`}>
          <div className="relative">
            <CourseRoadviewThumbnail
              className="aspect-[16/9] w-full"
              fallbackImage={image}
              latitude={course.representativeLatitude}
              longitude={course.representativeLongitude}
            />

            <span
              className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-full border border-black/10 bg-[var(--tc-overlay)] text-base font-black tabular-nums shadow-sm backdrop-blur-md dark:border-white/10"
              aria-label={`${rank}위`}
            >
              {String(rank).padStart(2, '0')}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="tc-tag">{course.representativeThemeName}</span>
              <ClimateBadge climateIndex={course.climateIndex} />
            </div>
            <h2 className="mt-4 break-keep text-xl font-bold tracking-tight">
              {course.representativeSpotName}에서 시작하는 코스
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Signpost className="h-4 w-4" aria-hidden="true" />
              정류지 {course.stopCount}곳 · 코스 {course.sourceCourseId}
            </p>

            <span className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm font-bold text-[var(--tc-accent-ink)]">
              코스 자세히 보기
              <ArrowRight
                className="h-5 w-5 text-[var(--tc-accent-ink)] transition-transform group-hover:translate-x-1"
                aria-label="상세 보기"
              />
            </span>
          </div>
        </Link>
      </article>
    </li>
  );
}

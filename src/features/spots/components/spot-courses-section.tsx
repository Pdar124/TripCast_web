import { ArrowRight, Route, Signpost } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useTourSpotCourses } from '@/features/spots/hooks/use-tour-spot-courses';
import type { TourSpotCourse } from '@/features/spots/types';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

type SpotCoursesSectionProps = {
  spotId: string;
};

function SpotCourseLink({ course }: { course: TourSpotCourse }) {
  const startName = course.representativeSpotName ?? '대표 관광지 정보 없음';

  return (
    <li>
      <Link
        className="tc-interactive-card group flex items-center justify-between gap-4 p-4"
        to={`/courses/${course.courseId}`}
      >
        <span className="min-w-0 space-y-2">
          <span className="tc-tag w-fit">{course.representativeThemeName ?? '테마 정보 없음'}</span>
          <span className="block break-keep font-bold">{startName}에서 시작하는 코스</span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Signpost className="h-4 w-4 shrink-0" aria-hidden="true" />
            정류지 {course.stopCount}곳 · 이 관광지는 {course.spotCourseOrder}번째 방문
          </span>
        </span>
        <ArrowRight
          className="h-5 w-5 shrink-0 text-[var(--tc-accent-ink)] transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

/** 관광지가 포함된 코스로 이동하는 목록. 부가 정보라 로딩·실패·빈 결과가 페이지 나머지를 막지 않는다. */
export function SpotCoursesSection({ spotId }: SpotCoursesSectionProps) {
  const coursesQuery = useTourSpotCourses(spotId);

  if (coursesQuery.isPending) {
    return (
      <section aria-labelledby="spot-courses-heading" role="status">
        <h2 className="mb-3 text-lg font-bold" id="spot-courses-heading">
          이 관광지가 포함된 코스
        </h2>
        <Skeleton className="h-24 w-full" />
        <span className="sr-only">포함된 코스를 불러오고 있습니다.</span>
      </section>
    );
  }

  if (coursesQuery.isError) {
    return (
      <section aria-labelledby="spot-courses-heading">
        <h2 className="mb-3 text-lg font-bold" id="spot-courses-heading">
          이 관광지가 포함된 코스
        </h2>
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card p-4"
          role="alert"
        >
          <p className="text-sm text-muted-foreground">포함된 코스를 불러오지 못했습니다.</p>
          <Button onClick={() => coursesQuery.refetch()} size="sm" variant="outline">
            다시 시도
          </Button>
        </div>
      </section>
    );
  }

  if (coursesQuery.data.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="spot-courses-heading">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold" id="spot-courses-heading">
        <Route className="h-5 w-5" aria-hidden="true" />이 관광지가 포함된 코스
      </h2>
      <ul className="space-y-3">
        {coursesQuery.data.map((course) => (
          <SpotCourseLink course={course} key={course.courseId} />
        ))}
      </ul>
    </section>
  );
}

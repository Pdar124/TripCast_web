import { ArrowRight, Route, Signpost } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { TourCourseSummary } from '@/features/courses/types';
import { Card } from '@/shared/components/ui/card';

type CourseCardProps = {
  course: TourCourseSummary;
};

export function CourseCard({ course }: CourseCardProps) {
  const spotName = course.representativeSpotName ?? '대표 관광지 정보 없음';
  const themeName = course.representativeThemeName ?? '테마 정보 없음';

  return (
    <Card className="group h-full transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg motion-reduce:transform-none">
      <Link
        className="flex h-full min-h-52 flex-col gap-5 rounded-lg p-6"
        to={`/courses/${course.courseId}`}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Route className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {themeName}
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">{spotName}에서 시작하는 코스</h2>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Signpost className="h-4 w-4" aria-hidden="true" />
            정류지 {course.stopCount}곳 · 코스 {course.sourceCourseId}
          </p>
        </div>

        <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
          코스 날씨 보기
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
            aria-hidden="true"
          />
        </span>
      </Link>
    </Card>
  );
}

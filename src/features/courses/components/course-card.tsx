import { ArrowRight, Route, Signpost } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { TourCourseSummary } from '@/features/courses/types';
import { getSpotImage } from '@/shared/lib/spot-image';

type CourseCardProps = {
  course: TourCourseSummary;
};

export function CourseCard({ course }: CourseCardProps) {
  const spotName = course.representativeSpotName ?? '대표 관광지 정보 없음';
  const themeName = course.representativeThemeName ?? '테마 정보 없음';
  const image = getSpotImage(course.representativeSpotName);

  return (
    <article className="group tc-interactive-card h-full">
      <Link className="flex h-full flex-col" to={`/courses/${course.courseId}`}>
        <div
          className={
            image ? 'relative aspect-[16/10] overflow-hidden' : 'tc-route-visual aspect-[16/10]'
          }
          aria-hidden="true"
        >
          {image && (
            <img
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              src={image}
            />
          )}
          <span className="absolute bottom-4 left-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-primary shadow-sm">
            <Route className="h-5 w-5" />
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <span className="tc-tag w-fit">{themeName}</span>
          <h2 className="mt-3 text-xl font-bold tracking-tight">{spotName}에서 시작하는 코스</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Signpost className="h-4 w-4" aria-hidden="true" />
            정류지 {course.stopCount}곳 · 코스 {course.sourceCourseId}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--tc-accent-ink)]">
            코스 날씨 보기
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}

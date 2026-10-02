import { useSearchParams } from 'react-router-dom';

import { TOUR_COURSE_PAGE_SIZE } from '@/features/courses/api/course-api';
import { CourseCard } from '@/features/courses/components/course-card';
import { CourseListSkeleton } from '@/features/courses/components/course-list-skeleton';
import { useTourCourses } from '@/features/courses/hooks/use-tour-courses';
import { getApiErrorMessage } from '@/shared/api/get-api-error-message';
import { EmptyState } from '@/shared/components/empty-state';
import { Pagination } from '@/shared/components/pagination';
import { Button } from '@/shared/components/ui/button';

function parsePage(value: string | null) {
  const page = Number(value ?? 0);
  return Number.isInteger(page) && page >= 0 ? page : 0;
}

export function CourseListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const coursesQuery = useTourCourses({ page, size: TOUR_COURSE_PAGE_SIZE });

  function updatePage(nextPage: number) {
    const nextParams = new URLSearchParams();
    if (nextPage > 0) nextParams.set('page', String(nextPage));
    setSearchParams(nextParams);
  }

  return (
    <main className="container py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold text-primary">COURSE GUIDE</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">관광코스</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          방문 순서와 이동 시간을 따라 코스를 살펴보고 정류지별 날씨를 미리 확인하세요.
        </p>
      </header>

      <section className="mt-10" aria-labelledby="course-results-title">
        <div className="mb-5 flex min-h-7 items-center justify-between gap-4">
          <h2 className="text-lg font-bold" id="course-results-title">
            전체 관광코스
          </h2>
          {coursesQuery.data && coursesQuery.data.content.length > 0 && (
            <p className="text-sm text-muted-foreground">
              총 <strong className="text-foreground">{coursesQuery.data.totalElements}</strong>개
            </p>
          )}
        </div>

        {coursesQuery.isPending ? (
          <CourseListSkeleton />
        ) : coursesQuery.isError ? (
          <EmptyState
            action={<Button onClick={() => coursesQuery.refetch()}>다시 시도</Button>}
            description={getApiErrorMessage(coursesQuery.error)}
            title="관광코스 목록을 불러오지 못했습니다"
            variant="error"
          />
        ) : coursesQuery.data.content.length === 0 ? (
          <EmptyState description="등록된 관광코스가 아직 없습니다." title="관광코스가 없습니다" />
        ) : (
          <>
            <div
              className="grid gap-5 md:grid-cols-2"
              aria-busy={coursesQuery.isFetching && !coursesQuery.isPending}
            >
              {coursesQuery.data.content.map((course) => (
                <CourseCard course={course} key={course.courseId} />
              ))}
            </div>
            <Pagination
              onPageChange={updatePage}
              page={coursesQuery.data.number}
              totalPages={coursesQuery.data.totalPages}
            />
          </>
        )}
      </section>
    </main>
  );
}

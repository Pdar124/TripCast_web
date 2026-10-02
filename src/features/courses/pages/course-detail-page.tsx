import { ArrowLeft, Route } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { CourseDetailSkeleton } from '@/features/courses/components/course-detail-skeleton';
import { CourseRoutePlaceholder } from '@/features/courses/components/course-route-placeholder';
import { CourseStopItem } from '@/features/courses/components/course-stop-item';
import { useTourCourseWeather } from '@/features/courses/hooks/use-tour-course-weather';
import { getApiErrorMessage } from '@/shared/api/get-api-error-message';
import { EmptyState } from '@/shared/components/empty-state';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

function isValidId(id: string | undefined): id is string {
  return Boolean(id && /^\d+$/.test(id) && Number(id) > 0);
}

export function CourseDetailPage() {
  const { id } = useParams();
  const validId = isValidId(id) ? id : undefined;
  const courseQuery = useTourCourseWeather(validId);

  const stops = courseQuery.data
    ? [...courseQuery.data.stops].sort((a, b) => a.spot.courseOrder - b.spot.courseOrder)
    : [];
  const firstStop = stops[0]?.spot;

  return (
    <main className="container py-10 sm:py-14">
      <Button asChild className="mb-8 rounded-full" size="sm" variant="outline">
        <Link to="/courses">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          코스 목록으로 돌아가기
        </Link>
      </Button>

      {!validId ? (
        <EmptyState
          action={
            <Button asChild>
              <Link to="/courses">관광코스 보기</Link>
            </Button>
          }
          description="올바른 관광코스 주소인지 확인해 주세요."
          title="관광코스를 찾을 수 없습니다"
          variant="error"
        />
      ) : courseQuery.isPending ? (
        <CourseDetailSkeleton />
      ) : courseQuery.isError ? (
        <EmptyState
          action={<Button onClick={() => courseQuery.refetch()}>다시 시도</Button>}
          description={getApiErrorMessage(courseQuery.error)}
          title="관광코스 정보를 불러오지 못했습니다"
          variant="error"
        />
      ) : stops.length === 0 ? (
        <EmptyState
          description="이 코스에 등록된 정류지가 아직 없습니다."
          title="정류지가 없습니다"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
          <div className="min-w-0 space-y-8">
            <Card className="p-6 sm:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
                <Route className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-5 text-sm font-semibold text-primary">TOUR COURSE</p>
              <h1 className="mt-2 break-keep text-3xl font-bold tracking-tight">
                {firstStop?.tourSpotName}에서 시작하는 코스
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                코스 {courseQuery.data.sourceCourseId} · 정류지 {stops.length}곳
              </p>
            </Card>

            <section aria-labelledby="course-stops-heading">
              <div className="mb-5">
                <h2 className="text-xl font-bold" id="course-stops-heading">
                  방문 순서와 날씨
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  관광지 이름을 선택하면 해당 관광지 상세로 이동합니다.
                </p>
              </div>
              <ol className="space-y-5">
                {stops.map((stopWeather) => (
                  <CourseStopItem key={stopWeather.spot.stopId} stopWeather={stopWeather} />
                ))}
              </ol>
            </section>
          </div>

          <CourseRoutePlaceholder stops={stops} />
        </div>
      )}
    </main>
  );
}

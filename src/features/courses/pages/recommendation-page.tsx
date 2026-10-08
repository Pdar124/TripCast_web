import { Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { RecommendationCard } from '@/features/courses/components/recommendation-card';
import { RecommendationListSkeleton } from '@/features/courses/components/recommendation-list-skeleton';
import { useCourseRecommendations } from '@/features/courses/hooks/use-course-recommendations';
import { getApiErrorMessage } from '@/shared/api/get-api-error-message';
import { EmptyState } from '@/shared/components/empty-state';
import { Pagination } from '@/shared/components/pagination';
import { Button } from '@/shared/components/ui/button';

/** 추천 API는 페이지 없이 상위 N개를 내려주므로, 한 번에 가져와 화면에서 나눠 보여 준다. */
export const RECOMMENDATION_FETCH_LIMIT = 20;
/** 한 페이지에 보여 주는 코스 수. 썸네일(로드뷰)을 한 번에 4개씩만 불러오기 위한 값이다. */
export const RECOMMENDATION_PAGE_SIZE = 4;

function parsePage(value: string | null) {
  const page = Number(value ?? 0);
  return Number.isInteger(page) && page >= 0 ? page : 0;
}

export function RecommendationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = parsePage(searchParams.get('page'));
  const recommendationsQuery = useCourseRecommendations(RECOMMENDATION_FETCH_LIMIT);

  const total = recommendationsQuery.data?.length ?? 0;
  const totalPages = Math.max(Math.ceil(total / RECOMMENDATION_PAGE_SIZE), 1);
  const page = Math.min(requestedPage, totalPages - 1);
  const pageStart = page * RECOMMENDATION_PAGE_SIZE;

  function updatePage(nextPage: number) {
    const nextParams = new URLSearchParams();
    if (nextPage > 0) nextParams.set('page', String(nextPage));
    setSearchParams(nextParams);
  }

  return (
    <main className="tc-page">
      <header className="tc-page-head max-w-2xl">
        <p className="tc-eyebrow inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          TODAY'S PICKS
        </p>
        <h1 className="tc-page-title mt-3">오늘 가기 좋은 코스</h1>
        <p className="tc-page-desc">
          최신 관광기후지수가 높은 순서로 지금 여행하기 좋은 관광코스를 추천합니다.
        </p>
      </header>

      <section className="mt-6" aria-labelledby="recommendation-results-title">
        <div className="mb-6">
          <h2 className="text-lg font-bold" id="recommendation-results-title">
            추천 순위
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total > 0
              ? `총 ${total}개 코스를 ${RECOMMENDATION_PAGE_SIZE}개씩 나누어 표시합니다.`
              : `${RECOMMENDATION_PAGE_SIZE}개씩 나누어 표시합니다.`}
          </p>
        </div>

        {recommendationsQuery.isPending ? (
          <RecommendationListSkeleton />
        ) : recommendationsQuery.isError ? (
          <EmptyState
            action={<Button onClick={() => recommendationsQuery.refetch()}>다시 시도</Button>}
            description={getApiErrorMessage(recommendationsQuery.error)}
            title="추천 코스를 불러오지 못했습니다"
            variant="error"
          />
        ) : recommendationsQuery.data.length === 0 ? (
          <EmptyState
            description="관광기후지수 데이터가 아직 수집되지 않았을 수 있습니다. 잠시 후 다시 확인해 주세요."
            title="추천할 코스가 아직 없습니다"
          />
        ) : (
          <>
            <ol
              className="space-y-4"
              aria-busy={recommendationsQuery.isFetching && !recommendationsQuery.isPending}
            >
              {recommendationsQuery.data
                .slice(pageStart, pageStart + RECOMMENDATION_PAGE_SIZE)
                .map((course, index) => (
                  <RecommendationCard
                    course={course}
                    key={course.courseId}
                    rank={pageStart + index + 1}
                  />
                ))}
            </ol>
            <Pagination onPageChange={updatePage} page={page} totalPages={totalPages} />
          </>
        )}
      </section>
    </main>
  );
}

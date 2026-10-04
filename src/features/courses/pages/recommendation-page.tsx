import { Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { RecommendationCard } from '@/features/courses/components/recommendation-card';
import { RecommendationListSkeleton } from '@/features/courses/components/recommendation-list-skeleton';
import { useCourseRecommendations } from '@/features/courses/hooks/use-course-recommendations';
import { getApiErrorMessage } from '@/shared/api/get-api-error-message';
import { EmptyState } from '@/shared/components/empty-state';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

const recommendationLimits = [5, 10, 20] as const;
type RecommendationLimit = (typeof recommendationLimits)[number];

function parseLimit(value: string | null): RecommendationLimit {
  const limit = Number(value);
  return recommendationLimits.includes(limit as RecommendationLimit)
    ? (limit as RecommendationLimit)
    : 5;
}

export function RecommendationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const limit = parseLimit(searchParams.get('limit'));
  const recommendationsQuery = useCourseRecommendations(limit);

  function updateLimit(nextLimit: RecommendationLimit) {
    const nextParams = new URLSearchParams();
    if (nextLimit !== 5) nextParams.set('limit', String(nextLimit));
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold" id="recommendation-results-title">
              추천 순위
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">최대 {limit}개 코스를 표시합니다.</p>
          </div>
          <div className="flex rounded-full bg-secondary p-1" aria-label="표시할 추천 코스 수">
            {recommendationLimits.map((option) => (
              <Button
                aria-pressed={limit === option}
                className={cn('min-w-14', limit === option && 'shadow-sm')}
                key={option}
                onClick={() => updateLimit(option)}
                size="sm"
                type="button"
                variant={limit === option ? 'secondary' : 'ghost'}
              >
                {option}개
              </Button>
            ))}
          </div>
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
          <ol
            className="space-y-4"
            aria-busy={recommendationsQuery.isFetching && !recommendationsQuery.isPending}
          >
            {recommendationsQuery.data.map((course, index) => (
              <RecommendationCard course={course} key={course.courseId} rank={index + 1} />
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

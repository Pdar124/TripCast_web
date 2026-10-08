import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCourseRecommendations } from '@/features/courses/hooks/use-course-recommendations';
import type { CourseRecommendation } from '@/features/courses/types';
import { ClimateBadge } from '@/shared/components/climate-badge';
import { EmptyState } from '@/shared/components/empty-state';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { getSpotImage } from '@/shared/lib/spot-image';

function HomeRecommendationCard({ course }: { course: CourseRecommendation }) {
  const image = getSpotImage(course.representativeSpotName);

  return (
    <Link className="tc-interactive-card block" to={`/courses/${course.courseId}`}>
      <div
        className={image ? 'aspect-[16/10] overflow-hidden' : 'tc-route-visual aspect-[16/10]'}
        aria-hidden="true"
      >
        {image && <img alt="" className="h-full w-full object-cover" loading="lazy" src={image} />}
      </div>
      <div className="grid gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="break-keep text-lg font-bold leading-[1.3]">
            {course.representativeSpotName}에서 시작하는 코스
          </h3>
          <ClimateBadge climateIndex={course.climateIndex} />
        </div>
        <p className="text-sm text-muted-foreground">
          {course.representativeThemeName} · 정류지 {course.stopCount}곳
        </p>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--tc-accent-ink)]">
          코스 날씨 보기 <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function LiveRecommendationsSection() {
  const recommendationsQuery = useCourseRecommendations(3);

  return (
    <section className="container scroll-mt-28 py-20 sm:py-24" id="live-recommendations">
      <div className="tc-section-head">
        <div>
          <p className="tc-eyebrow">LIVE RECOMMENDATIONS</p>
          <h2 className="tc-section-title mt-3">실제 데이터로 만나는 오늘의 코스</h2>
          <p className="tc-section-sub">최신 관광기후지수가 높은 순으로 3개를 골랐습니다.</p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link to="/recommendations">
            전체 보기 <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {recommendationsQuery.isPending ? (
        <div className="grid gap-6 md:grid-cols-3" aria-label="추천 코스를 불러오는 중">
          {Array.from({ length: 3 }, (_, index) => (
            <Card className="overflow-hidden" key={index}>
              <Skeleton className="aspect-[16/10] rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : recommendationsQuery.isError ? (
        <EmptyState
          action={<Button onClick={() => recommendationsQuery.refetch()}>다시 시도</Button>}
          description="추천 코스를 불러오는 중 문제가 발생했습니다."
          title="추천 코스를 불러오지 못했습니다"
          variant="error"
        />
      ) : recommendationsQuery.data.length === 0 ? (
        <EmptyState
          description="관광기후지수 데이터가 아직 수집되지 않았을 수 있습니다."
          title="추천할 코스가 없습니다"
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {recommendationsQuery.data.map((course) => (
            <HomeRecommendationCard course={course} key={course.courseId} />
          ))}
        </div>
      )}
    </section>
  );
}

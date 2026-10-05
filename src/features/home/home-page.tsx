import { ArrowRight, ChartNoAxesCombined, Compass, Route, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useCourseRecommendations } from '@/features/courses/hooks/use-course-recommendations';
import type { CourseRecommendation } from '@/features/courses/types';
import { ClimateBadge } from '@/shared/components/climate-badge';
import { EmptyState } from '@/shared/components/empty-state';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { getSpotImage } from '@/shared/lib/spot-image';

const quickLinks: Array<{
  description: string;
  icon: LucideIcon;
  label: string;
  to: string;
}> = [
  {
    description: '이름으로 관광지를 찾고 오늘 예보를 확인합니다.',
    icon: Search,
    label: '관광지 검색',
    to: '/spots',
  },
  {
    description: '정류지 순서와 이동시간이 정리된 관광코스를 살펴봅니다.',
    icon: Route,
    label: '코스 둘러보기',
    to: '/courses',
  },
  {
    description: '시군구별 최신 지수와 기간 추이를 그래프로 확인합니다.',
    icon: ChartNoAxesCombined,
    label: '관광기후지수',
    to: '/climate',
  },
];

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

export function HomePage() {
  const recommendationsQuery = useCourseRecommendations(3);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mountTimer = window.setTimeout(() => window.TripCastHero?.mount(heroRef.current), 0);
    return () => {
      window.clearTimeout(mountTimer);
      window.TripCastHero?.unmount();
    };
  }, []);

  return (
    <main>
      <section
        className="tc-hero relative h-screen min-h-[640px] overflow-hidden bg-[var(--hero-bg)]"
        id="hero"
        ref={heroRef}
      >
        <img
          alt=""
          className="tc-hero-still"
          height="1440"
          src="/assets/img/hero-terrain.jpg"
          width="1920"
        />
        <div className="absolute inset-0 z-[1] bg-[var(--tc-hero-scrim)]" aria-hidden="true" />
        <div className="container relative z-10 flex h-full max-w-[720px] flex-col justify-center text-[var(--tc-hero-foreground)]">
          <div>
            <p className="tc-eyebrow text-[var(--tc-hero-muted)]">관광코스 날씨 통합 서비스</p>
            <h1 className="mt-4 text-[64px] font-bold leading-[1.02] tracking-[-1.5px] [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
              오늘,
              <br />
              어디로 떠날까
            </h1>
            <p className="mt-5 max-w-[34em] break-keep text-lg leading-8 text-[var(--tc-hero-muted)] sm:text-xl">
              기상청 단기예보와 관광기후지수를 코스 단위로 묶어 보여줍니다. 지금 가장 쾌적한
              여행길을 1초 만에 고르세요.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="uppercase tracking-[0.1em]" size="lg">
                <Link to="/recommendations">오늘의 추천 코스 보기</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/spots">관광지 검색</Link>
              </Button>
            </div>
          </div>
        </div>
        <p className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-xs uppercase tracking-[0.09em] text-[var(--tc-hero-muted)]">
          <Compass className="h-4 w-4" aria-hidden="true" /> 스크롤해서 더 보기
        </p>
      </section>

      <section className="tc-section container">
        <div className="grid gap-6 md:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="group tc-interactive-card grid gap-3 p-6" key={item.to} to={item.to}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-[var(--tc-accent-ink)] transition-colors group-hover:bg-primary">
                  <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
                </span>
                <span className="text-lg font-bold">{item.label}</span>
                <span className="break-keep text-sm text-muted-foreground">{item.description}</span>
                <span className="inline-flex items-center gap-2 text-sm text-[var(--tc-accent-ink)]">
                  바로가기 <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container pb-16">
        <div className="tc-section-head">
          <div>
            <h2 className="tc-section-title">오늘 가기 좋은 코스</h2>
            <p className="tc-section-sub">관광기후지수가 높은 순으로 3개를 골랐습니다.</p>
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
    </main>
  );
}

import { List, Map as MapIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { TOUR_SPOT_PAGE_SIZE } from '@/features/spots/api/spot-api';
import { SpotCard } from '@/features/spots/components/spot-card';
import { SpotMap } from '@/features/spots/components/spot-map';
import { SpotListSkeleton } from '@/features/spots/components/spot-list-skeleton';
import { SpotSearchBar } from '@/features/spots/components/spot-search-bar';
import { useTourSpots } from '@/features/spots/hooks/use-tour-spots';
import { getApiErrorMessage } from '@/shared/api/get-api-error-message';
import { EmptyState } from '@/shared/components/empty-state';
import { Pagination } from '@/shared/components/pagination';
import { Button } from '@/shared/components/ui/button';
import { isValidCoordinate } from '@/shared/lib/kakao-maps';
import { cn } from '@/shared/lib/utils';

function parsePage(value: string | null) {
  const page = Number(value ?? 0);
  return Number.isInteger(page) && page >= 0 ? page : 0;
}

type SpotView = 'list' | 'map';

const spotViews: Array<{ value: SpotView; label: string; icon: typeof List }> = [
  { value: 'list', label: '목록', icon: List },
  { value: 'map', label: '지도', icon: MapIcon },
];

export function SpotListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view: SpotView = searchParams.get('view') === 'map' ? 'map' : 'list';
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const page = parsePage(searchParams.get('page'));
  const spotsQuery = useTourSpots({ keyword, page, size: TOUR_SPOT_PAGE_SIZE });

  function updateSearchParams(nextKeyword: string, nextPage: number, nextView: SpotView = view) {
    const nextParams = new URLSearchParams();
    if (nextKeyword) nextParams.set('keyword', nextKeyword);
    if (nextPage > 0) nextParams.set('page', String(nextPage));
    if (nextView === 'map') nextParams.set('view', 'map');
    setSearchParams(nextParams);
  }

  const mappableCount =
    spotsQuery.data?.content.filter((spot) => isValidCoordinate(spot.latitude, spot.longitude))
      .length ?? 0;

  return (
    <main className="tc-page">
      <header className="tc-page-head max-w-2xl">
        <p className="tc-eyebrow">SPOT SEARCH</p>
        <h1 className="tc-page-title mt-3">관광지 검색</h1>
        <p className="tc-page-desc">
          이름으로 관광지를 찾고 위치와 오늘의 단기예보, 관광기후지수를 확인하세요.
        </p>
      </header>

      <div className="rounded-lg bg-card p-4 sm:p-5">
        <SpotSearchBar
          defaultKeyword={keyword}
          key={keyword}
          onSearch={(nextKeyword) => updateSearchParams(nextKeyword, 0)}
        />
      </div>

      <section className="mt-12" aria-labelledby="spot-results-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-lg font-bold" id="spot-results-title">
              {keyword ? `“${keyword}” 검색 결과` : '전체 관광지'}
            </h2>
            {spotsQuery.data && spotsQuery.data.content.length > 0 && (
              <p className="whitespace-nowrap text-sm text-muted-foreground">
                총 <strong className="text-foreground">{spotsQuery.data.totalElements}</strong>곳
              </p>
            )}
          </div>
          <div
            aria-label="보기 방식"
            className="flex w-full rounded-full bg-secondary p-1 sm:w-auto"
            role="group"
          >
            {spotViews.map(({ value, label, icon: Icon }) => (
              <Button
                aria-pressed={view === value}
                className={cn(
                  'flex-1 sm:min-w-[4.5rem] sm:flex-none',
                  view === value && 'shadow-sm',
                )}
                key={value}
                onClick={() => updateSearchParams(keyword, page, value)}
                size="sm"
                type="button"
                variant={view === value ? 'secondary' : 'ghost'}
              >
                <Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {spotsQuery.isPending ? (
          <SpotListSkeleton />
        ) : spotsQuery.isError ? (
          <EmptyState
            action={<Button onClick={() => spotsQuery.refetch()}>다시 시도</Button>}
            description={getApiErrorMessage(spotsQuery.error)}
            title="관광지 목록을 불러오지 못했습니다"
            variant="error"
          />
        ) : spotsQuery.data.content.length === 0 ? (
          <EmptyState
            description={
              keyword ? '다른 검색어로 다시 찾아보세요.' : '등록된 관광지가 아직 없습니다.'
            }
            title="검색 결과가 없습니다"
          />
        ) : (
          <>
            {view === 'map' ? (
              <div aria-busy={spotsQuery.isFetching && !spotsQuery.isPending}>
                <SpotMap
                  label="검색 결과 관광지 지도"
                  markers={spotsQuery.data.content.map((spot) => ({
                    id: spot.id,
                    name: spot.name,
                    latitude: spot.latitude,
                    longitude: spot.longitude,
                  }))}
                  onSelectMarker={(id) => navigate(`/spots/${id}`)}
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  {mappableCount === spotsQuery.data.content.length
                    ? `현재 페이지의 ${mappableCount}곳을 표시합니다.`
                    : `현재 페이지 ${spotsQuery.data.content.length}곳 중 위치 정보가 있는 ${mappableCount}곳을 표시합니다.`}{' '}
                  마커를 누르면 상세 페이지로 이동합니다.
                </p>
              </div>
            ) : (
              <div
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                aria-busy={spotsQuery.isFetching && !spotsQuery.isPending}
              >
                {spotsQuery.data.content.map((spot) => (
                  <SpotCard key={spot.id} spot={spot} />
                ))}
              </div>
            )}
            <Pagination
              onPageChange={(nextPage) => updateSearchParams(keyword, nextPage)}
              page={spotsQuery.data.number}
              totalPages={spotsQuery.data.totalPages}
            />
          </>
        )}
      </section>
    </main>
  );
}

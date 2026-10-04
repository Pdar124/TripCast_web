import { ArrowLeft, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { SpotDetailSkeleton } from '@/features/spots/components/spot-detail-skeleton';
import { SpotMapPlaceholder } from '@/features/spots/components/spot-map-placeholder';
import { useTourSpotWeather } from '@/features/spots/hooks/use-tour-spot-weather';
import { getApiErrorMessage } from '@/shared/api/get-api-error-message';
import { ClimateBadge } from '@/shared/components/climate-badge';
import { EmptyState } from '@/shared/components/empty-state';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { WeatherCard } from '@/shared/components/weather-card';

function isValidId(id: string | undefined): id is string {
  return Boolean(id && /^\d+$/.test(id) && Number(id) > 0);
}

export function SpotDetailPage() {
  const { id } = useParams();
  const validId = isValidId(id) ? id : undefined;
  const spotQuery = useTourSpotWeather(validId);

  return (
    <main className="tc-page">
      <div className="tc-page-head">
        <Button asChild size="sm" variant="outline">
          <Link to="/spots">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            검색으로 돌아가기
          </Link>
        </Button>
      </div>

      {!validId ? (
        <EmptyState
          action={
            <Button asChild>
              <Link to="/spots">관광지 검색하기</Link>
            </Button>
          }
          description="올바른 관광지 주소인지 확인해 주세요."
          title="관광지를 찾을 수 없습니다"
          variant="error"
        />
      ) : spotQuery.isPending ? (
        <SpotDetailSkeleton />
      ) : spotQuery.isError ? (
        <EmptyState
          action={<Button onClick={() => spotQuery.refetch()}>다시 시도</Button>}
          description={getApiErrorMessage(spotQuery.error)}
          title="관광지 정보를 불러오지 못했습니다"
          variant="error"
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-5">
            <Card className="p-6 sm:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
                <MapPin className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="tc-eyebrow mt-5">SPOT WEATHER</p>
              <h1 className="mt-2 break-keep text-3xl font-bold tracking-tight">
                {spotQuery.data.tourSpotName}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                위도 {spotQuery.data.latitude.toFixed(4)} · 경도{' '}
                {spotQuery.data.longitude.toFixed(4)}
              </p>
              <div className="mt-6 border-t pt-5">
                <p className="mb-3 text-sm font-semibold text-muted-foreground">관광기후지수</p>
                <ClimateBadge climateIndex={spotQuery.data.climateIndex} />
              </div>
            </Card>

            <section aria-labelledby="weather-heading">
              <h2 className="mb-3 text-lg font-bold" id="weather-heading">
                오늘 단기예보
              </h2>
              <WeatherCard weather={spotQuery.data.weather} />
            </section>
          </div>

          <SpotMapPlaceholder
            latitude={spotQuery.data.latitude}
            longitude={spotQuery.data.longitude}
            name={spotQuery.data.tourSpotName}
          />
        </div>
      )}
    </main>
  );
}

import { type FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { RegionCombobox } from '@/features/climate/components/region-combobox';
import {
  useClimateIndexRange,
  useLatestClimateIndex,
  useRegions,
} from '@/features/climate/hooks/use-climate-index';
import type { ClimateIndex } from '@/features/climate/types';
import { getApiErrorMessage } from '@/shared/api/get-api-error-message';
import { ClimateBadge } from '@/shared/components/climate-badge';
import { EmptyState } from '@/shared/components/empty-state';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { scrollToTarget } from '@/shared/lib/scroll-navigation';

const REGION_ID_PATTERN = /^\d{10}$/;

function normalizeRegionId(value: string) {
  const trimmed = value.trim();
  return /^\d{5}$/.test(trimmed) ? `${trimmed}00000` : trimmed;
}

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ClimateChart({ series }: { series: ClimateIndex[] }) {
  const scores = series.map((item) => item.score);
  const minimum = Math.min(...scores);
  const maximum = Math.max(...scores);
  const padding =
    minimum === maximum ? Math.max(Math.abs(maximum) * 0.15, 0.1) : (maximum - minimum) * 0.15;
  const domainMinimum = minimum - padding;
  const domainMaximum = maximum + padding;
  const domainSize = domainMaximum - domainMinimum;
  const chartY = (score: number) => 90 - ((score - domainMinimum) / domainSize) * 80;
  const gridLines = Array.from({ length: 5 }, (_, index) => 10 + index * 20);
  const points = series
    .map((item, index) => {
      const x = series.length === 1 ? 50 : (index / (series.length - 1)) * 100;
      return `${x},${chartY(item.score)}`;
    })
    .join(' ');

  return (
    <div className="overflow-hidden rounded-lg bg-card p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="tc-section-title">기간 추이</h2>
          <p className="tc-section-sub">
            {series[0]?.date} – {series.at(-1)?.date} · {series.length}일
          </p>
        </div>
        <span className="tc-tag">
          원문 지수 {minimum.toFixed(2)}–{maximum.toFixed(2)}
        </span>
      </div>
      <svg
        className="h-[340px] w-full overflow-visible"
        role="img"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-label="기간별 관광기후지수 추이 그래프"
      >
        {gridLines.map((y) => (
          <line
            key={y}
            x1="0"
            x2="100"
            y1={y}
            y2={y}
            stroke="var(--tc-grid-line)"
            strokeWidth="0.5"
          />
        ))}
        <polyline
          fill="none"
          points={points}
          stroke="var(--tc-accent-ink)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {series.map((item, index) => {
          const x = series.length === 1 ? 50 : (index / (series.length - 1)) * 100;
          return (
            <circle
              key={`${item.date}-${index}`}
              cx={x}
              cy={chartY(item.score)}
              fill="var(--tc-accent)"
              r="1.25"
              vectorEffect="non-scaling-stroke"
            >
              <title>{`${item.date} · 지수 ${item.score} · ${item.grade}`}</title>
            </circle>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>기간별 관광기후지수</caption>
        <thead>
          <tr>
            <th>날짜</th>
            <th>지수</th>
            <th>등급</th>
          </tr>
        </thead>
        <tbody>
          {series.map((item) => (
            <tr key={item.date}>
              <td>{item.date}</td>
              <td>{item.score}</td>
              <td>{item.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClimatePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 13);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const requestedRegionId = normalizeRegionId(searchParams.get('region') || '5013000000');
  const regionId = REGION_ID_PATTERN.test(requestedRegionId) ? requestedRegionId : '5013000000';
  const from = searchParams.get('from') || isoDate(twoWeeksAgo);
  const to = searchParams.get('to') || isoDate(tomorrow);
  const latestQuery = useLatestClimateIndex(regionId);
  const rangeQuery = useClimateIndexRange(regionId, from, to);
  const regionsQuery = useRegions();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextRegionId = normalizeRegionId(String(form.get('region') ?? ''));
    const nextFrom = String(form.get('from') ?? '');
    const nextTo = String(form.get('to') ?? '');

    if (regionsQuery.isSuccess && !nextRegionId) {
      setFormError('검색 결과에서 지역을 선택해 주세요.');
      return;
    }

    if (!REGION_ID_PATTERN.test(nextRegionId)) {
      setFormError('시군구 코드는 숫자 10자리로 입력해 주세요.');
      return;
    }

    if (!nextFrom || !nextTo || nextFrom > nextTo) {
      setFormError('조회 시작일과 종료일을 올바르게 입력해 주세요.');
      return;
    }

    setFormError(null);
    setSearchParams(
      {
        region: nextRegionId,
        from: nextFrom,
        to: nextTo,
      },
      { state: scrollToTarget('climate-results') },
    );
  }

  return (
    <main className="tc-page">
      <header className="tc-page-head max-w-2xl">
        <p className="tc-eyebrow">CLIMATE INDEX</p>
        <h1 className="tc-page-title mt-3">관광기후지수</h1>
        <p className="tc-page-desc">
          관광기후지수는 열쾌적성, 바람, 강수, 일사량을 종합해 야외 관광 적합도를 나타낸 기상청
          지수입니다. 표시된 등급은 기상청 제공 결과를 기준으로 합니다.
        </p>
      </header>

      <form
        className="grid gap-4 rounded-lg bg-card p-5 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-end"
        key={`${regionId}-${from}-${to}`}
        onSubmit={submit}
      >
        {regionsQuery.isPending ? (
          <div className="grid gap-2 text-xs font-bold">
            지역
            <Skeleton className="h-12 rounded-md" />
          </div>
        ) : regionsQuery.isError ? (
          <label className="grid gap-2 text-xs font-bold">
            시군구 코드
            <input
              className="h-12 rounded-md border border-transparent bg-secondary px-4 text-sm"
              defaultValue={regionId}
              inputMode="numeric"
              maxLength={10}
              minLength={10}
              name="region"
            />
          </label>
        ) : (
          <RegionCombobox regionId={regionId} regions={regionsQuery.data} />
        )}
        <label className="grid gap-2 text-xs font-bold">
          시작일
          <input
            className="h-12 rounded-md border border-transparent bg-secondary px-4 text-sm"
            defaultValue={from}
            name="from"
            type="date"
          />
        </label>
        <label className="grid gap-2 text-xs font-bold">
          종료일
          <input
            className="h-12 rounded-md border border-transparent bg-secondary px-4 text-sm"
            defaultValue={to}
            name="to"
            type="date"
          />
        </label>
        <Button className="h-12" type="submit">
          조회
        </Button>
        {formError && (
          <p className="text-sm font-medium text-destructive md:col-span-4" role="alert">
            {formError}
          </p>
        )}
        {regionsQuery.isError && !formError && (
          <p className="text-sm font-medium text-muted-foreground md:col-span-4" role="status">
            지역 목록을 불러오지 못했습니다. 시군구 코드 10자리를 직접 입력해 주세요.
          </p>
        )}
      </form>

      <div className="mt-8 space-y-8" id="climate-results">
        {latestQuery.isPending ? (
          <Skeleton className="h-36 rounded-lg" />
        ) : latestQuery.isError ? (
          <EmptyState
            description={getApiErrorMessage(latestQuery.error)}
            title="해당 지역의 관광기후지수가 없습니다"
            variant="error"
          />
        ) : (
          <section className="flex flex-wrap items-center justify-between gap-6 rounded-lg bg-card p-6">
            <div>
              <p className="tc-eyebrow">최신 지수</p>
              <h2 className="mt-2 text-xl font-bold">시군구 코드 {latestQuery.data.regionId}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{latestQuery.data.date} 기준</p>
            </div>
            <ClimateBadge climateIndex={latestQuery.data} size="large" />
          </section>
        )}
        {rangeQuery.isPending ? (
          <Skeleton className="h-[430px] rounded-lg" />
        ) : rangeQuery.isError ? (
          <EmptyState
            description={getApiErrorMessage(rangeQuery.error)}
            title="기간별 관광기후지수를 불러오지 못했습니다"
            variant="error"
          />
        ) : rangeQuery.data.length === 0 ? (
          <EmptyState
            description="조회 기간을 넓히거나 최근 날짜로 다시 조회해 보세요."
            title="해당 기간에 저장된 지수가 없습니다"
          />
        ) : (
          <ClimateChart series={rangeQuery.data} />
        )}
      </div>
    </main>
  );
}

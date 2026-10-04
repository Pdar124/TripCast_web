import { type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  useClimateIndexRange,
  useLatestClimateIndex,
} from '@/features/climate/hooks/use-climate-index';
import type { ClimateIndex } from '@/features/climate/types';
import { getApiErrorMessage } from '@/shared/api/get-api-error-message';
import { ClimateBadge } from '@/shared/components/climate-badge';
import { EmptyState } from '@/shared/components/empty-state';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

const regions = [
  ['50130', '서귀포시'],
  ['50110', '제주시'],
  ['47130', '경주시'],
  ['26350', '해운대구'],
  ['26500', '수영구'],
  ['26380', '사하구'],
  ['26200', '영도구'],
  ['42150', '강릉시'],
  ['11110', '종로구'],
  ['45111', '완산구'],
] as const;

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ClimateChart({ series }: { series: ClimateIndex[] }) {
  const points = series
    .map((item, index) => {
      const x = series.length === 1 ? 50 : (index / (series.length - 1)) * 100;
      return `${x},${100 - Math.max(0, Math.min(100, item.score))}`;
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
        <span className="tc-tag">0–100 관광기후지수</span>
      </div>
      <svg
        className="h-[340px] w-full overflow-visible"
        role="img"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-label="기간별 관광기후지수 추이 그래프"
      >
        {[0, 25, 50, 75, 100].map((value) => (
          <line
            key={value}
            x1="0"
            x2="100"
            y1={100 - value}
            y2={100 - value}
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
              cy={100 - item.score}
              fill="var(--tc-accent)"
              r="1.25"
              vectorEffect="non-scaling-stroke"
            />
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
  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 13);
  const regionId = searchParams.get('region') || '50130';
  const from = searchParams.get('from') || isoDate(twoWeeksAgo);
  const to = searchParams.get('to') || isoDate(today);
  const latestQuery = useLatestClimateIndex(regionId);
  const rangeQuery = useClimateIndexRange(regionId, from, to);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSearchParams({
      region: String(form.get('region') ?? '').trim(),
      from: String(form.get('from') ?? ''),
      to: String(form.get('to') ?? ''),
    });
  }

  function selectRegion(region: string) {
    setSearchParams({ region, from, to });
  }

  return (
    <main className="tc-page">
      <header className="tc-page-head max-w-2xl">
        <p className="tc-eyebrow">CLIMATE INDEX</p>
        <h1 className="tc-page-title mt-3">관광기후지수</h1>
        <p className="tc-page-desc">
          시군구 코드로 최신 지수와 기간 추이를 확인합니다. 지수는 더위·추위·체감 쾌적도를 0~100으로
          환산한 값입니다.
        </p>
      </header>

      <form
        className="grid gap-4 rounded-lg bg-card p-5 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-end"
        onSubmit={submit}
      >
        <label className="grid gap-2 text-xs font-bold">
          시군구 코드
          <input
            className="h-12 rounded-md border border-transparent bg-secondary px-4 text-sm"
            defaultValue={regionId}
            list="region-codes"
            name="region"
            inputMode="numeric"
          />
        </label>
        <datalist id="region-codes">
          {regions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </datalist>
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
      </form>

      <div className="my-8 flex flex-wrap gap-2">
        {regions.map(([id, name]) => (
          <button
            aria-pressed={id === regionId}
            className="rounded-full bg-secondary px-4 py-2 text-sm font-bold transition max-sm:min-h-11 hover:bg-[var(--tc-surface-hover)] aria-pressed:bg-primary"
            key={id}
            onClick={() => selectRegion(id)}
            type="button"
          >
            {name}
          </button>
        ))}
      </div>

      <div className="space-y-8">
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

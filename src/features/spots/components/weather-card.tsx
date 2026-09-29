import { Cloud, CloudSun, Sun } from 'lucide-react';

import type { Weather } from '@/features/spots/types';
import { Card } from '@/shared/components/ui/card';

type WeatherCardProps = {
  weather?: Weather | null;
};

const skyMap = {
  맑음: { icon: Sun, label: '맑음' },
  구름많음: { icon: CloudSun, label: '구름 많음' },
  흐림: { icon: Cloud, label: '흐림' },
} as const;

function formatForecastTime(date?: string | null, time?: string | null) {
  const formattedDate =
    date && /^\d{8}$/.test(date)
      ? `${date.slice(0, 4)}.${date.slice(4, 6)}.${date.slice(6, 8)}`
      : date;
  const formattedTime =
    time && /^\d{4}$/.test(time) ? `${time.slice(0, 2)}:${time.slice(2, 4)}` : time;

  return [formattedDate, formattedTime].filter(Boolean).join(' ') || '예보 시각 정보 없음';
}

export function WeatherCard({ weather }: WeatherCardProps) {
  if (weather == null) {
    return (
      <Card className="grid min-h-48 place-items-center border-dashed p-6 text-center">
        <div className="space-y-3">
          <Cloud className="mx-auto h-9 w-9 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold">날씨 정보를 불러오지 못했습니다</p>
          <p className="text-sm text-muted-foreground">관광지 정보는 계속 확인할 수 있습니다.</p>
        </div>
      </Card>
    );
  }

  const sky = weather.sky?.trim() ?? '';
  const mappedSky = skyMap[sky as keyof typeof skyMap];
  const SkyIcon = mappedSky?.icon ?? Cloud;
  const temperature =
    typeof weather.temperature === 'number' && Number.isFinite(weather.temperature)
      ? `${weather.temperature}°C`
      : '정보 없음';
  const rainProbability =
    typeof weather.rainProbability === 'number' && Number.isFinite(weather.rainProbability)
      ? `${weather.rainProbability}%`
      : '정보 없음';

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">현재 단기예보</p>
          <p className="mt-2 text-4xl font-bold tabular-nums">{temperature}</p>
        </div>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
          <SkyIcon className="h-7 w-7" aria-hidden="true" />
        </span>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-5">
        <div>
          <dt className="text-sm text-muted-foreground">하늘 상태</dt>
          <dd className="mt-1 font-semibold">{mappedSky?.label ?? '날씨 정보 없음'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">강수확률</dt>
          <dd className="mt-1 font-semibold tabular-nums">{rainProbability}</dd>
        </div>
      </dl>
      <p className="mt-5 text-xs text-muted-foreground">
        {formatForecastTime(weather.forecastDate, weather.forecastTime)} 기준 · 기상청 단기예보
      </p>
    </Card>
  );
}

import { Cloud, CloudSun, Sun } from 'lucide-react';

type WeatherCardProps = {
  weather?: {
    forecastDate?: string | null;
    forecastTime?: string | null;
    temperature?: number | null;
    rainProbability?: number | null;
    sky?: string | null;
  } | null;
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
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-secondary p-5">
        <Cloud className="h-8 w-8 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="font-bold">날씨 정보를 불러오지 못했습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">
            관광지 정보는 계속 확인할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  const sky = weather.sky?.trim() ?? '';
  const mappedSky = skyMap[sky as keyof typeof skyMap];
  const SkyIcon = mappedSky?.icon ?? Cloud;
  const temperature =
    typeof weather.temperature === 'number' && Number.isFinite(weather.temperature)
      ? `${weather.temperature}°`
      : '정보 없음';
  const rainProbability =
    typeof weather.rainProbability === 'number' && Number.isFinite(weather.rainProbability)
      ? `${weather.rainProbability}%`
      : '정보 없음';

  return (
    <div className="rounded-lg bg-secondary p-5">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-background text-primary">
          <SkyIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            단기예보
          </p>
          <p className="mt-1 text-[40px] font-black leading-none tracking-tight tabular-nums">
            {temperature}
          </p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border/70 pt-4">
        <div>
          <dt className="text-xs text-muted-foreground">하늘</dt>
          <dd className="mt-1 text-sm font-bold">{mappedSky?.label ?? '날씨 정보 없음'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">강수확률</dt>
          <dd className="mt-1 text-sm font-bold tabular-nums">{rainProbability}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">예보 시각</dt>
          <dd className="mt-1 text-sm font-bold leading-snug">
            {formatForecastTime(weather.forecastDate, weather.forecastTime)}
          </dd>
        </div>
      </dl>
      <p className="sr-only">
        {formatForecastTime(weather.forecastDate, weather.forecastTime)} 기준 · 기상청 단기예보
      </p>
    </div>
  );
}

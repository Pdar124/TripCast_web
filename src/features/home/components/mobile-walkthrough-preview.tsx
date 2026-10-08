import { Cloud, CloudSun, MapPin, Search, Sun } from 'lucide-react';

import {
  climateGrades,
  walkthroughData,
  type WalkthroughSpot,
  type WalkthroughStepId,
} from '@/features/home/data/walkthrough-data';
import { ClimateBadge } from '@/shared/components/climate-badge';
import { WeatherCard } from '@/shared/components/weather-card';

function WeatherIcon({ sky }: { sky: WalkthroughSpot['sky'] }) {
  const Icon = sky === '맑음' ? Sun : sky === '구름많음' ? CloudSun : Cloud;
  return <Icon className="h-4 w-4 text-primary" aria-hidden="true" />;
}

export function MobileWalkthroughPreview({ step }: { step: WalkthroughStepId }) {
  if (step === 'search') {
    return (
      <div className="space-y-3">
        <div className="flex h-12 items-center rounded-xl bg-secondary px-4 text-sm font-bold">
          <Search className="mr-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {walkthroughData.destination}
        </div>
        <div className="rounded-xl border border-border bg-background p-2">
          {walkthroughData.spots.map((spot, index) => (
            <div
              className={
                index === 0
                  ? 'flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-bold'
                  : 'flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground'
              }
              key={spot.id}
            >
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> {spot.name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'weather') {
    const spot = walkthroughData.spots[0];
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold">{spot.name}</h3>
          <ClimateBadge climateIndex={walkthroughData.climate} />
        </div>
        <WeatherCard
          weather={{
            forecastDate: '오늘',
            forecastTime: '1200',
            temperature: spot.temperature,
            rainProbability: spot.rainProbability,
            sky: spot.sky,
          }}
        />
      </div>
    );
  }

  if (step === 'course') {
    return (
      <ol className="space-y-3">
        {walkthroughData.spots.map((spot, index) => (
          <li className="relative flex items-center gap-3 pb-3 last:pb-0" key={spot.id}>
            <span
              className="absolute bottom-[-0.75rem] left-[1.1rem] top-9 w-px bg-primary/40 last:hidden"
              aria-hidden="true"
            />
            <span className="z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 rounded-xl bg-secondary px-3 py-2.5">
              <p className="truncate text-sm font-bold">{spot.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <WeatherIcon sky={spot.sky} /> {spot.temperature}° · 강수 {spot.rainProbability}%
              </p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  if (step === 'climate') {
    return (
      <div className="text-center">
        <ClimateBadge climateIndex={walkthroughData.climate} size="large" />
        <p className="mt-4 font-bold">{walkthroughData.climate.description}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {climateGrades.map(({ grade }) => (
            <ClimateBadge climateIndex={{ grade }} key={grade} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {walkthroughData.recommendations.map((course, index) => (
        <article
          className={
            index === 0
              ? 'rounded-xl border border-primary/40 bg-primary/10 p-4 shadow-sm'
              : 'rounded-xl border border-border bg-background p-4'
          }
          key={course.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                {index === 0 ? '오늘 추천' : `${index + 1}순위`}
              </p>
              <h3 className="mt-1 text-sm font-bold">{course.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{course.description}</p>
            </div>
            <ClimateBadge climateIndex={{ grade: course.grade }} />
          </div>
        </article>
      ))}
    </div>
  );
}

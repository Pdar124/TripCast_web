import { MapPinned } from 'lucide-react';

import type { TourCourseStopWeather } from '@/features/courses/types';

type CourseRoutePlaceholderProps = {
  stops: TourCourseStopWeather[];
};

function formatCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(4) : '정보 없음';
}

export function CourseRoutePlaceholder({ stops }: CourseRoutePlaceholderProps) {
  return (
    <aside className="tc-route-visual overflow-hidden rounded-lg lg:sticky lg:top-24 lg:min-h-[680px]">
      <div className="relative grid min-h-72 place-items-center border-b border-border/60 p-6 text-center lg:min-h-[420px]">
        <div
          className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent"
          aria-hidden="true"
        />
        <div className="relative space-y-3">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-background/90 text-primary shadow-sm">
            <MapPinned className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold">코스 경로</h2>
            <p className="mt-1 text-sm text-muted-foreground">방문 순서와 좌표를 확인하세요.</p>
          </div>
        </div>
      </div>

      <ol className="relative max-h-[260px] space-y-4 overflow-y-auto bg-background/85 p-5 backdrop-blur-sm">
        {stops.map(({ spot }) => (
          <li className="flex gap-3" key={spot.stopId}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-background text-xs font-bold text-primary shadow-sm">
              {spot.courseOrder}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{spot.tourSpotName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCoordinate(spot.latitude)}, {formatCoordinate(spot.longitude)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}

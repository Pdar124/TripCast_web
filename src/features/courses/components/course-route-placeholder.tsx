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
    <aside className="overflow-hidden rounded-lg border bg-muted/60 lg:sticky lg:top-24">
      <div className="relative grid min-h-52 place-items-center overflow-hidden border-b p-6 text-center">
        <div
          className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:32px_32px]"
          aria-hidden="true"
        />
        <div className="relative space-y-3">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-card text-primary shadow-sm">
            <MapPinned className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold">코스 경로</h2>
            <p className="mt-1 text-sm text-muted-foreground">방문 순서와 좌표를 확인하세요.</p>
          </div>
        </div>
      </div>

      <ol className="max-h-[28rem] space-y-4 overflow-y-auto p-5">
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

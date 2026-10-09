import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { CourseMap } from '@/features/courses/components/course-map';
import type { TourCourseStop } from '@/features/courses/types';

type CourseRoutePanelProps = {
  /** 방문 순서대로 정렬된 정류지 */
  stops: TourCourseStop[];
};

function formatCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(4) : '정보 없음';
}

export function CourseRoutePanel({ stops }: CourseRoutePanelProps) {
  const navigate = useNavigate();
  const mapStops = useMemo(
    () =>
      stops.map((spot) => ({
        stopId: spot.stopId,
        spotId: spot.tourSpotId,
        order: spot.courseOrder,
        name: spot.tourSpotName,
        latitude: spot.latitude,
        longitude: spot.longitude,
      })),
    [stops],
  );

  return (
    <aside className="overflow-hidden rounded-lg bg-card lg:sticky lg:top-24">
      <CourseMap
        label="코스 경로 지도"
        onSelectStop={(spotId) => navigate(`/spots/${spotId}`)}
        stops={mapStops}
      />

      <ol className="max-h-[260px] space-y-4 overflow-y-auto border-t border-border/60 p-5">
        {stops.map((spot) => (
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

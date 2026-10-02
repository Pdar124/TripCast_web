import { Clock3, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import { IndoorTypeBadge } from '@/features/courses/components/indoor-type-badge';
import type { TourCourseStopWeather } from '@/features/courses/types';
import { ClimateBadge } from '@/shared/components/climate-badge';
import { Card } from '@/shared/components/ui/card';
import { WeatherCard } from '@/shared/components/weather-card';

type CourseStopItemProps = {
  stopWeather: TourCourseStopWeather;
};

function formatCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(4) : '정보 없음';
}

export function CourseStopItem({ stopWeather }: CourseStopItemProps) {
  const { spot, climateIndex, weather } = stopWeather;
  const travelLabel =
    spot.courseOrder === 1 || spot.travelTime <= 0 ? '출발지' : `이동 ${spot.travelTime}분`;

  return (
    <li className="group relative pl-12">
      <span className="absolute left-0 top-0 z-10 grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        {spot.courseOrder}
      </span>
      <span
        className="absolute bottom-[-1.25rem] left-[1.1rem] top-9 w-px bg-border group-last:hidden"
        aria-hidden="true"
      />

      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">{spot.themeName}</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight">
                <Link
                  className="hover:text-primary hover:underline"
                  to={`/spots/${spot.tourSpotId}`}
                >
                  {spot.tourSpotName}
                </Link>
              </h3>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <IndoorTypeBadge indoorType={spot.indoorType} />
              <ClimateBadge climateIndex={climateIndex} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              {travelLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {formatCoordinate(spot.latitude)}, {formatCoordinate(spot.longitude)}
            </span>
          </div>
        </div>

        <div className="border-t bg-muted/30 p-4 sm:p-5">
          <WeatherCard weather={weather} />
        </div>
      </Card>
    </li>
  );
}

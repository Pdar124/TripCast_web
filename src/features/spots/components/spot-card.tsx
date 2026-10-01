import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { TourSpot } from '@/features/spots/types';
import { Card } from '@/shared/components/ui/card';

type SpotCardProps = {
  spot: TourSpot;
};

function formatCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(4) : '정보 없음';
}

export function SpotCard({ spot }: SpotCardProps) {
  return (
    <Card className="group h-full transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg motion-reduce:transform-none">
      <Link className="flex h-full min-h-44 flex-col gap-5 rounded-lg p-6" to={`/spots/${spot.id}`}>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">{spot.name}</h2>
          <p className="text-sm text-muted-foreground">
            위도 {formatCoordinate(spot.latitude)} · 경도 {formatCoordinate(spot.longitude)}
          </p>
        </div>
        <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
          날씨 상세 보기
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
            aria-hidden="true"
          />
        </span>
      </Link>
    </Card>
  );
}

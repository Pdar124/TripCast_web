import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SpotStaticMap } from '@/features/spots/components/spot-static-map';
import type { TourSpot } from '@/features/spots/types';

type SpotCardProps = {
  spot: TourSpot;
};

function formatCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(4) : '정보 없음';
}

export function SpotCard({ spot }: SpotCardProps) {
  return (
    <article className="group tc-interactive-card h-full">
      <Link className="flex h-full flex-col" to={`/spots/${spot.id}`}>
        <SpotStaticMap latitude={spot.latitude} longitude={spot.longitude} />
        <div className="flex flex-1 flex-col p-5">
          <h2 className="text-xl font-bold tracking-tight">{spot.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            위도 {formatCoordinate(spot.latitude)} · 경도 {formatCoordinate(spot.longitude)}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--tc-accent-ink)]">
            날씨 상세 보기
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}

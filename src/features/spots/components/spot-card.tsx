import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { TourSpot } from '@/features/spots/types';
import { getSpotImage } from '@/shared/lib/spot-image';

type SpotCardProps = {
  spot: TourSpot;
};

function formatCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(4) : '정보 없음';
}

export function SpotCard({ spot }: SpotCardProps) {
  const image = getSpotImage(spot.name);

  return (
    <article className="group tc-interactive-card h-full">
      <Link className="flex h-full flex-col" to={`/spots/${spot.id}`}>
        <div
          className={
            image ? 'relative aspect-[16/10] overflow-hidden' : 'tc-route-visual aspect-[16/10]'
          }
          aria-hidden="true"
        >
          {image && (
            <img
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              src={image}
            />
          )}
          <span className="absolute bottom-4 left-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-primary shadow-sm">
            <MapPin className="h-5 w-5" />
          </span>
        </div>
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

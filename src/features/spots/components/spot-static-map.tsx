import { MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { useKakaoMaps } from '@/shared/hooks/use-kakao-maps';
import { getKakaoMapAppKey, isValidCoordinate } from '@/shared/lib/kakao-maps';
import { cn } from '@/shared/lib/utils';

type SpotStaticMapProps = {
  latitude: number;
  longitude: number;
  className?: string;
};

const STATIC_MAP_LEVEL = 4;

/**
 * 관광지 좌표를 중심으로 한 카카오맵 ROADMAP 정적 화면을 그린다. 마커가 포함되고 드래그·확대는 되지 않는다.
 * 좌표가 잘못됐거나 앱 키가 없거나 SDK 로드에 실패하면 공통 대체 화면을 보여 준다.
 * 카드의 장식 영역이므로 보조기술에는 노출하지 않는다.
 */
export function SpotStaticMap({ latitude, longitude, className }: SpotStaticMapProps) {
  const appKey = getKakaoMapAppKey();
  const hasCoordinate = isValidCoordinate(latitude, longitude);
  const containerRef = useRef<HTMLDivElement>(null);
  const { status, maps } = useKakaoMaps(appKey, appKey !== '' && hasCoordinate);

  useEffect(() => {
    const container = containerRef.current;
    if (!maps || !container) return;

    const center = new maps.LatLng(latitude, longitude);
    new maps.StaticMap(container, {
      center,
      level: STATIC_MAP_LEVEL,
      marker: { position: center },
    });

    return () => {
      container.replaceChildren();
    };
  }, [maps, latitude, longitude]);

  const showMap = appKey !== '' && hasCoordinate && status !== 'error';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative aspect-[16/10] overflow-hidden',
        // 지도가 준비되기 전과 대체 화면에서는 공통 배경을 보여 준다.
        !(showMap && status === 'ready') && 'tc-route-visual',
        className,
      )}
      data-testid="spot-static-map"
    >
      {showMap ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 transition-opacity duration-300',
            status === 'ready' ? 'opacity-100' : 'opacity-0',
          )}
          ref={containerRef}
        />
      ) : (
        <span className="absolute bottom-4 left-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-primary shadow-sm">
          <MapPin className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef } from 'react';

import { SpotMapPlaceholder } from '@/features/spots/components/spot-map-placeholder';
import { Button } from '@/shared/components/ui/button';
import { useKakaoMaps } from '@/shared/hooks/use-kakao-maps';
import { getKakaoMapAppKey, isValidCoordinate, type KakaoMap } from '@/shared/lib/kakao-maps';
import { cn } from '@/shared/lib/utils';

export type SpotMapMarker = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

type SpotMapProps = {
  markers: SpotMapMarker[];
  /** 마커를 눌렀을 때 호출한다. 없으면 마커는 표시만 한다. */
  onSelectMarker?: (id: number) => void;
  /** 스크린리더용 지도 설명 */
  label: string;
  className?: string;
};

const MAP_LEVEL = 4;
const MAP_PADDING = 48;
const mapSizeClassName = 'h-80 sm:h-[460px] lg:h-[640px]';

/**
 * 카카오맵에 마커를 표시한다. 앱 키가 없거나 표시할 좌표가 없으면 플레이스홀더를,
 * SDK 로드에 실패하면 안내 문구와 다시 시도 버튼을 보여 준다.
 */
export function SpotMap({ markers, onSelectMarker, label, className }: SpotMapProps) {
  const appKey = getKakaoMapAppKey();
  const validMarkers = useMemo(
    () => markers.filter((marker) => isValidCoordinate(marker.latitude, marker.longitude)),
    [markers],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ container: HTMLElement; map: KakaoMap } | null>(null);
  const onSelectRef = useRef(onSelectMarker);

  useEffect(() => {
    onSelectRef.current = onSelectMarker;
  }, [onSelectMarker]);

  const { status, maps, retry } = useKakaoMaps(appKey, appKey !== '' && validMarkers.length > 0);

  useEffect(() => {
    const container = containerRef.current;
    if (!maps || !container || validMarkers.length === 0) return;

    // 같은 컨테이너에는 지도를 한 번만 만들고, 페이지가 바뀌면 마커만 교체한다.
    if (mapRef.current?.container !== container) {
      const first = validMarkers[0];
      mapRef.current = {
        container,
        map: new maps.Map(container, {
          center: new maps.LatLng(first.latitude, first.longitude),
          level: MAP_LEVEL,
        }),
      };
    }
    const { map } = mapRef.current;

    const bounds = new maps.LatLngBounds();
    const attached = validMarkers.map((spot) => {
      const position = new maps.LatLng(spot.latitude, spot.longitude);
      const marker = new maps.Marker({
        map,
        position,
        title: spot.name,
        clickable: Boolean(onSelectRef.current),
      });
      const handleClick = () => onSelectRef.current?.(spot.id);
      maps.event.addListener(marker, 'click', handleClick);
      bounds.extend(position);
      return { marker, handleClick };
    });

    if (validMarkers.length > 1) {
      map.setBounds(bounds, MAP_PADDING, MAP_PADDING, MAP_PADDING, MAP_PADDING);
    } else {
      map.setCenter(new maps.LatLng(validMarkers[0].latitude, validMarkers[0].longitude));
    }

    return () => {
      attached.forEach(({ marker, handleClick }) => {
        maps.event.removeListener(marker, 'click', handleClick);
        marker.setMap(null);
      });
    };
  }, [maps, validMarkers]);

  if (appKey === '') {
    return (
      <SpotMapPlaceholder
        className={className}
        description="카카오맵 앱 키를 설정하면 관광지 위치를 지도에 표시합니다."
      />
    );
  }

  if (validMarkers.length === 0) {
    return (
      <SpotMapPlaceholder
        className={className}
        description="지도에 표시할 수 있는 위치 정보가 없습니다."
        title="위치 정보 없음"
      />
    );
  }

  if (status === 'error') {
    return (
      <SpotMapPlaceholder
        action={
          <Button onClick={retry} size="sm">
            다시 시도
          </Button>
        }
        className={className}
        description="네트워크 상태나 카카오맵 앱 키·허용 도메인 설정을 확인한 뒤 다시 시도해 주세요."
        title="지도를 불러오지 못했습니다"
      />
    );
  }

  return (
    <div
      aria-busy={status === 'loading'}
      aria-label={label}
      className={cn('tc-route-visual overflow-hidden rounded-lg', mapSizeClassName, className)}
      ref={containerRef}
      role="region"
    />
  );
}

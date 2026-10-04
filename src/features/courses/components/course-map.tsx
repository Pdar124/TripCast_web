import { useEffect, useMemo, useRef } from 'react';

import { SpotMapPlaceholder } from '@/features/spots/components/spot-map-placeholder';
import { Button } from '@/shared/components/ui/button';
import { useKakaoMaps } from '@/shared/hooks/use-kakao-maps';
import { getKakaoMapAppKey, isValidCoordinate, type KakaoMap } from '@/shared/lib/kakao-maps';
import { cn } from '@/shared/lib/utils';

export type CourseMapStop = {
  /** 정류지 식별자(React key, 마커 구분용) */
  stopId: number;
  /** 관광지 식별자(마커 선택 시 전달) */
  spotId: number;
  /** 방문 순서(1부터 시작). 1번이 출발 마커로 표시된다. */
  order: number;
  name: string;
  latitude: number;
  longitude: number;
};

type CourseMapProps = {
  /** 방문 순서대로 정렬된 정류지 */
  stops: CourseMapStop[];
  /** 마커를 눌렀을 때 관광지 식별자를 전달한다. */
  onSelectStop?: (spotId: number) => void;
  /** 스크린리더용 지도 설명 */
  label: string;
  className?: string;
};

const MAP_LEVEL = 5;
const MAP_PADDING = 56;
const ROUTE_COLOR = '#1db954';
const mapSizeClassName = 'h-72 sm:h-[360px] lg:h-[420px]';
const fallbackClassName = 'min-h-72 rounded-none sm:min-h-[360px] lg:min-h-[420px]';

/** 방문 순서 번호를 담은 마커. 출발 정류지는 더 크고 "출발" 라벨이 붙는다. */
function createStopMarker(stop: CourseMapStop, isStart: boolean, onSelect: () => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.title = `${stop.order}. ${stop.name}`;
  button.setAttribute('aria-label', `${isStart ? '출발 ' : ''}${stop.order}번 ${stop.name}`);
  button.className = isStart
    ? 'relative grid h-12 w-12 place-items-center rounded-full bg-primary text-base font-black text-primary-foreground shadow-lg ring-4 ring-primary/30'
    : 'grid h-10 w-10 place-items-center rounded-full border-2 border-primary bg-background text-sm font-black text-foreground shadow-md';
  button.textContent = String(stop.order);

  if (isStart) {
    const badge = document.createElement('span');
    badge.className =
      'absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-bold text-background shadow-md';
    badge.textContent = '출발';
    button.appendChild(badge);
  }

  button.addEventListener('click', onSelect);
  return { element: button, dispose: () => button.removeEventListener('click', onSelect) };
}

/**
 * 코스의 정류지를 방문 순서 번호 마커와 경로 선으로 보여 준다. 앱 키가 없거나 표시할 좌표가
 * 없으면 플레이스홀더를, SDK 로드에 실패하면 안내 문구와 다시 시도 버튼을 보여 준다.
 */
export function CourseMap({ stops, onSelectStop, label, className }: CourseMapProps) {
  const appKey = getKakaoMapAppKey();
  const validStops = useMemo(
    () => stops.filter((stop) => isValidCoordinate(stop.latitude, stop.longitude)),
    [stops],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ container: HTMLElement; map: KakaoMap } | null>(null);
  const onSelectRef = useRef(onSelectStop);

  useEffect(() => {
    onSelectRef.current = onSelectStop;
  }, [onSelectStop]);

  const { status, maps, retry } = useKakaoMaps(appKey, appKey !== '' && validStops.length > 0);

  useEffect(() => {
    const container = containerRef.current;
    if (!maps || !container || validStops.length === 0) return;

    // 같은 컨테이너에는 지도를 한 번만 만들고, 정류지가 바뀌면 오버레이만 교체한다.
    if (mapRef.current?.container !== container) {
      const first = validStops[0];
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
    const path = validStops.map((stop) => new maps.LatLng(stop.latitude, stop.longitude));
    path.forEach((position) => bounds.extend(position));

    const polyline =
      path.length > 1
        ? new maps.Polyline({
            map,
            path,
            strokeWeight: 4,
            strokeColor: ROUTE_COLOR,
            strokeOpacity: 0.85,
            strokeStyle: 'solid',
          })
        : null;

    const markers = validStops.map((stop, index) => {
      const isStart = stop.order === 1;
      const marker = createStopMarker(stop, isStart, () => onSelectRef.current?.(stop.spotId));
      const overlay = new maps.CustomOverlay({
        map,
        position: path[index],
        content: marker.element,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: isStart ? 20 : 10,
        clickable: true,
      });
      return { overlay, dispose: marker.dispose };
    });

    if (path.length > 1) {
      map.setBounds(bounds, MAP_PADDING, MAP_PADDING, MAP_PADDING, MAP_PADDING);
    } else {
      map.setCenter(path[0]);
    }

    return () => {
      markers.forEach(({ overlay, dispose }) => {
        dispose();
        overlay.setMap(null);
      });
      polyline?.setMap(null);
    };
  }, [maps, validStops]);

  if (appKey === '') {
    return (
      <SpotMapPlaceholder
        className={cn(fallbackClassName, className)}
        description="카카오맵 앱 키를 설정하면 방문 순서를 지도에 표시합니다. 아래 목록에서 순서와 좌표를 확인하세요."
        title="코스 경로"
      />
    );
  }

  if (validStops.length === 0) {
    return (
      <SpotMapPlaceholder
        className={cn(fallbackClassName, className)}
        description="지도에 표시할 수 있는 위치 정보가 없습니다. 아래 목록에서 정류지를 확인하세요."
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
        className={cn(fallbackClassName, className)}
        description="네트워크 상태나 카카오맵 앱 키·허용 도메인 설정을 확인한 뒤 다시 시도해 주세요."
        title="지도를 불러오지 못했습니다"
      />
    );
  }

  return (
    <div
      aria-busy={status === 'loading'}
      aria-label={label}
      className={cn('overflow-hidden', mapSizeClassName, className)}
      ref={containerRef}
      role="region"
    />
  );
}
